# Setup Guide - Fresh Computer Installation

This guide helps you set up the Music Website Manager on a new computer.

## Prerequisites

Before you start, you need to install these software:

### 1. **Git** (Required)
- **What it does:** Version control system for managing code
- **Download:** https://git-scm.com/download/win
- **Installation:**
  1. Download the installer
  2. Run the installer
  3. Use default settings (just click Next)
  4. **Important:** Make sure "Git from the command line" is selected

### 2. **Git LFS** (Required)
- **What it does:** Handles large files (MP3s, videos)
- **Download:** https://git-lfs.github.com/
- **Installation:**
  1. Download the installer
  2. Run the installer
  3. Open Command Prompt and run: `git lfs install`

**Alternative installation (if you have winget):**
```bash
winget install GitHub.GitLFS
```

### 3. **Python** (Required)
- **What it does:** Runs scripts for syncing songs
- **Download:** https://www.python.org/downloads/
- **Installation:**
  1. Download Python 3.x installer
  2. Run the installer
  3. **IMPORTANT:** Check "Add Python to PATH" ✅
  4. Click "Install Now"

## Step-by-Step Setup

### Step 1: Clone the Repository

Open Command Prompt or PowerShell and run:

```bash
git clone https://github.com/[your-username]/vividh-jinvani-sangrah.git
cd vividh-jinvani-sangrah
```

### Step 2: Run Preflight Check

```bash
cd mp3-management
Preflight-Check.bat
```

This will check if everything is installed correctly.

**If any checks fail:**
- Install the missing software (see Prerequisites above)
- Run `Preflight-Check.bat` again
- Repeat until all checks pass

### Step 3: Configure Git

If Git authentication check failed, configure it:

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
git config --global credential.helper manager
```

### Step 4: First Time Setup

Run the setup script:

```bash
SETUP-First-Time.bat
```

**What it does:**
- Clones your Hugging Face music repository
- Creates the `media/` folder
- Sets up Git LFS for large files

**You'll need:**
- Your Hugging Face username
- Your Hugging Face access token
  - Get it from: https://huggingface.co/settings/tokens
  - Create a token with "Write" access

### Step 5: Verify Everything Works

Run the main menu:

```bash
START-HERE.bat
```

You should see the menu with all options.

## Authentication Setup

### GitHub Authentication

**First time pushing to GitHub:**
1. Run `STEP-3-Publish-Website.bat`
2. You'll be prompted for credentials
3. Enter your GitHub username
4. For password, use a Personal Access Token (not your GitHub password)
   - Create token: https://github.com/settings/tokens
   - Select "repo" scope
   - Copy the token and paste it

**Windows will remember your credentials** (using Credential Manager)

### Hugging Face Authentication

**First time uploading songs:**
1. Run `STEP-1-Upload-Songs.bat`
2. You'll be prompted for credentials
3. Enter your Hugging Face username
4. For password, use your HF Access Token
   - Get it from: https://huggingface.co/settings/tokens

**Windows will remember your credentials** (using Credential Manager)

## Troubleshooting

### "Git is not recognized"
- Git is not installed or not in PATH
- Reinstall Git and make sure "Add to PATH" is checked
- Restart Command Prompt after installation

### "Python is not recognized"
- Python is not installed or not in PATH
- Reinstall Python and check "Add Python to PATH" ✅
- Restart Command Prompt after installation

### "Git LFS is not installed"
- Install Git LFS from https://git-lfs.github.com/
- Run `git lfs install` after installation

### "Authentication failed"
- Make sure you're using access tokens, not passwords
- GitHub: Use Personal Access Token
- Hugging Face: Use Access Token
- Check tokens have correct permissions (Write access)

### "Cannot connect to Hugging Face"
- Check internet connection
- Verify Hugging Face repository URL is correct
- Make sure you have access to the repository

## Quick Reference

### Required Software
| Software | Purpose | Download |
|----------|---------|----------|
| Git | Version control | https://git-scm.com/download/win |
| Git LFS | Large files | https://git-lfs.github.com/ |
| Python | Scripts | https://www.python.org/downloads/ |

### Important Commands
```bash
# Check if everything is installed
Preflight-Check.bat

# First time setup
SETUP-First-Time.bat

# Main menu
START-HERE.bat

# Upload songs
STEP-1-Upload-Songs.bat

# Update website
STEP-2-Update-Website.bat

# Publish website
STEP-3-Publish-Website.bat
```

### Getting Tokens

**GitHub Personal Access Token:**
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select "repo" scope
4. Click "Generate token"
5. Copy and save the token

**Hugging Face Access Token:**
1. Go to: https://huggingface.co/settings/tokens
2. Click "New token"
3. Select "Write" access
4. Click "Generate"
5. Copy and save the token

## Support

If you encounter issues:
1. Run `Preflight-Check.bat` to diagnose
2. Check this guide's Troubleshooting section
3. See `README.md` for detailed documentation
4. Check error messages carefully - they usually tell you what's wrong

## Summary

**Minimum requirements:**
- ✅ Git installed
- ✅ Git LFS installed
- ✅ Python installed
- ✅ Git configured (name, email)
- ✅ GitHub authentication set up
- ✅ Hugging Face authentication set up

**Once everything is set up:**
1. Add songs to `media/` folder
2. Run `STEP-1-Upload-Songs.bat`
3. Run `STEP-2-Update-Website.bat`
4. Run `STEP-3-Publish-Website.bat`
5. Your website is live! 🎉
