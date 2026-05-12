@echo off
REM ============================================
REM Publish Website to GitHub Pages
REM ============================================
echo.
echo ========================================
echo   PUBLISH WEBSITE
echo ========================================
echo.

REM Navigate to project root
cd /d "%~dp0\.."

REM Check if we're in a git repository
if not exist ".git" (
    echo [ERROR] Not in a Git repository
    echo [INFO] Make sure you're in the project root
    pause
    exit /b 1
)

echo [INFO] Current directory: %CD%
echo.

REM Get commit message
set /p COMMIT_MSG="Enter commit message (or press Enter for default): "
if "%COMMIT_MSG%"=="" set COMMIT_MSG=Update website

echo.
echo [STEP 1/4] Staging all changes...
git add .

REM Show what will be committed
echo.
echo [STEP 2/4] Files to be committed:
echo ----------------------------------
git diff --cached --name-status
echo ----------------------------------
echo.

REM Confirm
set /p CONFIRM="Proceed with commit and push? (y/n): "
if /i not "%CONFIRM%"=="y" (
    echo.
    echo [INFO] Aborted
    git reset HEAD
    cd /d "%~dp0"
    pause
    exit /b 0
)

echo.
echo [STEP 3/4] Committing changes...
git commit -m "%COMMIT_MSG%"
if errorlevel 1 (
    echo.
    echo [INFO] Nothing to commit (no changes detected)
    cd /d "%~dp0"
    pause
    exit /b 0
)

echo [STEP 4/4] Pushing to GitHub...
git push

if errorlevel 1 (
    echo.
    echo [ERROR] Failed to push to GitHub
    echo.
    echo Troubleshooting:
    echo   1. Check internet connection
    echo   2. Verify Git credentials
    echo   3. Make sure you have push access
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
echo [OK] Website published to GitHub
echo [OK] Changes will be live in 1-2 minutes
echo.
echo Visit your website:
echo   https://[your-username].github.io/[your-repo-name]
echo.

cd /d "%~dp0"
pause
