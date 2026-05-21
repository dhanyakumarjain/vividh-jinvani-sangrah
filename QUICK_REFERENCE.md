# 🎵 MUSIC PLAYER - QUICK REFERENCE GUIDE

## 🚀 QUICK START

### Testing Locally
```bash
# Windows - Double-click this file:
mp3-management\TOOL-Test-Website.bat

# Or run manually:
python scripts\serve.py
```
Then open: http://localhost:8080

### Adding New Songs
```bash
# 1. Add MP3 files to media folder (or subfolders)
# 2. Run sync tool:
mp3-management\TOOL-Sync-Local.bat

# 3. Hard refresh browser:
Ctrl + Shift + R
```

---

## 📁 PROJECT STRUCTURE

```
vividh-jinvani-sangrah/
├── index.html              # Main HTML file
├── script.js               # Main JavaScript (all features)
├── style.css               # All styles
├── data/
│   ├── songs.json          # Song database
│   ├── playlists.json      # Playlist database
│   └── config.json         # Configuration & themes
├── media/                  # Audio files (MP3, etc.)
│   ├── 0000 Daily Songs/   # Default playlist
│   ├── 0101 Folder/        # Numbered playlists
│   └── ...
├── scripts/
│   └── serve.py            # HTTP server with Range support
└── mp3-management/
    ├── python/
    │   ├── sync-local-media.py    # Incremental sync
    │   ├── fetch_songs.py         # GitHub sync
    │   └── reset-data.py          # Reset data files
    └── TOOL-*.bat          # Windows shortcuts
```

---

## 🎯 KEY FEATURES

### 1. Playlist Management
- **Create:** Click "Playlists ▾" → "+ New Playlist"
- **Auto-numbering:** New playlists get "0001 ", "0002 ", etc.
- **Rename:** Click ⋮ menu → "Rename"
- **Delete:** Click ⋮ menu → "Delete"
- **Add songs:** Click ⋮ on song → "Add to Playlist"

### 2. Favorites
- Click ♡ icon on any song to add/remove from favorites
- View all favorites in "♥" tab

### 3. Recent Playlist
- Automatically tracks last 10 played songs
- View in "Recent" tab

### 4. Search
- Type in search box to filter songs
- Searches: title, artist, album, alternate names

### 5. Playback Controls
- **Play/Pause:** Click ▶/❚❚ button or song
- **Next/Previous:** Click ▶▶/◀◀ buttons
- **Seek:** Drag progress bar (works on long songs!)
- **Shuffle:** Click 🔀 button
- **Repeat:** Click 🔁 button
- **Volume:** Adjust slider or click 🔊 to mute

### 6. Themes
- Click ⚙ (Settings) → Choose from 15 themes
- Switch between Light/Dark mode

### 7. Data Management
- **Export:** Settings → Export (saves to JSON file)
- **Import:** Settings → Import (restore from JSON)
- **Clear All:** Settings → Clear All (deletes user data)

---

## 🔧 MANAGEMENT TOOLS

### Sync Local Media (Incremental)
```bash
mp3-management\TOOL-Sync-Local.bat
```
- Scans media folder for audio files
- Only adds NEW files (doesn't touch existing)
- Preserves song IDs
- Updates songs.json and playlists.json

### Test Website
```bash
mp3-management\TOOL-Test-Website.bat
```
- Starts local server with HTTP Range support
- Opens browser automatically
- Required for audio seeking to work

### Reset Data
```bash
mp3-management\TOOL-Reset-Data.bat
```
- Clears songs.json and playlists.json
- Use before full rebuild
- **Warning:** Deletes all song data!

---

## 📊 DATA FILES

### songs.json
```json
{
  "songs": [
    {
      "id": "s0001",
      "title": "Song Name",
      "artist": "Artist Name",
      "album": "Album Name",
      "altName": [],
      "duration": 0,
      "file": "media/folder/song.mp3",
      "size_mb": 3.5
    }
  ]
}
```

### playlists.json
```json
{
  "playlists": [
    {
      "id": "pl-folder-name",
      "name": "0000 Daily Songs",
      "songIds": ["s0001", "s0002"]
    }
  ]
}
```

### config.json
- `title`: Main title
- `subtitle`: Subtitle text
- `logo`: Logo image path
- `spiritualCaption1/2`: Caption lines
- `lastUpdated`: Timestamp (auto-updated)
- `themes`: Array of 15 theme definitions

---

## 🎨 THEMES

Available themes (15 total):
1. **Spotify** - Green accent
2. **Fire** - Orange/red gradient
3. **Gold** - Golden yellow
4. **Ocean** - Cyan blue
5. **Lavender** - Purple
6. **Emerald** - Green
7. **Crimson** - Deep red
8. **Midnight** - Indigo
9. **Aurora** - Purple gradient
10. **Tropical** - Teal/green gradient
11. **Saffron** - Orange
12. **Moonlight** - Silver gradient
13. **Peacock** - Cyan/indigo gradient
14. **Lotus** - Pink gradient
15. **Sandalwood** - Brown/tan

Each theme has Light and Dark modes.

---

## 📱 BROWSER STORAGE

### localStorage Keys
- `mp2_state` - Player state (current song, volume, etc.)
- `mp2_favorites` - Favorite song IDs
- `mp2_playlists` - User-created playlists
- `mp2_recentlyPlayed` - Recent 10 songs
- `mp2_theme` - Theme preferences

### Clear Browser Data
1. Settings → Clear All (in-app)
2. Or browser: F12 → Application → Local Storage → Clear

---

## 🔍 TROUBLESHOOTING

### Songs not appearing after sync
**Solution:** Hard refresh browser
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

### Audio seeking not working
**Solution:** Use the custom server (serve.py)
```bash
python scripts\serve.py
```
Regular HTTP servers don't support Range requests.

### Duplicate songs showing
**Solution:** Already fixed! Duplicates are removed based on filename.

### Playlist not appearing at top
**Solution:** Name it with 4-digit prefix: "0001 My Playlist"

### Playback doesn't resume
**Solution:** Feature saves position every 5 seconds. Play for at least 5s before closing.

### Google Analytics not tracking
**Solution:** Check that gtag.js loaded (view page source, check network tab)

---

## 📈 GOOGLE ANALYTICS

### Tracked Events (24 total)
- **Playback:** song_play, song_pause, song_complete, playback_error
- **Navigation:** player_next, player_previous, player_restart, player_seek
- **Controls:** shuffle_toggle, repeat_toggle, volume_change, volume_mute
- **Playlists:** playlist_create, playlist_rename, playlist_delete, playlist_add_song, playlist_remove_song
- **Favorites:** favorite_add, favorite_remove
- **Views:** view_change, search
- **Settings:** theme_change, theme_mode_change, settings_export, settings_import, data_clear

### View Analytics
1. Go to: https://analytics.google.com
2. Select property: G-BD4VBH0SJT
3. View Events report

---

## 🎯 BEST PRACTICES

### Adding Songs
1. Organize in folders (becomes playlists)
2. Use 4-digit prefix for numbered playlists (0101, 0102, etc.)
3. Run incremental sync (TOOL-Sync-Local.bat)
4. Hard refresh browser

### Playlist Naming
- **Numbered:** "0001 My Playlist" (appears at top)
- **Regular:** "My Playlist" (appears after numbered)
- **Seeded:** From folders (marked with 💾 icon)

### Data Backup
1. Export settings regularly (Settings → Export)
2. Keep backup of data/ folder
3. Before major changes, copy songs.json and playlists.json

### Performance
- Keep songs.json under 10MB for fast loading
- Use compressed audio formats (MP3 recommended)
- Clear browser cache if experiencing issues

---

## 🚀 PUBLISHING

### To GitHub Pages
```bash
# 1. Commit changes
git add .
git commit -m "Update songs"

# 2. Push to GitHub
git push origin main

# 3. Enable GitHub Pages in repository settings
# Settings → Pages → Source: main branch
```

### To Other Hosting
1. Upload all files to web server
2. Ensure server supports HTTP Range requests
3. Update Google Analytics ID if needed
4. Test audio seeking functionality

---

## 📞 SUPPORT CHECKLIST

If something doesn't work:
- [ ] Check browser console (F12) for errors
- [ ] Verify server is running (scripts/serve.py)
- [ ] Hard refresh browser (Ctrl + Shift + R)
- [ ] Check media files exist in media folder
- [ ] Verify songs.json is valid JSON
- [ ] Clear browser localStorage (Settings → Clear All)
- [ ] Try different browser
- [ ] Check file permissions

---

## 🎉 FEATURES SUMMARY

✅ **10 Major Features Implemented:**
1. Google Analytics tracking (24 events)
2. Duplicate song removal
3. Numbered playlist sorting
4. Audio seeking (HTTP Range support)
5. Auto-incrementing playlist creation
6. Default view (All Songs)
7. Clear all user data
8. Recent playlist limit (10 entries)
9. Incremental sync (only new songs)
10. Resume playback from last position

✅ **Additional Features:**
- 15 beautiful themes (Light/Dark modes)
- Favorites management
- Search functionality
- Shuffle and repeat modes
- Volume control with mute
- Export/Import settings
- Responsive design (mobile-friendly)
- Touch-friendly controls
- Error handling
- Spiritual artwork display

---

**Last Updated:** May 21, 2026  
**Version:** 2.0 (Production Ready)  
**Status:** ✅ All Features Verified
