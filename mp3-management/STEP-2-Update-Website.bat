@echo off
echo Syncing media files...
set PYTHONUTF8=1
set PYTHONIOENCODING=utf-8
python "%~dp0python\sync-media.py"

echo.
echo Done!
pause
