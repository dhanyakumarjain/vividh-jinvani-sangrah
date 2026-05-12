# Migration Guide: Simplified Workflow

## What Changed?

**OLD:** Two folders - `media/` (local) and `hf-dataset/` (HF clone)  
**NEW:** One folder - `hf-dataset/` (serves both purposes)

## Benefits

✅ **Simpler:** No more copying between folders  
✅ **Faster:** Direct work in HF repo  
✅ **Cleaner:** Single source of truth  
✅ **Force Push:** Always overwrites remote with local  

## Migration Steps

### If You Have Existing `media/` Folder:

```bash
# 1. Clone HF repo (if not already done)
cd mp3-management
hf-clone.bat

# 2. Copy files from media/ to hf-dataset/
xcopy /E /I /Y ..\media\* ..\hf-dataset\

# 3. Push to Hugging Face
hf-push.bat

# 4. Delete old media/ folder (optional)
rmdir /s /q ..\media

# 5. Update website data
sync-media.bat

# 6. Deploy
git-push.bat
```

### Fresh Start:

```bash
# 1. Clone HF repo
hf-clone.bat

# 2. Add MP3 files to hf-dataset/
# (organize in subfolders)

# 3. Push to HF
hf-push.bat

# 4. Update website
sync-media.bat

# 5. Deploy
git-push.bat
```

## New Workflow

```
┌─────────────────────────────────────────┐
│  1. Add/Edit MP3s in hf-dataset/        │
│     (organize by folders = playlists)   │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  2. Run: hf-push.bat                    │
│     (force push to Hugging Face)        │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  3. Run: sync-media.bat                 │
│     (update songs.json from HF API)     │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  4. Run: git-push.bat                   │
│     (deploy website to GitHub Pages)    │
└─────────────────────────────────────────┘
```

## Key Points

1. **hf-dataset/ is gitignored** - won't be committed to main project
2. **Force push enabled** - local always overwrites remote
3. **Git LFS automatic** - handles large MP3 files
4. **No media/ folder** - deprecated and gitignored

## Scripts Updated

- ✅ `hf-clone.bat` - Sets up LFS automatically
- ✅ `hf-push.bat` - Force push with LFS
- ✅ `sync-media.bat` - Fetches from HF API (no local files needed)
- ✅ `.gitignore` - Ignores both `media/` and `hf-dataset/`
- ❌ `hf-pull.bat` - Removed (not needed)
- ❌ `hf-setup-and-push.bat` - Removed (simplified)

## Troubleshooting

**Q: Can I still use media/ folder?**  
A: No, it's deprecated. Use `hf-dataset/` only.

**Q: What if I have files in media/?**  
A: Copy them to `hf-dataset/` and delete `media/`.

**Q: How do I sync across machines?**  
A: Clone once with `hf-clone.bat`, then use `git pull` in `hf-dataset/`.

**Q: What if push fails?**  
A: Check Git LFS is installed and configured. Run `setup-git-lfs.bat`.

**Q: Can I undo a force push?**  
A: No, force push overwrites remote. Keep local backups if needed.
