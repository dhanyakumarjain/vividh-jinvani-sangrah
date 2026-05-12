@echo off
REM ============================================
REM FAQ - Frequently Asked Questions
REM ============================================
color 0E
title FAQ - Frequently Asked Questions

:MENU
cls
echo.
echo ========================================================================
echo   FAQ - FREQUENTLY ASKED QUESTIONS
echo ========================================================================
echo.
echo   Common questions and solutions for managing your music website.
echo.
echo ========================================================================
echo   QUESTIONS:
echo ========================================================================
echo.
echo   [1] How do I upload songs to the server?
echo.
echo   [2] How do I update my website with changes?
echo.
echo   [3] How do I sync songs from my local folder?
echo.
echo   [4] How do I reset all playlists on the server?
echo.
echo   [5] My songs are not visible on the website. What's wrong?
echo.
echo   [6] How do I add new songs?
echo.
echo   [7] How do I delete songs from the server?
echo.
echo   [8] How do I test my website before publishing?
echo.
echo   [9] Songs play locally but not on the live website. Why?
echo.
echo   [10] How do I start completely fresh?
echo.
echo   [11] What's the difference between STEP-2 and TOOL-Sync-Local?
echo.
echo   [12] I see errors when running scripts. What should I do?
echo.
echo   [X] Back to Main Menu
echo.
echo ========================================================================
echo.
set /p choice="Enter question number (1-12) or X to exit: "

if "%choice%"=="1" goto Q1
if "%choice%"=="2" goto Q2
if "%choice%"=="3" goto Q3
if "%choice%"=="4" goto Q4
if "%choice%"=="5" goto Q5
if "%choice%"=="6" goto Q6
if "%choice%"=="7" goto Q7
if "%choice%"=="8" goto Q8
if "%choice%"=="9" goto Q9
if "%choice%"=="10" goto Q10
if "%choice%"=="11" goto Q11
if "%choice%"=="12" goto Q12
if /i "%choice%"=="X" goto EXIT

echo Invalid choice. Please try again.
timeout /t 2 >nul
goto MENU

REM ============================================
:Q1
cls
echo.
echo ========================================================================
echo   Q1: How do I upload songs to the server?
echo ========================================================================
echo.
echo ANSWER:
echo.
echo   Follow these steps:
echo.
echo   1. Add your MP3 files to the "media" folder
echo      Location: vividh-jinvani-sangrah\media\
echo.
echo   2. Organize files in subfolders (each folder = one playlist)
echo      Example:
echo        media\
echo          Morning Prayers\
echo            song1.mp3
echo            song2.mp3
echo          Evening Aarti\
echo            song3.mp3
echo.
echo   3. Run: STEP-1-Upload-Songs.bat
echo      This uploads files to Hugging Face server
echo.
echo   4. Wait for upload to complete (may take 5-30 minutes)
echo.
echo   That's it! Your songs are now on the server.
echo.
echo ========================================================================
pause
goto MENU

REM ============================================
:Q2
cls
echo.
echo ========================================================================
echo   Q2: How do I update my website with changes?
echo ========================================================================
echo.
echo ANSWER:
echo.
echo   After uploading songs, follow these steps:
echo.
echo   1. Run: STEP-2-Update-Website.bat
echo      This fetches songs from server and updates website data
echo.
echo   2. Run: STEP-3-Publish-Website.bat
echo      This makes your website live
echo.
echo   3. Wait 1-2 minutes for changes to appear
echo.
echo   4. Visit your website:
echo      https://dhanyakumarjain.github.io/vividh-jinvani-sangrah
echo.
echo   COMPLETE WORKFLOW:
echo     STEP-1 (Upload) → STEP-2 (Update) → STEP-3 (Publish)
echo.
echo ========================================================================
pause
goto MENU

REM ============================================
:Q3
cls
echo.
echo ========================================================================
echo   Q3: How do I sync songs from my local folder?
echo ========================================================================
echo.
echo ANSWER:
echo.
echo   If you want to update website data from your local media folder
echo   (without fetching from server):
echo.
echo   1. Run: TOOL-Sync-Local.bat
echo      This scans your local media folder
echo.
echo   2. Run: STEP-3-Publish-Website.bat
echo      This publishes the updated website
echo.
echo   USE CASES:
echo     - Testing locally before uploading
echo     - Working offline
echo     - Faster sync (no internet needed)
echo.
echo   NOTE: This does NOT upload to server!
echo         To upload, use STEP-1-Upload-Songs.bat
echo.
echo ========================================================================
pause
goto MENU

REM ============================================
:Q4
cls
echo.
echo ========================================================================
echo   Q4: How do I reset all playlists on the server?
echo ========================================================================
echo.
echo ANSWER:
echo.
echo   To clear everything and start fresh:
echo.
echo   1. Run: TOOL-Reset-Data.bat
echo      This deletes all local files and empties data
echo.
echo   2. Run: STEP-1-Upload-Songs.bat
echo      This uploads the empty state to server
echo.
echo   3. Run: STEP-2-Update-Website.bat
echo      This updates website with empty data
echo.
echo   4. Run: STEP-3-Publish-Website.bat
echo      This publishes the empty website
echo.
echo   Now your server and website are completely empty.
echo.
echo   To add new songs:
echo     - Add files to media folder
echo     - Run STEP-1, STEP-2, STEP-3 again
echo.
echo ========================================================================
pause
goto MENU

REM ============================================
:Q5
cls
echo.
echo ========================================================================
echo   Q5: My songs are not visible on the website. What's wrong?
echo ========================================================================
echo.
echo ANSWER:
echo.
echo   Check these common issues:
echo.
echo   ISSUE 1: Did you run all 3 steps?
echo     Solution:
echo       1. STEP-1-Upload-Songs.bat
echo       2. STEP-2-Update-Website.bat
echo       3. STEP-3-Publish-Website.bat
echo.
echo   ISSUE 2: Website not updated yet
echo     Solution:
echo       - Wait 2-3 minutes after publishing
echo       - Refresh browser (Ctrl + F5)
echo       - Clear browser cache
echo.
echo   ISSUE 3: Files not in correct format
echo     Solution:
echo       - Make sure files are .mp3, .wma, or other audio formats
echo       - Check files are in media folder
echo       - Check folder structure is correct
echo.
echo   ISSUE 4: Upload failed
echo     Solution:
echo       - Check internet connection
echo       - Run STEP-1 again
echo       - Check for error messages
echo.
echo   ISSUE 5: Data files not updated
echo     Solution:
echo       - Check data\songs.json has content
echo       - Check data\playlists.json has content
echo       - If empty, run STEP-2 again
echo.
echo ========================================================================
pause
goto MENU

REM ============================================
:Q6
cls
echo.
echo ========================================================================
echo   Q6: How do I add new songs?
echo ========================================================================
echo.
echo ANSWER:
echo.
echo   To add new songs to your website:
echo.
echo   1. Copy MP3 files to media folder
echo      Location: vividh-jinvani-sangrah\media\
echo.
echo   2. Organize in subfolders (optional)
echo      Each subfolder becomes a playlist
echo.
echo   3. Run: STEP-1-Upload-Songs.bat
echo      Uploads new files to server
echo.
echo   4. Run: STEP-2-Update-Website.bat
echo      Updates website data
echo.
echo   5. Run: STEP-3-Publish-Website.bat
echo      Makes changes live
echo.
echo   TIP: You can add files to existing folders or create new folders
echo        for new playlists.
echo.
echo ========================================================================
pause
goto MENU

REM ============================================
:Q7
cls
echo.
echo ========================================================================
echo   Q7: How do I delete songs from the server?
echo ========================================================================
echo.
echo ANSWER:
echo.
echo   To delete specific songs:
echo.
echo   1. Delete the MP3 files from media folder
echo      Location: vividh-jinvani-sangrah\media\
echo.
echo   2. Run: STEP-1-Upload-Songs.bat
echo      This syncs the deletion to server
echo.
echo   3. Run: STEP-2-Update-Website.bat
echo      Updates website data
echo.
echo   4. Run: STEP-3-Publish-Website.bat
echo      Publishes changes
echo.
echo   To delete ALL songs:
echo.
echo   1. Run: TOOL-Reset-Data.bat
echo      Deletes all local files
echo.
echo   2. Run: STEP-1-Upload-Songs.bat
echo      Uploads empty state
echo.
echo   3. Run: STEP-2-Update-Website.bat
echo      Updates with empty data
echo.
echo   4. Run: STEP-3-Publish-Website.bat
echo      Publishes empty website
echo.
echo ========================================================================
pause
goto MENU

REM ============================================
:Q8
cls
echo.
echo ========================================================================
echo   Q8: How do I test my website before publishing?
echo ========================================================================
echo.
echo ANSWER:
echo.
echo   To preview your website locally:
echo.
echo   1. Run: TOOL-Sync-Local.bat
echo      Updates data from local media folder
echo.
echo   2. Run: TOOL-Test-Website.bat
echo      Opens website in your browser
echo.
echo   3. Test everything:
echo      - Check if songs appear
echo      - Try playing songs
echo      - Check playlists
echo.
echo   4. If everything looks good:
echo      - Run STEP-1-Upload-Songs.bat
echo      - Run STEP-2-Update-Website.bat
echo      - Run STEP-3-Publish-Website.bat
echo.
echo   NOTE: Test website only works on YOUR computer.
echo         Others cannot see it until you publish.
echo.
echo ========================================================================
pause
goto MENU

REM ============================================
:Q9
cls
echo.
echo ========================================================================
echo   Q9: Songs play locally but not on live website. Why?
echo ========================================================================
echo.
echo ANSWER:
echo.
echo   This usually means files are not uploaded to server.
echo.
echo   SOLUTION:
echo.
echo   1. Check if files are in media folder
echo      Location: vividh-jinvani-sangrah\media\
echo.
echo   2. Run: STEP-1-Upload-Songs.bat
echo      Make sure upload completes successfully
echo      Watch for error messages
echo.
echo   3. Run: STEP-2-Update-Website.bat
echo      This fetches from server (not local)
echo.
echo   4. Run: STEP-3-Publish-Website.bat
echo      Publishes to live website
echo.
echo   5. Wait 2-3 minutes and refresh browser (Ctrl + F5)
echo.
echo   COMMON CAUSES:
echo     - Upload failed (check internet)
echo     - Skipped STEP-1
echo     - Files too large (check error messages)
echo     - Authentication failed (re-run SETUP-First-Time.bat)
echo.
echo ========================================================================
pause
goto MENU

REM ============================================
:Q10
cls
echo.
echo ========================================================================
echo   Q10: How do I start completely fresh?
echo ========================================================================
echo.
echo ANSWER:
echo.
echo   To reset everything (local + server + website):
echo.
echo   1. Run: TOOL-Reset-Data.bat
echo      Type: DELETE ALL
echo      This clears all local files and data
echo.
echo   2. Run: STEP-1-Upload-Songs.bat
echo      This uploads empty state to server
echo.
echo   3. Run: STEP-2-Update-Website.bat
echo      This updates website with empty data
echo.
echo   4. Run: STEP-3-Publish-Website.bat
echo      This publishes empty website
echo.
echo   Now everything is empty and you can start fresh!
echo.
echo   To add new songs:
echo     1. Add MP3 files to media folder
echo     2. Run STEP-1-Upload-Songs.bat
echo     3. Run STEP-2-Update-Website.bat
echo     4. Run STEP-3-Publish-Website.bat
echo.
echo ========================================================================
pause
goto MENU

REM ============================================
:Q11
cls
echo.
echo ========================================================================
echo   Q11: What's the difference between STEP-2 and TOOL-Sync-Local?
echo ========================================================================
echo.
echo ANSWER:
echo.
echo   STEP-2-Update-Website.bat:
echo     - Fetches songs from Hugging Face server
echo     - Requires internet connection
echo     - Use after uploading to server
echo     - This is the STANDARD workflow
echo.
echo   TOOL-Sync-Local.bat:
echo     - Scans local media folder
echo     - Works offline (no internet needed)
echo     - Use for testing before uploading
echo     - Faster than STEP-2
echo.
echo   WHEN TO USE EACH:
echo.
echo   Use STEP-2 when:
echo     - After running STEP-1 (Upload)
echo     - Want to sync from server
echo     - Normal workflow
echo.
echo   Use TOOL-Sync-Local when:
echo     - Testing locally
echo     - Working offline
echo     - Want quick preview
echo     - Before uploading to server
echo.
echo   TYPICAL WORKFLOWS:
echo.
echo   Standard (Online):
echo     STEP-1 → STEP-2 → STEP-3
echo.
echo   Testing (Offline):
echo     TOOL-Sync-Local → TOOL-Test-Website
echo.
echo ========================================================================
pause
goto MENU

REM ============================================
:Q12
cls
echo.
echo ========================================================================
echo   Q12: I see errors when running scripts. What should I do?
echo ========================================================================
echo.
echo ANSWER:
echo.
echo   Common errors and solutions:
echo.
echo   ERROR: "Git is not installed"
echo     Solution: Run SETUP-Check-System.bat
echo               Install missing software
echo.
echo   ERROR: "Git LFS is not installed"
echo     Solution: Install Git LFS
echo               https://git-lfs.github.com/
echo               Then run SETUP-Large-Files.bat
echo.
echo   ERROR: "Authentication failed"
echo     Solution: Run SETUP-Fix-Problems.bat
echo               Re-enter credentials
echo.
echo   ERROR: "Media folder not found"
echo     Solution: Run SETUP-First-Time.bat
echo               This creates the media folder
echo.
echo   ERROR: "Push rejected" or "Large files"
echo     Solution: Run SETUP-Large-Files.bat
echo               This configures Git LFS
echo.
echo   ERROR: "Nothing to commit"
echo     Solution: This is normal if no changes
echo               Script will continue automatically
echo.
echo   GENERAL TROUBLESHOOTING:
echo     1. Run SETUP-Check-System.bat
echo     2. Fix any failed checks
echo     3. Run SETUP-Fix-Problems.bat
echo     4. Try the operation again
echo.
echo ========================================================================
pause
goto MENU

REM ============================================
:EXIT
exit /b 0
