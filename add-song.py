"""
add-song.py
Usage:
    python add-song.py "E:\\path\\to\\song.mp3"
    python add-song.py "E:\\path\\to\\folder"
"""

import sys
import os
import json
import shutil
import time

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MEDIA_DIR  = os.path.join(SCRIPT_DIR, "media")
JSON_PATH  = os.path.join(MEDIA_DIR, "media.json")


def collect_mp3s(path):
    """Return list of mp3 file paths from a file or folder."""
    mp3s = []
    if os.path.isdir(path):
        for root, _, files in os.walk(path):
            for f in files:
                if f.lower().endswith(".mp3"):
                    mp3s.append(os.path.join(root, f))
        print(f"Folder: found {len(mp3s)} MP3(s) in '{path}'")
    elif os.path.isfile(path):
        if path.lower().endswith(".mp3"):
            mp3s.append(path)
        else:
            print(f"SKIP: '{path}' is not an MP3.")
    else:
        print(f"WARNING: Path not found — '{path}'")
    return mp3s


def load_media_json():
    if not os.path.exists(JSON_PATH):
        return {"songs": []}
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def save_media_json(data):
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def make_display_name(filename):
    name = os.path.splitext(filename)[0]
    # strip leading symbols/numbers like "✽0105.00 "
    import re
    name = re.sub(r'^[\W\d\.]+', '', name).strip()
    name = name.replace("_", " ").replace("-", " ").strip()
    return name


def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print('  python add-song.py "path\\to\\song.mp3"')
        print('  python add-song.py "path\\to\\folder"')
        sys.exit(1)

    input_path = sys.argv[1]

    # Ensure media folder exists
    os.makedirs(MEDIA_DIR, exist_ok=True)

    # Collect MP3s
    mp3s = collect_mp3s(input_path)
    if not mp3s:
        print("No MP3 files found. Nothing to do.")
        sys.exit(0)

    # Load media.json
    media_data = load_media_json()
    songs = media_data.get("songs", [])
    existing_files = {s["file"] for s in songs}

    added = 0
    for src in mp3s:
        filename = os.path.basename(src)
        dest     = os.path.join(MEDIA_DIR, filename)
        rel_path = f"media/{filename}"

        # Copy file
        if os.path.exists(dest):
            print(f"EXISTS (skip copy): {filename}")
        else:
            shutil.copy2(src, dest)
            print(f"Copied: {filename}")

        # Skip if already in media.json
        if rel_path in existing_files:
            print(f"EXISTS in media.json (skip): {filename}")
            continue

        display_name = make_display_name(filename)
        new_id = f"s{int(time.time() * 1000) + added}"

        songs.append({
            "id":       new_id,
            "title":    display_name,
            "artist":   "",
            "album":    "",
            "altName":  [],
            "duration": 0,
            "file":     rel_path
        })
        existing_files.add(rel_path)
        added += 1
        print(f"Added to media.json: {display_name}")

    media_data["songs"] = songs
    save_media_json(media_data)

    print()
    if added:
        print(f"Done! Added {added} new song(s) to media.json.")
        print("TIP: Open media.json to fill in artist, album, altName, duration.")
    else:
        print("No new songs added (all already present).")


if __name__ == "__main__":
    main()
