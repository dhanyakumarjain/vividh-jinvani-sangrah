"""
sync-local-media.py
Scans local media/ folder and generates songs.json and playlists.json.
Works offline - no internet needed.
"""

import os
import json
import re
from datetime import datetime

SCRIPT_DIR   = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MEDIA_DIR    = os.path.join(SCRIPT_DIR, "media")
DATA_DIR     = os.path.join(SCRIPT_DIR, "data")
SONGS_PATH   = os.path.join(DATA_DIR, "songs.json")
PLAYLISTS_PATH = os.path.join(DATA_DIR, "playlists.json")
CONFIG_PATH  = os.path.join(DATA_DIR, "config.json")

# Supported audio formats
AUDIO_EXTENSIONS = {'.mp3', '.wma', '.wav', '.flac', '.aac', '.m4a', '.ogg', '.opus'}


def slugify(text):
    """Convert text to URL-friendly slug"""
    text = text.strip().lower()
    text = re.sub(r"[^\w\sऀ-ॿ-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    return text


def get_file_size_mb(filepath):
    """Get file size in MB"""
    try:
        size_bytes = os.path.getsize(filepath)
        return round(size_bytes / (1024 * 1024), 1)
    except:
        return 0


def scan_media_folder():
    """Scan media folder and collect all audio files"""
    if not os.path.exists(MEDIA_DIR):
        print(f"[ERROR] Media folder not found: {MEDIA_DIR}")
        return []
    
    entries = []
    
    # Walk through all subdirectories
    for root, dirs, files in os.walk(MEDIA_DIR):
        # Skip .git folder
        if '.git' in dirs:
            dirs.remove('.git')
        
        for filename in files:
            # Check if it's an audio file
            ext = os.path.splitext(filename)[1].lower()
            if ext not in AUDIO_EXTENSIONS:
                continue
            
            filepath = os.path.join(root, filename)
            
            # Get relative path from media folder
            rel_path = os.path.relpath(filepath, MEDIA_DIR)
            
            # Determine folder (playlist)
            path_parts = rel_path.split(os.sep)
            if len(path_parts) > 1:
                folder = os.sep.join(path_parts[:-1])
            else:
                folder = ""
            
            # Get song name (without extension)
            name = os.path.splitext(filename)[0]
            
            entries.append({
                "name": name,
                "folder": folder,
                "file": rel_path.replace(os.sep, '/'),  # Use forward slashes
                "size_mb": get_file_size_mb(filepath),
            })
    
    return entries


def update_config_timestamp():
    """Update the lastUpdated field in config.json"""
    try:
        if os.path.exists(CONFIG_PATH):
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                config = json.load(f)
        else:
            config = {}
        
        config["lastUpdated"] = datetime.now().isoformat()
        
        with open(CONFIG_PATH, "w", encoding="utf-8") as f:
            json.dump(config, f, ensure_ascii=False, indent=2)
        
        print(f"[OK] Updated lastUpdated: {config['lastUpdated']}")
    except Exception as e:
        print(f"[WARNING] Could not update config.json: {e}")


def main():
    print("=" * 60)
    print("  SYNC LOCAL MEDIA FOLDER")
    print("=" * 60)
    print()
    print(f"Scanning: {MEDIA_DIR}")
    print()
    
    os.makedirs(DATA_DIR, exist_ok=True)
    
    # Scan media folder
    entries = scan_media_folder()
    
    if not entries:
        print("[WARNING] No audio files found in media folder!")
        print()
        print("Supported formats:")
        print("  Audio: mp3, wma, wav, flac, aac, m4a, ogg, opus")
        print()
        return
    
    print(f"[OK] Found {len(entries)} audio file(s)")
    print()
    
    # Build songs list
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
            "file": f"media/{entry['file']}",
            "size_mb": entry["size_mb"],
        }
        songs_list.append(song_obj)
        
        folder = entry["folder"] or "0000 Daily Songs"
        if folder not in playlists_map:
            playlists_map[folder] = []
        playlists_map[folder].append(song_id)
        
        print(f"  [{folder}] {entry['name']} -> {song_id}")
    
    # Write songs.json
    songs_out = {"songs": songs_list}
    with open(SONGS_PATH, "w", encoding="utf-8") as f:
        json.dump(songs_out, f, ensure_ascii=False, indent=2)
    print()
    print(f"[OK] Wrote {len(songs_list)} song(s) to {SONGS_PATH}")
    
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
    print(f"[OK] Wrote {len(playlists_list)} playlist(s) to {PLAYLISTS_PATH}")
    
    # Update config timestamp
    update_config_timestamp()
    
    print()
    print("=" * 60)
    print("  DONE!")
    print("=" * 60)
    print()
    print("Next steps:")
    print("  1. Test website locally: Test-Website.bat")
    print("  2. Publish website: STEP-3-Publish-Website.bat")


if __name__ == "__main__":
    main()
