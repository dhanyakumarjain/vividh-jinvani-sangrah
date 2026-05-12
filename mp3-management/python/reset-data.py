"""
reset-data.py
Resets songs.json and playlists.json to empty.
Does NOT delete files from media/ folder (that's the HF clone).
"""

import os
import json

SCRIPT_DIR     = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SONGS_PATH     = os.path.join(SCRIPT_DIR, "data", "songs.json")
PLAYLISTS_PATH = os.path.join(SCRIPT_DIR, "data", "playlists.json")


def main():
    print("=" * 60)
    print("  RESET WEBSITE DATA")
    print("=" * 60)
    print()
    print("This will reset songs.json and playlists.json to empty.")
    print()
    print("NOTE: This does NOT delete files from media/ folder.")
    print("      To delete songs, use Delete-All-Songs.bat instead.")
    print()
    
    confirm = input("Type YES to confirm: ").strip()
    if confirm != "YES":
        print("\nAborted.")
        return

    # Reset songs.json
    with open(SONGS_PATH, "w", encoding="utf-8") as f:
        json.dump({"songs": []}, f, indent=2)
    print("\n[OK] Reset data/songs.json")

    # Reset playlists.json
    with open(PLAYLISTS_PATH, "w", encoding="utf-8") as f:
        json.dump({"playlists": []}, f, indent=2)
    print("[OK] Reset data/playlists.json")

    print("\nDone! Your website data has been reset.")
    print("\nNext steps:")
    print("  1. Run STEP-2-Update-Website.bat to regenerate from media/")
    print("  2. Or manually edit the JSON files")


if __name__ == "__main__":
    main()
