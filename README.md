# 🎵 Audio जिनवाणी संग्रह Player

A beautiful, feature-rich web-based music player for Jain spiritual audio content.

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Version](https://img.shields.io/badge/Version-2.0-blue)
![License](https://img.shields.io/badge/License-Personal%20Use-orange)

---

## ✨ Features

- 🎵 **Full Playback Controls** - Play, pause, next, previous, seek, shuffle, repeat
- 📁 **Smart Playlist Management** - Auto-numbered playlists (0001, 0002, etc.)
- ❤️ **Favorites** - Mark your favorite songs
- 🕐 **Recently Played** - Track last 10 played songs
- 🔍 **Search** - Find songs by title, artist, or album
- 🎨 **15 Beautiful Themes** - Each with Light & Dark modes
- 💾 **Data Management** - Export/import settings, clear all data
- 📊 **Analytics** - Google Analytics tracking (24 events)
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🔄 **Resume Playback** - Continues from where you left off
- ⚡ **Incremental Sync** - Only adds new songs, preserves existing

---

## 🚀 Quick Start

### 1. Install Python

Download and install Python 3.11 or later from [python.org](https://www.python.org/downloads/)

**Important:** Check "Add Python to PATH" during installation!

### 2. Run the Player

**Windows (Easiest):**
```
Double-click: mp3-management\TOOL-Test-Website.bat
```

**Command Line (All Systems):**
```bash
python scripts/serve.py
```

Then open: http://localhost:8080

---

## 📚 Documentation

### Essential Guides
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - How to use all features
- **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** - Move to another computer
- **[VERIFICATION_REPORT.md](VERIFICATION_REPORT.md)** - Complete verification details
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Project overview

### Quick Checklists
- **[FINAL_CHECKLIST.md](FINAL_CHECKLIST.md)** - Pre-archive checklist
- **[MIGRATION_QUICK_CHECKLIST.txt](MIGRATION_QUICK_CHECKLIST.txt)** - Migration steps

### Technical Documentation
- **[GOOGLE_ANALYTICS_EVENTS.md](GOOGLE_ANALYTICS_EVENTS.md)** - Analytics events
- **[TRACKING_DATA_SUMMARY.md](TRACKING_DATA_SUMMARY.md)** - Tracking summary
- **[mp3-management/README.md](mp3-management/README.md)** - Management tools

---

## 🎯 Common Tasks

### Add New Songs
```bash
1. Add MP3 files to media/ folder (or subfolders)
2. Run: mp3-management\TOOL-Sync-Local.bat
3. Hard refresh browser: Ctrl + Shift + R
```

### Create Playlist
```
1. Click "Playlists ▾"
2. Click "+ New Playlist"
3. Type name (auto-numbered: 0001, 0002, etc.)
4. Add songs via ⋮ menu on any song
```

### Backup Your Data
```
1. Open player → Settings → Export
2. Saves favorites, playlists, preferences to JSON file
3. Import later to restore
```

### Change Theme
```
1. Click ⚙ (Settings)
2. Choose from 15 themes
3. Switch between Light/Dark mode
```

---

## 📁 Project Structure

```
vividh-jinvani-sangrah/
├── index.html              # Main HTML file
├── script.js               # Main JavaScript (1,529 lines)
├── style.css               # All styles
├── README.md               # This file
│
├── data/                   # Data files
│   ├── songs.json          # Song database
│   ├── playlists.json      # Playlist database
│   └── config.json         # Configuration & themes
│
├── media/                  # Audio files (MP3, etc.)
│   ├── 0000 Daily Songs/
│   ├── 0101 Folder/
│   └── ...
│
├── scripts/
│   └── serve.py            # HTTP server with Range support
│
├── mp3-management/         # Management tools
│   ├── python/
│   │   ├── sync-local-media.py    # Incremental sync
│   │   ├── fetch_songs.py         # GitHub sync
│   │   └── reset-data.py          # Reset tool
│   ├── TOOL-Test-Website.bat
│   ├── TOOL-Sync-Local.bat
│   └── TOOL-Reset-Data.bat
│
├── css/                    # Modular CSS files
├── img/                    # Images and artwork
└── docs/                   # Documentation files
```

---

## 🔧 Requirements

### Minimum Requirements
- **Python:** 3.11 or later
- **Browser:** Chrome, Firefox, Edge, Safari (any modern browser)
- **Disk Space:** Depends on your MP3 collection

### No Other Software Needed!
- ❌ No Node.js
- ❌ No Apache/Nginx
- ❌ No Database
- ❌ No special web server

Python's built-in server is all you need!

---

## 🎨 Themes

15 beautiful themes available:
1. Spotify (Green)
2. Fire (Orange/Red gradient)
3. Gold (Golden yellow)
4. Ocean (Cyan blue)
5. Lavender (Purple)
6. Emerald (Green)
7. Crimson (Deep red)
8. Midnight (Indigo)
9. Aurora (Purple gradient)
10. Tropical (Teal/Green gradient)
11. Saffron (Orange)
12. Moonlight (Silver gradient)
13. Peacock (Cyan/Indigo gradient)
14. Lotus (Pink gradient)
15. Sandalwood (Brown/Tan)

Each theme has Light and Dark modes!

---

## 📊 Analytics

Tracks 24 event types:
- Playback events (play, pause, next, previous, seek, complete)
- User interactions (shuffle, repeat, volume, mute)
- Playlist management (create, rename, delete, add/remove songs)
- Favorites (add, remove)
- View changes and search
- Settings (theme change, export/import, data clear)
- Error tracking

---

## 🔒 Privacy & Security

- ✅ All user data stored locally (browser localStorage)
- ✅ No server-side database
- ✅ No user accounts or authentication
- ✅ Google Analytics tracks anonymous usage only
- ✅ No personally identifiable information collected

---

## 🚀 Moving to Another Computer

See **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** for detailed instructions.

**Quick Steps:**
1. Copy entire project folder to USB/Cloud
2. Export settings (Settings → Export)
3. Install Python on new computer
4. Copy project folder to new computer
5. Run TOOL-Test-Website.bat
6. Import settings (Settings → Import)

---

## 🛠️ Management Tools

### Test Website Locally
```bash
mp3-management\TOOL-Test-Website.bat
```
Starts local server and opens browser.

### Sync New Songs
```bash
mp3-management\TOOL-Sync-Local.bat
```
Scans media folder and adds only NEW songs.

### Reset Data
```bash
mp3-management\TOOL-Reset-Data.bat
```
Clears songs.json and playlists.json for fresh start.

---

## 🐛 Troubleshooting

### Songs not appearing
**Solution:** Hard refresh browser (Ctrl + Shift + R)

### Audio seeking not working
**Solution:** Use Python server (scripts/serve.py), not "Open with browser"

### Python not found
**Solution:** Reinstall Python, check "Add to PATH" option

### Settings not restored
**Solution:** Import the JSON file (Settings → Import)

For more help, see **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)**

---

## 📈 Project Status

- ✅ **All Features Implemented** (10/10)
- ✅ **Zero Critical Errors**
- ✅ **Production Ready**
- ✅ **Fully Documented**
- ✅ **Tested and Verified**

---

## 📞 Support

For questions or issues:
1. Check [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
2. Check [VERIFICATION_REPORT.md](VERIFICATION_REPORT.md)
3. Review code comments in script.js
4. Check browser console for errors (F12)

---

## 📄 License

This project is for personal/community use. All spiritual content belongs to the Jain community.

---

## 🙏 Acknowledgments

- **Technologies:** HTML5, CSS3, JavaScript, Python 3
- **Analytics:** Google Analytics
- **Version Control:** Git & GitHub
- **Development:** Kiro AI Assistant

---

## 🎯 Version History

### Version 2.0 (May 21, 2026) - Current
- ✅ All 10 major features implemented
- ✅ 24 analytics events
- ✅ 15 themes with Light/Dark modes
- ✅ Resume playback capability
- ✅ Incremental sync
- ✅ Comprehensive documentation

---

## 🔗 Quick Links

- **User Guide:** [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
- **Migration Guide:** [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)
- **Verification Report:** [VERIFICATION_REPORT.md](VERIFICATION_REPORT.md)
- **Project Summary:** [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
- **Management Tools:** [mp3-management/README.md](mp3-management/README.md)

---

## 🎵 Getting Started in 3 Steps

1. **Install Python** from [python.org](https://www.python.org/downloads/)
2. **Run:** `mp3-management\TOOL-Test-Website.bat`
3. **Enjoy!** Player opens in browser automatically

---

**🎉 Ready to use! Enjoy your music! 🎉**

---

*Last Updated: May 21, 2026*  
*Version: 2.0*  
*Status: Production Ready ✅*
