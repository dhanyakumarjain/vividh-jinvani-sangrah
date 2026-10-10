@echo off
REM Generate git-info.json with latest commit date

echo Generating git info...
python mp3-management\python\generate-git-info.py

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Git info generated successfully!
) else (
    echo.
    echo Error generating git info.
)

pause
