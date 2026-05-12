@echo off
setlocal

:: Get commit message from argument or prompt
if "%~1"=="" (
    set /p COMMIT_MSG="Enter commit message: "
) else (
    set COMMIT_MSG=%~1
)

:: Stage all changes
git add .

:: Show staged files
echo.
echo Files to be committed and pushed:
echo ----------------------------------
git diff --cached --name-status
echo ----------------------------------
echo.

:: Confirm
set /p CONFIRM="Proceed with commit and push? (y/n): "
if /i not "%CONFIRM%"=="y" (
    echo Aborted.
    git reset HEAD
    exit /b 0
)

:: Commit and push
git commit -m "%COMMIT_MSG%"
git push

echo.
echo Done.
