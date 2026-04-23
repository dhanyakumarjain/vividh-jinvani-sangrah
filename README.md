# विविध जिनवाणी संग्रह MP3 — धन्यकुमार जैन द्वारा

A minimal, mobile-friendly music player for Jain devotional audio. Built with plain HTML, CSS, and vanilla JavaScript. No frameworks. Works on GitHub Pages.

🔗 **Live site:** https://dhanyakumarjain.github.io/vividh-jinvani-sangrah/

---

## Project Structure

```
├── index.html       # Main UI
├── style.css        # Styles (dark/light theme)
├── script.js        # All player logic
├── media.json       # Song metadata
├── media/           # MP3 files
├── add-song.bat     # Helper: add a new MP3
└── add-song.ps1     # PowerShell logic for add-song.bat
```

---

## Features

- Real-time search (matches display name + alternate names)
- Play / Pause / Next / Previous
- Playback modes: Sequential, Shuffle, Repeat All, Repeat One
- Favorites — persisted in localStorage
- Custom playlists — create, delete, add/remove songs
- Recently played tab
- Waveform visualization (canvas)
- Dark / Light theme toggle
- Mini player (sticky bottom bar on mobile)
- Export / Import all user data as JSON
- Keyboard shortcuts: `Space` play/pause · `←/→` seek · `↑/↓` volume
- GitHub Pages ready — all paths relative

---

## Adding New Songs

### Option 1 — Drag & Drop (easiest)

Drag any `.mp3` file onto `add-song.bat`. It will:
1. Copy the MP3 into the `/media` folder
2. Add a new entry to `media.json` automatically

### Option 2 — Command Line

```bat
add-song.bat "C:\Music\my-song.mp3"
```

### Option 3 — Manual

1. Copy your `.mp3` into the `/media` folder
2. Open `media.json` and add an entry:

```json
{
  "id": "s001",
  "fileName": "my-song.mp3",
  "displayName": "My Song Title",
  "alternateNames": ["keyword1", "keyword2"],
  "filePath": "media/my-song.mp3"
}
```

> After adding songs, fill in `alternateNames` in `media.json` for better search results.

---

## Deploying to GitHub Pages

1. Push all files to the `main` branch
2. Go to **Settings → Pages**
3. Set source to `main` branch, `/ (root)`
4. Save — site goes live at `https://<username>.github.io/<repo>/`

---

## Export / Import User Data

Click **⬆** to export your favorites, playlists, theme, and volume as a JSON file.  
Click **⬇** to import a previously exported file and restore your data.
