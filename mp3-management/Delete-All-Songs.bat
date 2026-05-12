@echo off
REM ============================================
REM Reset Hugging Face Dataset (Delete All Files)
REM ============================================
echo.
echo ========================================
echo  Reset Hugging Face Dataset
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

echo [WARNING] !!!!! DESTRUCTIVE OPERATION !!!!!
echo [WARNING] This will DELETE ALL FILES from the Hugging Face dataset
echo [WARNING] This action CANNOT be undone!
echo.
echo Type 'DELETE ALL' to confirm (case-sensitive):
set /p CONFIRM="> "
if not "%CONFIRM%"=="DELETE ALL" (
    echo [INFO] Operation cancelled
    echo.
    pause
    exit /b 0
)

echo.
echo [STEP 1/4] Navigating to HF repository...
cd /d "%CLONE_DIR%"

echo [STEP 2/4] Pulling latest changes...
git pull origin main
if errorlevel 1 (
    echo [WARNING] Could not pull latest changes, continuing anyway...
)

echo [STEP 3/4] Deleting all files (except .git)...
for /d %%D in (*) do (
    if /i not "%%D"==".git" (
        echo   Deleting folder: %%D
        rmdir /s /q "%%D"
    )
)
for %%F in (*) do (
    echo   Deleting file: %%F
    del /q "%%F"
)

echo [STEP 4/4] Committing and pushing deletion to Hugging Face...
git add -A
git commit -m "Reset dataset - delete all files"
if errorlevel 1 (
    echo [INFO] Nothing to commit (dataset might already be empty)
    cd /d "%~dp0"
    pause
    exit /b 0
)

git push origin main
if errorlevel 1 (
    echo [ERROR] Failed to push to Hugging Face
    cd /d "%~dp0"
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Hugging Face dataset has been reset (all files deleted)
echo.
echo Next steps:
echo   - Use STEP-1-Upload-Songs.bat to upload new files
echo.

cd /d "%~dp0"
pause
