@echo off
REM ============================================
REM Push to Hugging Face (Force Push with LFS)
REM Works directly in hf-dataset folder
REM ============================================
echo.
echo ========================================
echo  Push to Hugging Face
echo ========================================
echo.

set CLONE_DIR=..\media

REM Check if HF repo is cloned
if not exist "%CLONE_DIR%\.git" (
    echo [ERROR] Media folder not found at %CLONE_DIR%
    echo [INFO] Please run SETUP-First-Time.bat first
    echo.
    pause
    exit /b 1
)

echo [INFO] Working directory: %CLONE_DIR%
echo.

REM Count media files
set FILE_COUNT=0
for /r "%CLONE_DIR%" %%F in (*.mp3 *.wma *.wav *.flac *.aac *.m4a *.ogg *.opus *.mp4 *.avi *.mkv *.mov *.webm) do set /a FILE_COUNT+=1

echo [INFO] Found %FILE_COUNT% media file(s) in media/
echo.

echo [WARNING] This will FORCE PUSH all files to Hugging Face
echo [WARNING] Remote changes will be overwritten
echo.
set /p CONFIRM="Continue? (yes/no): "
if /i not "%CONFIRM%"=="yes" (
    echo [INFO] Operation cancelled
    echo.
    pause
    exit /b 0
)

echo.
echo [STEP 1/4] Navigating to HF repository...
cd /d "%CLONE_DIR%"

echo [STEP 2/4] Staging all files...
git add -A

REM Show what will be pushed
echo.
echo Files to be pushed:
git diff --cached --name-status | findstr /V ".gitattributes"
echo.

echo [STEP 3/4] Committing changes...
set /p COMMIT_MSG="Enter commit message (or press Enter for default): "
if "%COMMIT_MSG%"=="" set COMMIT_MSG=Update dataset

git commit -m "%COMMIT_MSG%"
REM Continue even if commit fails (might be already committed)

echo [STEP 4/4] Force pushing to Hugging Face with LFS...
echo.
echo [INFO] Uploading (this may take a while for large files)...
echo.

git push --force origin main

if errorlevel 1 (
    echo.
    echo [ERROR] Failed to push to Hugging Face
    echo.
    echo Troubleshooting:
    echo   1. Check authentication (username + HF token)
    echo   2. Verify Git LFS is installed: git lfs version
    echo   3. Check internet connection
    echo   4. Ensure you have write access to the dataset
    echo.
    cd /d "%~dp0"
    pause
    exit /b 1
)

echo.
echo ========================================
echo  SUCCESS!
echo ========================================
echo.
echo [OK] Files pushed to Hugging Face
echo [OK] Dataset updated successfully
echo.
echo Next steps:
echo   1. Run STEP-2-Update-Website.bat to update songs.json
echo   2. Run STEP-3-Publish-Website.bat to deploy website
echo.

cd /d "%~dp0"
pause
