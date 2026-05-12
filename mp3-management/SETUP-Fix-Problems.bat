@echo off
REM ============================================
REM Fix Corrupted Git Configuration
REM ============================================
echo.
echo ========================================
echo  Fix Git Configuration
echo ========================================
echo.

set GITCONFIG=%USERPROFILE%\.gitconfig
set BACKUP=%USERPROFILE%\.gitconfig.backup

echo [INFO] Checking Git configuration...
echo [INFO] Config file: %GITCONFIG%
echo.

REM Check if .gitconfig exists
if not exist "%GITCONFIG%" (
    echo [INFO] No .gitconfig found. Creating new one...
    goto CREATE_NEW
)

echo [WARNING] Found corrupted .gitconfig file
echo [INFO] Creating backup at: %BACKUP%
echo.

REM Backup the corrupted file
copy "%GITCONFIG%" "%BACKUP%" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Could not create backup
    pause
    exit /b 1
)

echo [SUCCESS] Backup created
echo.

REM Delete corrupted file
del "%GITCONFIG%" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Could not delete corrupted file
    echo [INFO] Try running as administrator
    pause
    exit /b 1
)

echo [SUCCESS] Removed corrupted file
echo.

:CREATE_NEW
echo [INFO] Creating new Git configuration...
echo.

REM Prompt for user details
set /p GIT_NAME="Enter your name (for Git commits): "
set /p GIT_EMAIL="Enter your email (for Git commits): "

if "%GIT_NAME%"=="" set GIT_NAME=User
if "%GIT_EMAIL%"=="" set GIT_EMAIL=user@example.com

echo.
echo [INFO] Configuring Git...

REM Set basic Git config
git config --global user.name "%GIT_NAME%"
git config --global user.email "%GIT_EMAIL%"
git config --global core.autocrlf true
git config --global credential.helper manager

if errorlevel 1 (
    echo [ERROR] Failed to configure Git
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Git configuration fixed!
echo.
echo Configuration:
git config --list

echo.
echo ========================================
echo  Next Steps
echo ========================================
echo.
echo 1. Your old config is backed up at:
echo    %BACKUP%
echo.
echo 2. Git is now configured with:
echo    Name:  %GIT_NAME%
echo    Email: %GIT_EMAIL%
echo.
echo 3. Credential manager is enabled
echo    (You'll be prompted for HF token on first push)
echo.
echo 4. You can now run: hf-push.bat
echo.
pause
