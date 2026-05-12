@echo off
REM ============================================
REM Main Menu - Music Website Manager
REM ============================================
color 0A
title Music Website Manager

:MENU
cls
echo.
echo ========================================================================
echo                       MUSIC WEBSITE MANAGER
echo ========================================================================
echo.
echo   Welcome! This tool helps you put your music online and create
echo   a beautiful website where people can listen to your songs.
echo.
echo   Think of it like this:
echo     - You have songs on your computer (MP3 files)
echo     - This tool uploads them to the internet
echo     - Creates a website where anyone can play them
echo.
echo ========================================================================
echo   FIRST TIME? START HERE:
echo ========================================================================
echo.
echo   [S] Setup - First Time Only
echo.
echo       What it does:
echo         - Creates a special folder called "media"
echo         - This is where you'll put your MP3 files
echo         - Downloads any existing songs from the internet
echo.
echo       When to use:
echo         - Only ONCE when you first start
echo         - Or on a new computer
echo.
echo       Time needed: 2-5 minutes
echo.
echo ========================================================================
echo   DAILY WORKFLOW - Follow these 3 steps IN ORDER:
echo ========================================================================
echo.
echo   [1] STEP 1: Upload Songs
echo.
echo       What it does:
echo         - Takes MP3 files from "media" folder on your computer
echo         - Uploads them to the internet (cloud storage)
echo         - Makes them available worldwide
echo.
echo       When to use:
echo         - After you add new songs to media folder
echo         - After you delete songs from media folder
echo         - After you rename or move songs
echo.
echo       Before running:
echo         1. Open the "media" folder (next to mp3-management)
echo         2. Add your MP3 files
echo         3. Organize them in folders (each folder = one playlist)
echo.
echo       Example folder structure:
echo         media/
echo           Morning Prayers/
echo             song1.mp3
echo             song2.mp3
echo           Evening Aarti/
echo             song3.mp3
echo.
echo       Time needed: 5-30 minutes (depends on file size)
echo.
echo   ---
echo.
echo   [2] STEP 2: Update Website
echo.
echo       What it does:
echo         - Checks what songs are on the internet
echo         - Creates a list of all songs
echo         - Updates the website's song database
echo         - Creates playlists based on your folders
echo.
echo       When to use:
echo         - RIGHT AFTER Step 1 (Upload Songs)
echo         - Every time you upload new songs
echo.
echo       What you'll see:
echo         - List of all songs found
echo         - Number of playlists created
echo         - Confirmation message
echo.
echo       Time needed: 10-30 seconds
echo.
echo   ---
echo.
echo   [3] STEP 3: Publish Website
echo.
echo       What it does:
echo         - Takes your updated website
echo         - Publishes it to the internet
echo         - Makes it live for everyone to see
echo         - Updates your website URL
echo.
echo       When to use:
echo         - RIGHT AFTER Step 2 (Update Website)
echo         - This is the final step!
echo.
echo       What happens:
echo         - Website goes live in 1-2 minutes
echo         - Anyone can visit and listen to songs
echo         - Old version is replaced with new version
echo.
echo       Time needed: 30 seconds - 2 minutes
echo.
echo ========================================================================
echo   TOOLS:
echo ========================================================================
echo.
echo   [T] Test Website Locally
echo.
echo       What it does:
echo         - Opens the website on YOUR computer only
echo         - Lets you test before publishing
echo         - No one else can see it yet
echo.
echo       When to use:
echo         - After Step 2, before Step 3
echo         - To preview how website looks
echo         - To check if songs play correctly
echo.
echo       How it works:
echo         - Starts a mini web server on your computer
echo         - Opens website in your browser
echo         - Press Ctrl+C in the window to stop
echo.
echo   ---
echo.
echo   [H] Help and Instructions
echo.
echo       Shows detailed instructions and examples
echo.
echo   ---
echo.
echo   [F] Fix Problems
echo.
echo       What it does:
echo         - Fixes common technical errors
echo         - Resets configuration if something breaks
echo.
echo       When to use:
echo         - If you see error messages
echo         - If upload/publish fails
echo         - If Git shows errors
echo.
echo   ---
echo.
echo   [D] Delete All Songs (DANGER!)
echo.
echo       What it does:
echo         - Deletes ALL songs from the internet
echo         - Cannot be undone!
echo.
echo       When to use:
echo         - Only if starting completely fresh
echo         - If you want to remove everything
echo.
echo       WARNING: This is permanent!
echo.
echo   ---
echo.
echo   [X] Exit
echo.
echo ========================================================================
echo.
set /p choice="Enter your choice (S, 1, 2, 3, T, H, F, D, or X): "

if /i "%choice%"=="S" goto SETUP
if /i "%choice%"=="1" goto STEP1
if /i "%choice%"=="2" goto STEP2
if /i "%choice%"=="3" goto STEP3
if /i "%choice%"=="T" goto TEST
if /i "%choice%"=="H" goto HELP
if /i "%choice%"=="F" goto FIX
if /i "%choice%"=="D" goto DELETE
if /i "%choice%"=="X" goto EXIT

echo.
echo Invalid choice. Please enter S, 1, 2, 3, T, H, F, D, or X
timeout /t 3 >nul
goto MENU

:SETUP
cls
echo.
echo ========================================================================
echo   FIRST TIME SETUP
echo ========================================================================
echo.
echo This will create your music folder and download any existing songs.
echo.
echo What you need:
echo   - Git installed on your computer
echo   - Git LFS (Large File Storage) installed
echo   - Internet connection
echo   - Your Hugging Face username and password/token
echo.
echo What will happen:
echo   1. Creates "media" folder
echo   2. Downloads songs from internet (if any exist)
echo   3. Sets up everything for uploading
echo.
echo This takes 2-5 minutes.
echo.
pause
call "SETUP-First-Time.bat"
echo.
echo ========================================================================
echo Press any key to return to menu...
pause >nul
goto MENU

:STEP1
cls
echo.
echo ========================================================================
echo   STEP 1: UPLOAD SONGS
echo ========================================================================
echo.
echo This uploads your MP3 files to the internet.
echo.
echo BEFORE YOU CONTINUE:
echo.
echo   1. Have you added MP3 files to the "media" folder?
echo   2. Have you organized them in subfolders?
echo      (Each subfolder becomes a playlist)
echo.
echo Example:
echo   media/
echo     Morning Prayers/
echo       song1.mp3
echo       song2.mp3
echo     Evening Aarti/
echo       song3.mp3
echo.
echo What will happen:
echo   - All files in media will be uploaded
echo   - This may take 5-30 minutes for large files
echo   - You'll see upload progress
echo   - You may need to enter your password
echo.
pause
call "STEP-1-Upload-Songs.bat"
echo.
echo ========================================================================
echo.
echo NEXT STEP: Run "Step 2: Update Website"
echo.
echo Press any key to return to menu...
pause >nul
goto MENU

:STEP2
cls
echo.
echo ========================================================================
echo   STEP 2: UPDATE WEBSITE
echo ========================================================================
echo.
echo This updates your website's song list.
echo.
echo What will happen:
echo   - Checks what songs are on the internet
echo   - Creates a list of all songs
echo   - Creates playlists based on your folders
echo   - Updates website data files
echo.
echo You'll see:
echo   - List of songs found
echo   - Number of playlists created
echo   - Success message
echo.
echo This takes 10-30 seconds.
echo.
pause
call "STEP-2-Update-Website.bat"
echo.
echo ========================================================================
echo.
echo NEXT STEP: Run "Step 3: Publish Website"
echo           OR run "Test Website" to preview first
echo.
echo Press any key to return to menu...
pause >nul
goto MENU

:STEP3
cls
echo.
echo ========================================================================
echo   STEP 3: PUBLISH WEBSITE
echo ========================================================================
echo.
echo This makes your website live on the internet!
echo.
echo What will happen:
echo   - Your website files are uploaded
echo   - Website goes live in 1-2 minutes
echo   - Anyone can visit and listen to songs
echo   - Old version is replaced
echo.
echo Your website will be available at:
echo   https://[your-username].github.io/[your-repo-name]
echo.
echo This takes 30 seconds to 2 minutes.
echo.
pause
call "STEP-3-Publish-Website.bat"
echo.
echo ========================================================================
echo.
echo DONE! Your website is now live!
echo.
echo Wait 1-2 minutes, then visit your website URL.
echo.
echo Press any key to return to menu...
pause >nul
goto MENU

:TEST
cls
echo.
echo ========================================================================
echo   TEST WEBSITE LOCALLY
echo ========================================================================
echo.
echo This opens your website on YOUR computer only (not live yet).
echo.
echo What will happen:
echo   1. Starts a mini web server on your computer
echo   2. Opens website in your browser
echo   3. You can test if everything works
echo.
echo How to use:
echo   - Website opens automatically in browser
echo   - Test playing songs
echo   - Check if playlists look correct
echo   - When done, close the black window or press Ctrl+C
echo.
echo NOTE: Only you can see this - it's not live yet!
echo       To make it live, run "Step 3: Publish Website"
echo.
pause
call "Test-Website.bat"
echo.
echo Press any key to return to menu...
pause >nul
goto MENU

:HELP
cls
echo.
echo ========================================================================
echo   HELP AND INSTRUCTIONS
echo ========================================================================
echo.
echo COMPLETE WORKFLOW (Step by Step):
echo.
echo ========================================================================
echo 1. FIRST TIME SETUP (Do this ONCE):
echo ========================================================================
echo.
echo    a) Run "Setup - First Time Only"
echo    b) Wait for it to finish (2-5 minutes)
echo    c) You now have a "media" folder
echo.
echo ========================================================================
echo 2. ADD YOUR SONGS:
echo ========================================================================
echo.
echo    a) Open the "media" folder
echo       (It's next to the mp3-management folder)
echo.
echo    b) Create subfolders for different playlists
echo       Example: "Morning Prayers", "Evening Aarti", etc.
echo.
echo    c) Put MP3 files in these folders
echo.
echo    Example structure:
echo       media/
echo         Morning Prayers/
echo           song1.mp3
echo           song2.mp3
echo         Evening Aarti/
echo           song3.mp3
echo           song4.mp3
echo.
echo    Each folder = One playlist on your website!
echo.
echo ========================================================================
echo 3. UPLOAD AND PUBLISH (Do this EVERY TIME you add/change songs):
echo ========================================================================
echo.
echo    a) Run "Step 1: Upload Songs"
echo       - Uploads your MP3 files to internet
echo       - Takes 5-30 minutes depending on file size
echo.
echo    b) Run "Step 2: Update Website"
echo       - Updates song list on website
echo       - Takes 10-30 seconds
echo.
echo    c) (Optional) Run "Test Website Locally"
echo       - Preview website on your computer
echo       - Make sure everything looks good
echo.
echo    d) Run "Step 3: Publish Website"
echo       - Makes website live
echo       - Takes 1-2 minutes
echo.
echo    e) Wait 1-2 minutes, then visit your website!
echo.
echo ========================================================================
echo TROUBLESHOOTING:
echo ========================================================================
echo.
echo Problem: "Git is not installed" error
echo Solution: Install Git from https://git-scm.com/download/win
echo.
echo Problem: "Git LFS not installed" error
echo Solution: Install from https://git-lfs.github.com/
echo.
echo Problem: Upload fails or shows errors
echo Solution: Run "Fix Problems" from main menu
echo.
echo Problem: Website doesn't update after publishing
echo Solution: Wait 2-3 minutes, then refresh browser (Ctrl+F5)
echo.
echo Problem: Songs don't play on website
echo Solution: Make sure files are .mp3 format
echo           Check file names don't have special characters
echo.
echo ========================================================================
echo.
echo For detailed technical documentation, see: README.md
echo.
echo Press any key to return to menu...
pause >nul
goto MENU

:FIX
cls
echo.
echo ========================================================================
echo   FIX PROBLEMS
echo ========================================================================
echo.
echo This will fix common technical errors.
echo.
echo What it does:
echo   - Fixes Git configuration errors
echo   - Resets settings if corrupted
echo   - Creates clean configuration
echo.
echo When to use:
echo   - If you see "fatal: bad config" errors
echo   - If Git commands fail
echo   - If upload/publish doesn't work
echo.
echo You'll need to enter:
echo   - Your name (for Git)
echo   - Your email (for Git)
echo.
pause
call "SETUP-Fix-Problems.bat"
echo.
echo ========================================================================
echo Press any key to return to menu...
pause >nul
goto MENU

:DELETE
cls
echo.
echo ========================================================================
echo   DELETE ALL SONGS - WARNING!
echo ========================================================================
echo.
echo   !!!  THIS IS DANGEROUS  !!!
echo.
echo This will DELETE ALL SONGS from the internet.
echo.
echo What will happen:
echo   - All MP3 files removed from cloud storage
echo   - Your website will have no songs
echo   - This CANNOT be undone!
echo.
echo When to use:
echo   - Only if you want to start completely fresh
echo   - If you want to remove everything and start over
echo.
echo IMPORTANT:
echo   - Your local files in "media" are NOT deleted
echo   - Only the online copies are removed
echo   - You can re-upload later if needed
echo.
echo Are you ABSOLUTELY SURE you want to continue?
echo.
pause
call "Delete-All-Songs.bat"
echo.
echo ========================================================================
echo Press any key to return to menu...
pause >nul
goto MENU

:EXIT
cls
echo.
echo ========================================================================
echo.
echo   Thank you for using Music Website Manager!
echo.
echo   Remember the workflow:
echo     1. Add songs to media folder
echo     2. Upload Songs
echo     3. Update Website
echo     4. Publish Website
echo.
echo   Questions? Check README.md for detailed help.
echo.
echo ========================================================================
echo.
timeout /t 3 >nul
exit
