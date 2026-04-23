@echo off
:: ══════════════════════════════════════════════════════
::  add-song.bat
::  Drag & drop an MP3 onto this file, OR run:
::    add-song.bat "C:\path\to\song.mp3"
::  It will:
::    1. Copy the MP3 into the /media folder
::    2. Add a new entry to media.json
:: ══════════════════════════════════════════════════════

:: Check argument
if "%~1"=="" (
    echo.
    echo  Usage: Drag an MP3 file onto this script
    echo         OR run:  add-song.bat "path\to\song.mp3"
    echo.
    pause
    exit /b 1
)

:: Run the PowerShell logic (same folder as this bat)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0add-song.ps1" -FilePath "%~1"

pause
