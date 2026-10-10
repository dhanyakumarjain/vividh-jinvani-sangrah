@echo off
REM ============================================
REM Sync Local Media Folder
REM Scans media/ folder and updates songs.json
REM Works offline - no internet needed
REM ============================================
echo.
echo ========================================
echo   SYNC LOCAL MEDIA FOLDER
echo ========================================
echo.
echo This scans your local media/ folder
echo and updates songs.json and playlists.json
echo.
echo No internet connection needed!
echo.
echo ========================================

chcp 65001 >nul
set PYTHONUTF8=1
set PYTHONIOENCODING=utf-8
python "%~dp0python\sync-local-media.py"

echo.
pause
