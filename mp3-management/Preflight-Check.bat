@echo off
REM ============================================
REM Preflight Check - System Requirements
REM Checks all required software and configuration
REM ============================================
color 0A
title Preflight Check

cls
echo.
echo ========================================================================
echo   PREFLIGHT CHECK - SYSTEM REQUIREMENTS
echo ========================================================================
echo.
echo This will check if your system has everything needed to run this project.
echo.
echo Checking:
echo   1. Git
echo   2. Git LFS (Large File Storage)
echo   3. Python
echo   4. Git Authentication (GitHub)
echo   5. Hugging Face Authentication
echo.
echo ========================================================================
echo.
pause

REM Initialize counters
set PASS_COUNT=0
set FAIL_COUNT=0
set WARN_COUNT=0

echo.
echo ========================================================================
echo   RUNNING CHECKS...
echo ========================================================================
echo.

REM ============================================
REM CHECK 1: Git
REM ============================================
echo [CHECK 1/5] Git Installation
echo.

git --version >nul 2>&1
if errorlevel 1 (
    echo   [FAIL] Git is NOT installed
    echo.
    echo   Download and install Git:
    echo   https://git-scm.com/download/win
    echo.
    set /a FAIL_COUNT+=1
) else (
    for /f "tokens=*" %%i in ('git --version') do set GIT_VERSION=%%i
    echo   [PASS] !GIT_VERSION!
    echo.
    set /a PASS_COUNT+=1
)

REM ============================================
REM CHECK 2: Git LFS
REM ============================================
echo [CHECK 2/5] Git LFS (Large File Storage)
echo.

git lfs version >nul 2>&1
if errorlevel 1 (
    echo   [FAIL] Git LFS is NOT installed
    echo.
    echo   Download and install Git LFS:
    echo   https://git-lfs.github.com/
    echo.
    echo   Or install via command:
    echo   winget install GitHub.GitLFS
    echo.
    set /a FAIL_COUNT+=1
) else (
    for /f "tokens=*" %%i in ('git lfs version') do set LFS_VERSION=%%i
    echo   [PASS] !LFS_VERSION!
    echo.
    set /a PASS_COUNT+=1
)

REM ============================================
REM CHECK 3: Python
REM ============================================
echo [CHECK 3/5] Python Installation
echo.

python --version >nul 2>&1
if errorlevel 1 (
    echo   [FAIL] Python is NOT installed
    echo.
    echo   Download and install Python:
    echo   https://www.python.org/downloads/
    echo.
    echo   Make sure to check "Add Python to PATH" during installation
    echo.
    set /a FAIL_COUNT+=1
) else (
    for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
    echo   [PASS] !PYTHON_VERSION!
    echo.
    set /a PASS_COUNT+=1
)

REM ============================================
REM CHECK 4: Git Authentication (GitHub)
REM ============================================
echo [CHECK 4/5] Git Authentication (GitHub)
echo.

REM Check if Git user is configured
git config user.name >nul 2>&1
if errorlevel 1 (
    echo   [FAIL] Git user.name is NOT configured
    echo.
    echo   Run: git config --global user.name "Your Name"
    echo.
    set /a FAIL_COUNT+=1
    goto SKIP_GIT_AUTH
)

git config user.email >nul 2>&1
if errorlevel 1 (
    echo   [FAIL] Git user.email is NOT configured
    echo.
    echo   Run: git config --global user.email "your.email@example.com"
    echo.
    set /a FAIL_COUNT+=1
    goto SKIP_GIT_AUTH
)

REM Check credential helper
git config credential.helper >nul 2>&1
if errorlevel 1 (
    echo   [WARN] Git credential helper is NOT configured
    echo.
    echo   Recommended: git config --global credential.helper manager
    echo   This will save your GitHub credentials securely
    echo.
    set /a WARN_COUNT+=1
) else (
    for /f "tokens=*" %%i in ('git config user.name') do set GIT_USER=%%i
    for /f "tokens=*" %%i in ('git config user.email') do set GIT_EMAIL=%%i
    echo   [PASS] Git is configured
    echo   User: !GIT_USER!
    echo   Email: !GIT_EMAIL!
    echo.
    set /a PASS_COUNT+=1
    goto SKIP_GIT_AUTH
)

:SKIP_GIT_AUTH

REM ============================================
REM CHECK 5: Hugging Face Authentication
REM ============================================
echo [CHECK 5/5] Hugging Face Authentication
echo.

REM Check if media folder exists and is a git repo
if exist "..\media\.git" (
    cd /d "..\media"
    
    REM Try to fetch from HF (this will fail if not authenticated)
    git ls-remote origin >nul 2>&1
    if errorlevel 1 (
        echo   [WARN] Cannot connect to Hugging Face
        echo.
        echo   You may need to authenticate:
        echo   1. Run SETUP-First-Time.bat
        echo   2. Enter your HF username and token when prompted
        echo.
        echo   Get your token from:
        echo   https://huggingface.co/settings/tokens
        echo.
        set /a WARN_COUNT+=1
    ) else (
        echo   [PASS] Hugging Face is accessible
        echo.
        set /a PASS_COUNT+=1
    )
    
    cd /d "%~dp0"
) else (
    echo   [WARN] Media folder not found
    echo.
    echo   Run SETUP-First-Time.bat to clone Hugging Face repository
    echo.
    set /a WARN_COUNT+=1
)

REM ============================================
REM SUMMARY
REM ============================================
echo.
echo ========================================================================
echo   SUMMARY
echo ========================================================================
echo.
echo   Passed:   %PASS_COUNT%
echo   Failed:   %FAIL_COUNT%
echo   Warnings: %WARN_COUNT%
echo.

if %FAIL_COUNT% GTR 0 (
    echo   [RESULT] System is NOT ready
    echo.
    echo   Please install the missing software and run this check again.
    echo.
) else if %WARN_COUNT% GTR 0 (
    echo   [RESULT] System is mostly ready
    echo.
    echo   You can proceed, but some features may not work properly.
    echo   Please address the warnings above.
    echo.
) else (
    echo   [RESULT] System is READY!
    echo.
    echo   All checks passed. You can now use all features.
    echo.
)

echo ========================================================================
echo.
echo Next steps:
echo   1. If any checks failed, install the required software
echo   2. Run this check again to verify
echo   3. Once all checks pass, run START-HERE.bat
echo.
echo ========================================================================
echo.
pause
