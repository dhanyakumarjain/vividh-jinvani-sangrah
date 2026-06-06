import json
import re
import urllib.request
import urllib.parse

BASE_API = "https://huggingface.co/api/datasets/dhanyakumarjain/temp/tree/main"
BASE_URL = "https://huggingface.co/datasets/dhanyakumarjain/temp/resolve/main"


def fetch_tree(path=""):
    url = BASE_API + ("/" + urllib.parse.quote(path, safe="") if path else "")
    with urllib.request.urlopen(url) as resp:
        return json.loads(resp.read())


def slugify(text):
    text = text.strip().lower()
    text = re.sub(r"[^\w\sऀ-ॿ-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    return text


def collect_entries(path=""):
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


if __name__ == "__main__":
    entries = collect_entries()

    songs_dict = {}
    playlists_map = {}
    counter = 1

    for entry in entries:
        song_id = f"s{counter:04d}"
        counter += 1

        songs_dict[song_id] = {
            "id": song_id,
            "name": entry["name"],
            "url": entry["url"],
            "size_mb": entry["size_mb"],
        }

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

    songs_out = {"songs": songs_dict}

    playlists_list = []
    for folder, song_ids in playlists_map.items():
        pl_id = f"pl-{slugify(folder)}"
        playlists_list.append({
            "id": pl_id,
            "name": folder,
            "songIds": song_ids,
        })

    playlists_out = {"playlists": playlists_list}

    with open("songs.json", "w", encoding="utf-8") as f:
        json.dump(songs_out, f, ensure_ascii=False, indent=2)

    with open("playlists.json", "w", encoding="utf-8") as f:
        json.dump(playlists_out, f, ensure_ascii=False, indent=2)

    print(f"Saved {len(songs_dict)} songs to songs.json")
    print(f"Saved {len(playlists_list)} playlists to playlists.json")
