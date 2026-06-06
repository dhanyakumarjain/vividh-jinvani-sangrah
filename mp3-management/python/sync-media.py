"""
sync-media.py
Fetches songs from Hugging Face dataset and rebuilds data/songs.json and data/playlists.json.
Updates lastUpdated timestamp in config.json.

Usage:
    python sync-media.py
"""

import os
import json
import re
import ssl
import urllib.request
import urllib.parse
from datetime import datetime

SCRIPT_DIR   = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR     = os.path.join(SCRIPT_DIR, "data")
SONGS_PATH   = os.path.join(DATA_DIR, "songs.json")
PLAYLISTS_PATH = os.path.join(DATA_DIR, "playlists.json")
CONFIG_PATH  = os.path.join(DATA_DIR, "config.json")

BASE_API = "https://huggingface.co/api/datasets/dhanyakumarjain/temp/tree/main"
BASE_URL = "https://huggingface.co/datasets/dhanyakumarjain/temp/resolve/main"


def fetch_tree(path=""):
    """Fetch directory tree from Hugging Face API"""
    url = BASE_API + ("/" + urllib.parse.quote(path, safe="") if path else "")
    
    # Create SSL context that doesn't verify certificates
    # This is needed for some Windows environments with certificate issues
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    
    with urllib.request.urlopen(url, context=ssl_context) as resp:
        return json.loads(resp.read())


def slugify(text):
    """Convert text to URL-friendly slug"""
    text = text.strip().lower()
    text = re.sub(r"[^\w\sऀ-ॿ-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    return text


def collect_entries(path=""):
    """Recursively collect all MP3 files from Hugging Face dataset"""
    entries = []
    for item in fetch_tree(path):
        if item["type"] == "directory":
            entries.extend(collect_entries(item["path"]))
        elif item["path"].endswith(".mp3"):
            parts = item["path"].split("/")
            encoded_path = "/".join(
                urllib.parse.quote(segment, safe="") for segment in parts
            )
            folder = "/".join(parts[:-1]) if len(parts) > 1 else ""
            entries.append({
                "name": parts[-1].replace(".mp3", ""),
                "folder": folder,
                "url": f"{BASE_URL}/{encoded_path}",
                "size_mb": round(item["size"] / (1024 * 1024), 1),
            })
    return entries


def main():
    os.makedirs(DATA_DIR, exist_ok=True)

    print("Fetching songs from Hugging Face...")
    entries = collect_entries()
    print(f"Found {len(entries)} MP3 files")

    songs_list = []
    playlists_map = {}
    counter = 1

    for entry in entries:
        song_id = f"s{counter:04d}"
        counter += 1

        song_obj = {
            "id": song_id,
            "title": entry["name"],
            "artist": "",
            "album": "",
            "altName": [],
            "duration": 0,
            "file": entry["url"],
            "size_mb": entry["size_mb"],
        }
        songs_list.append(song_obj)

        folder = entry["folder"] or "0000 Super Songs"
        if folder not in playlists_map:
            playlists_map[folder] = []
        playlists_map[folder].append(song_id)
        
        # Check if filename ends with single ✽ (not ✽✽ or more)
        # Add to "0000 Super Songs" if it ends with exactly one ✽
        if entry["name"].endswith("✽") and not entry["name"].endswith("✽✽"):
            if "0000 Super Songs" not in playlists_map:
                playlists_map["0000 Super Songs"] = []
            # Only add if not already in the playlist (avoid duplicates)
            if song_id not in playlists_map["0000 Super Songs"]:
                playlists_map["0000 Super Songs"].append(song_id)
        
        print(f"  [{folder}] {entry['name']} -> {song_id}")

    # Write songs.json as array
    songs_out = {"songs": songs_list}
    with open(SONGS_PATH, "w", encoding="utf-8") as f:
        json.dump(songs_out, f, ensure_ascii=False, indent=2)
    print(f"\nWrote {len(songs_list)} song(s) to {SONGS_PATH}")

    # Write playlists.json
    playlists_list = []
    for folder, song_ids in playlists_map.items():
        pl_id = f"pl-{slugify(folder)}"
        playlists_list.append({
            "id": pl_id,
            "name": folder,
            "songIds": song_ids,
        })

    playlists_out = {"playlists": playlists_list}
    with open(PLAYLISTS_PATH, "w", encoding="utf-8") as f:
        json.dump(playlists_out, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(playlists_list)} playlist(s) to {PLAYLISTS_PATH}")
    
    # Update lastUpdated in config.json
    update_config_timestamp()
    
    print("\nDone! Run git-push.bat to deploy.")


def update_config_timestamp():
    """Update the lastUpdated field in config.json with current timestamp"""
    try:
        # Read existing config
        if os.path.exists(CONFIG_PATH):
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                config = json.load(f)
        else:
            config = {}
        
        # Update timestamp
        config["lastUpdated"] = datetime.now().isoformat()
        
        # Write back
        with open(CONFIG_PATH, "w", encoding="utf-8") as f:
            json.dump(config, f, ensure_ascii=False, indent=2)
        
        print(f"Updated lastUpdated in config.json: {config['lastUpdated']}")
    except Exception as e:
        print(f"Warning: Could not update config.json timestamp: {e}")


if __name__ == "__main__":
    main()
