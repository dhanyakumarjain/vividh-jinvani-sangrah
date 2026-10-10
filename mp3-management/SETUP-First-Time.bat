@echo off
REM ============================================
REM Clone Hugging Face Dataset Repository
REM This becomes your media folder
REM ============================================
echo.
echo ========================================
echo  Clone Hugging Face Dataset Repository
echo ========================================
echo.

set HF_REPO=https://huggingface.co/datasets/dhanyakumarjain/temp
set CLONE_DIR=..\media

REM Check if already cloned
if exist "%CLONE_DIR%\.git" (
    echo [INFO] Repository already cloned at %CLONE_DIR%
    echo.
    set /p UPDATE="Pull latest changes? (y/n): "
    if /i "%UPDATE%"=="y" (
        cd /d "%CLONE_DIR%"
        echo [INFO] Pulling latest changes...
        git pull origin main
        cd /d "%~dp0"
    )
    echo.
    pause
    exit /b 0
)

REM Check if Git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git is not installed or not in PATH
    echo [INFO] Please install Git from: https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)

REM Check if Git LFS is installed
git lfs version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git LFS is not installed
    echo [INFO] Please install Git LFS from: https://git-lfs.github.com/
    echo [INFO] Or run: winget install GitHub.GitLFS
    echo.
    pause
    exit /b 1
)

echo [INFO] Prerequisites check passed
echo   [OK] Git is installed
echo   [OK] Git LFS is installed
echo.

echo [INFO] Cloning Hugging Face dataset repository...
echo [INFO] Repository: %HF_REPO%
echo [INFO] Destination: %CLONE_DIR%
echo.
echo [WARNING] This may take a while depending on dataset size...
echo.

REM Clone the repository
git clone %HF_REPO% "%CLONE_DIR%"

if errorlevel 1 (
    echo.
    echo [ERROR] Failed to clone repository
    echo.
    echo Troubleshooting:
    echo   1. Check authentication (you may need to enter HF username and token)
    echo   2. Verify repository URL is correct
    echo   3. Check internet connection
    echo.
    echo To set up authentication:
    echo   git config --global credential.helper manager
    echo.
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Repository cloned successfully!
echo.

REM Setup Git LFS
echo [INFO] Configuring Git LFS...
cd /d "%CLONE_DIR%"

git lfs install
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

REM Check if .gitattributes needs to be committed
git diff --quiet .gitattributes 2>nul
if errorlevel 1 (
    echo [INFO] Committing LFS configuration...
    git add .gitattributes
    git commit -m "Configure Git LFS for MP3 files"
    git push origin main
)

cd /d "%~dp0"

echo [OK] Git LFS configured
echo.
echo ========================================
echo  Setup Complete!
echo ========================================
echo.
echo Location: %CLONE_DIR%
echo.
echo This folder is now your media folder:
echo   - Add/organize MP3 files here
echo   - Use STEP-1-Upload-Songs.bat to upload to Hugging Face
echo   - Use STEP-2-Update-Website.bat to update songs.json
echo.
echo Next steps:
echo   1. Add MP3 files to media/ folder
echo   2. Run STEP-1-Upload-Songs.bat to upload
echo   3. Run STEP-2-Update-Website.bat to update website data
echo.
pause
