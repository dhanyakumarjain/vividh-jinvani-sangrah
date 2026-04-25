"""
sync-media.py
Scans media/ subfolders, each folder = one playlist.
Rebuilds data/songs.json and data/playlists.json from scratch.

Usage:
    python sync-media.py

Media folder structure:
    media/
        Morning Bhakti/
            song1.mp3
            song2.mp3
        Evening Aarti/
            song3.mp3
"""

import os
import json
import re

SCRIPT_DIR   = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MEDIA_DIR    = os.path.join(SCRIPT_DIR, "media")
DATA_DIR     = os.path.join(SCRIPT_DIR, "data")
SONGS_PATH   = os.path.join(DATA_DIR, "songs.json")
PLAYLISTS_PATH = os.path.join(DATA_DIR, "playlists.json")


def make_display_name(filename):
    name = os.path.splitext(filename)[0]
    name = re.sub(r'^[\W\d\.]+', '', name).strip()
    name = name.replace("_", " ").replace("-", " ").strip()
    return name


def make_playlist_id(folder_name):
    slug = folder_name.lower().strip()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[\s]+', '-', slug)
    return f"pl-{slug}"


def main():
    os.makedirs(DATA_DIR, exist_ok=True)

    # Collect all unique songs across all folders
    # key = filename (lowercase), value = song dict
    all_songs = {}      # filename -> song dict
    song_counter = [0]  # mutable for closure

    def get_or_create_song(rel_path, filename):
        key = filename.lower()
        if key in all_songs:
            return all_songs[key]["id"]
        song_counter[0] += 1
        song_id = f"s{song_counter[0]:04d}"
        all_songs[key] = {
            "id":       song_id,
            "title":    make_display_name(filename),
            "artist":   "",
            "album":    "",
            "altName":  [],
            "duration": 0,
            "file":     rel_path
        }
        return song_id

    playlists = []

    # Scan subfolders of media/
    if not os.path.exists(MEDIA_DIR):
        print(f"ERROR: media/ folder not found at {MEDIA_DIR}")
        return

    folders = sorted([
        f for f in os.listdir(MEDIA_DIR)
        if os.path.isdir(os.path.join(MEDIA_DIR, f))
    ])

    if not folders:
        print("No subfolders found in media/. Create folders like media/Morning Bhakti/ and put MP3s inside.")
    
    for folder in folders:
        folder_path = os.path.join(MEDIA_DIR, folder)
        mp3s = sorted([
            f for f in os.listdir(folder_path)
            if f.lower().endswith(".mp3")
        ])

        song_ids = []
        for filename in mp3s:
            rel_path = f"media/{folder}/{filename}"
            key = filename.lower()
            already_exists = key in all_songs
            song_id = get_or_create_song(rel_path, filename)
            song_ids.append(song_id)
            status = "SKIP (duplicate)" if already_exists else "OK"
            print(f"  [{folder}] {filename} -> {song_id} {status}")

        playlists.append({
            "id":      make_playlist_id(folder),
            "name":    folder,
            "songIds": song_ids
        })
        print(f"Playlist '{folder}': {len(song_ids)} song(s)")

    # Also pick up MP3s directly in media/ root (no folder) — add to songs but no playlist
    root_mp3s = sorted([
        f for f in os.listdir(MEDIA_DIR)
        if f.lower().endswith(".mp3")
    ])
    for filename in root_mp3s:
        rel_path = f"media/{filename}"
        key = filename.lower()
        already_exists = key in all_songs
        song_id = get_or_create_song(rel_path, filename)
        status = "SKIP (duplicate)" if already_exists else "OK"
        print(f"  [root] {filename} -> {song_id} {status}")

    # Write songs.json
    songs_data = {"songs": list(all_songs.values())}
    with open(SONGS_PATH, "w", encoding="utf-8") as f:
        json.dump(songs_data, f, ensure_ascii=False, indent=2)
    print(f"\nWrote {len(all_songs)} song(s) to data/songs.json")

    # Write playlists.json
    playlists_data = {"playlists": playlists}
    with open(PLAYLISTS_PATH, "w", encoding="utf-8") as f:
        json.dump(playlists_data, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(playlists)} playlist(s) to data/playlists.json")
    print("\nDone! Run git-push.bat to deploy.")


if __name__ == "__main__":
    main()
