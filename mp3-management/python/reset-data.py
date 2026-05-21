"""
reset-data.py
Clears local media folder and resets songs.json and playlists.json to empty.
Does NOT push to Hugging Face - local only.
"""

import os
import json
import shutil

SCRIPT_DIR     = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MEDIA_DIR      = os.path.join(SCRIPT_DIR, "media")
SONGS_PATH     = os.path.join(SCRIPT_DIR, "data", "songs.json")
PLAYLISTS_PATH = os.path.join(SCRIPT_DIR, "data", "playlists.json")


def main():
    print("=" * 60)
    print("  RESET LOCAL DATA")
    print("=" * 60)
    print()
    print("This will:")
    print("  1. Delete ALL files from media/ folder")
    print("  2. Empty songs.json and playlists.json")
    print()
    print("This does NOT push to Hugging Face.")
    print("Changes are LOCAL only.")
    print()
    print("WARNING: This cannot be undone!")
    print()
    
    confirm = input("Type 'DELETE ALL' to confirm (case-sensitive): ").strip()
    if confirm != "DELETE ALL":
        print("\nAborted.")
        return

    deleted_files = 0
    deleted_folders = 0

    # Delete all files and folders from media/ (except .git)
    if os.path.exists(MEDIA_DIR):
        print()
        print("Deleting files from media/ folder...")
        print()
        
        for entry in os.listdir(MEDIA_DIR):
            # Skip .git folder and .gitattributes
            if entry in ['.git', '.gitattributes']:
                continue
            
            entry_path = os.path.join(MEDIA_DIR, entry)
            
            if os.path.isdir(entry_path):
                shutil.rmtree(entry_path)
                print(f"  [DELETED] Folder: {entry}/")
                deleted_folders += 1
            else:
                os.remove(entry_path)
                print(f"  [DELETED] File: {entry}")
                deleted_files += 1
    else:
        print("\n[INFO] Media folder does not exist")

    print()
    print(f"[OK] Deleted {deleted_files} file(s) and {deleted_folders} folder(s)")

    # Reset songs.json
    with open(SONGS_PATH, "w", encoding="utf-8") as f:
        json.dump({"songs": []}, f, indent=2)
    print("[OK] Reset data/songs.json")

    # Reset playlists.json
    with open(PLAYLISTS_PATH, "w", encoding="utf-8") as f:
        json.dump({"playlists": []}, f, indent=2)
    print("[OK] Reset data/playlists.json")

    print()
    print("=" * 60)
    print("  DONE!")
    print("=" * 60)
    print()
    print("Local data has been reset.")
    print()
    print("IMPORTANT:")
    print("  - Files deleted from media/ folder")
    print("  - JSON files emptied")
    print("  - Changes are LOCAL only")
    print("  - Hugging Face still has the old files")
    print()
    print("⚠️  USER-CREATED PLAYLISTS:")
    print("  User-created playlists (0001, 0002, etc.) are stored in")
    print("  your browser's localStorage, not in JSON files.")
    print()
    print("  To delete user-created playlists:")
    print("  1. Open the website in your browser")
    print("  2. Press F12 to open Developer Tools")
    print("  3. Go to 'Application' or 'Storage' tab")
    print("  4. Click 'Local Storage' → 'http://localhost:8080'")
    print("  5. Find 'mp2_playlists' and delete it")
    print("  6. Refresh the page (Ctrl + Shift + R)")
    print()
    print("  OR simply clear all browser data for localhost:8080")
    print()
    print("To delete from Hugging Face:")
    print("  Run: Delete-All-Songs.bat")
    print()
    print("To add new songs:")
    print("  1. Add files to media/ folder")
    print("  2. Run: STEP-1-Upload-Songs.bat")
    print("  3. Run: STEP-2-Update-Website.bat")


if __name__ == "__main__":
    main()
