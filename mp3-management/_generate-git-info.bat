@echo off
REM Generate git-info.json with latest commit date

echo Generating git info...
chcp 65001 >nul
set PYTHONUTF8=1
set PYTHONIOENCODING=utf-8
python "%~dp0python\generate-git-info.py"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Git info generated successfully!
) else (
    echo.
    echo Error generating git info.
)

pause
