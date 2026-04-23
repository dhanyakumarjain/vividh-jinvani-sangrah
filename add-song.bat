@echo off
:: ══════════════════════════════════════════════════════
::  add-song.bat
::  Usage:
::    add-song.bat "C:\path\to\song.mp3"
::    add-song.bat "C:\path\to\folder"
:: ══════════════════════════════════════════════════════

if "%~1"=="" (
    echo.
    echo  Usage:
    echo    add-song.bat "C:\path\to\song.mp3"
    echo    add-song.bat "C:\path\to\folder"
    echo.
    pause
    exit /b 1
)

:: Set UTF-8 code page so Unicode paths are handled correctly
chcp 65001 >nul

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0add-song.ps1" -Paths "%~1"

pause
