@echo off
REM ============================================
REM Setup Git LFS for Large MP3 Files
REM ============================================
echo.
echo ========================================
echo  Setup Git LFS (Large File Storage)
echo ========================================
echo.

set CLONE_DIR=..\media

REM Check if Git LFS is installed
git lfs version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git LFS is not installed
    echo.
    echo Please install Git LFS:
    echo   1. Download from: https://git-lfs.github.com/
    echo   2. Run the installer
    echo   3. Run this script again
    echo.
    echo Or install via command:
    echo   winget install GitHub.GitLFS
    echo.
    pause
    exit /b 1
)

echo [SUCCESS] Git LFS is installed
git lfs version
echo.

REM Check if HF repo is cloned
if not exist "%CLONE_DIR%\.git" (
    echo [ERROR] Media folder not found at %CLONE_DIR%
    echo [INFO] Please run SETUP-First-Time.bat first
    echo.
    pause
    exit /b 1
)

echo [INFO] Navigating to HF repository...
cd /d "%CLONE_DIR%"

echo [INFO] Installing Git LFS hooks...
git lfs install
if errorlevel 1 (
    echo [ERROR] Failed to install Git LFS
    cd /d "%~dp0"
    pause
    exit /b 1
)

echo [INFO] Configuring Git LFS to track media files...
git lfs track "*.mp3"
git lfs track "*.wma"
git lfs track "*.wav"
git lfs track "*.flac"
git lfs track "*.aac"
git lfs track "*.m4a"
git lfs track "*.ogg"
git lfs track "*.opus"
git lfs track "*.mp4"
git lfs track "*.avi"
git lfs track "*.mkv"
git lfs track "*.mov"
git lfs track "*.webm"
if errorlevel 1 (
    echo [ERROR] Failed to track MP3 files
    cd /d "%~dp0"
    pause
    exit /b 1
)

echo [INFO] Adding .gitattributes file...
git add .gitattributes
git commit -m "Configure Git LFS for MP3 files"

echo.
echo [SUCCESS] Git LFS is now configured!
echo.
echo [INFO] All media files will now be stored using Git LFS
echo.
echo Supported formats:
echo   Audio: mp3, wma, wav, flac, aac, m4a, ogg, opus
echo   Video: mp4, avi, mkv, mov, webm
echo.
echo Next steps:
echo   1. Run STEP-1-Upload-Songs.bat to upload your MP3 files
echo   2. Large files will be handled automatically by Git LFS
echo.

cd /d "%~dp0"
pause
