"""
reset-data.py
Deletes all MP3s under media/ (including subfolders) and resets songs.json and playlists.json to empty.
"""

import os
import json
import shutil

SCRIPT_DIR     = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MEDIA_DIR      = os.path.join(SCRIPT_DIR, "media")
SONGS_PATH     = os.path.join(SCRIPT_DIR, "data", "songs.json")
PLAYLISTS_PATH = os.path.join(SCRIPT_DIR, "data", "playlists.json")


def main():
    confirm = input("This will DELETE all MP3s and reset songs/playlists. Type YES to confirm: ").strip()
    if confirm != "YES":
        print("Aborted.")
        return

    # Delete all MP3s and subfolders under media/
    deleted = 0
    if os.path.exists(MEDIA_DIR):
        for entry in os.listdir(MEDIA_DIR):
            entry_path = os.path.join(MEDIA_DIR, entry)
            if os.path.isdir(entry_path):
                shutil.rmtree(entry_path)
                print(f"Deleted folder: media/{entry}")
            elif entry.lower().endswith(".mp3"):
                os.remove(entry_path)
                print(f"Deleted: media/{entry}")
                deleted += 1
    print(f"\nDeleted {deleted} MP3 file(s) and all subfolders.")

    # Reset songs.json
    with open(SONGS_PATH, "w", encoding="utf-8") as f:
        json.dump({"songs": []}, f, indent=2)
    print("Reset data/songs.json")

    # Reset playlists.json
    with open(PLAYLISTS_PATH, "w", encoding="utf-8") as f:
        json.dump({"playlists": []}, f, indent=2)
    print("Reset data/playlists.json")

    print("\nDone.")


if __name__ == "__main__":
    main()
