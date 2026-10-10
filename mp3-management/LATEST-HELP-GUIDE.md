# LATEST HELP GUIDE - Start Here on a New Computer

This is the one guide you need. It tells you:

1. **Which software to install** (with download links and how to install it)
2. **Which file to run first**, and in what order
3. How to fix common problems

Everything below runs on **Windows**.

---

## 1. Software you must install (once per computer)

Install these **in this order**, then **restart your terminal / PC**.

### 1.1 Git (required)
- What it does: uploads/downloads your songs and website files.
- Download: **https://git-scm.com/download/win**
- Install: run the installer, click **Next** through the defaults.
  - Make sure **"Git from the command line"** is selected (it is by default).
- Verify: open a new terminal and type `git --version`.

### 1.2 Git LFS (required - for MP3 files)
- What it does: stores large files (songs) correctly.
- Download: **https://git-lfs.github.com/**
- Install: run the installer. Then open a terminal and run:
  ```
  git lfs install
  ```
- Alternative (if you have `winget`):
  ```
  winget install GitHub.GitLFS
  ```
- Verify: `git lfs version`

### 1.3 Python 3 (required - runs the sync scripts)
- What it does: rebuilds the website's song list from your media.
- Download: **https://www.python.org/downloads/**
- Install: run the installer and **IMPORTANT - tick the box "Add Python to PATH"**, then click **Install Now**.
- Verify: `python --version`

> After installing, **close and reopen** the terminal window, otherwise the new
> commands are not found.

---

## 2. Accounts and tokens (once)

You need an account on GitHub and Hugging Face, and a token for each.

### 2.1 GitHub (for the website)
- If your terminal asks you to log in while publishing, use a **Personal Access Token** (not your password).
- Create one: **https://github.com/settings/tokens**
  1. Click **Generate new token (classic)**
  2. Tick the **repo** scope
  3. Click **Generate token** and copy it

### 2.2 Hugging Face (for the songs)
- Create a token: **https://huggingface.co/settings/tokens**
  1. Click **New token**
  2. Choose **Write** access
  3. Click **Generate** and copy it

> Windows remembers these (Credential Manager). You normally only enter them the
> first time.

---

## 3. Get the project folder

Do **one** of these:

- **Option A - copy the folder** from the old PC (for example the
  `vividh-jinvani-sangrah` folder), **or**
- **Option B - clone it fresh** in a terminal:
  ```
  git clone https://github.com/dhanyakumarjain/vividh-jinvani-sangrah.git
  cd vividh-jinvani-sangrah
  ```

You do **not** need the `media/` folder in advance - Step 4 below downloads it.

---

## 4. Run order - do these IN ORDER

All the files below are inside the **`mp3-management`** folder. Open a terminal
there first:

```
cd vividh-jinvani-sangrah\mp3-management
```

| Order | File to run | What it does | How often |
|-------|-------------|--------------|-----------|
| 1 | `SETUP-Check-System.bat` | Checks Git, Git LFS, Python, and login | Once (or when stuck) |
| 2 | `SETUP-First-Time.bat` | Downloads the existing songs into `media/` | Once per new PC |
| 3 | *(add your MP3 files to `media/`)* | Each sub-folder = one playlist | As needed |
| 4 | `STEP-1-Upload-Songs.bat` | Uploads songs to Hugging Face | Every time songs change |
| 5 | `STEP-2-Update-Website.bat` | Rebuilds the website song list | Right after Step 1 |
| 6 | `TOOL-Test-Website.bat` | Previews the site on your PC (optional) | Optional |
| 7 | `STEP-3-Publish-Website.bat` | Publishes the website live | Last step |

**Live website:** https://dhanyakumarjain.github.io/vividh-jinvani-sangrah/
(GitHub Pages can take 1-2 minutes; refresh with **Ctrl+F5**.)

### Easier way: the menu
Instead of running the files one by one, you can just run **`START-HERE.bat`**
and type the letter/number it shows (S = setup, 1/2/3 = steps, T = test, etc.).

> **How to run a `.bat` file:** double-click it, or right-click it and choose
> **"Open in Terminal"**. If a `cmd` window flashes and closes, open a terminal
> in the `mp3-management` folder and type the file name, e.g. `SETUP-Check-System.bat`.

---

## 5. First-time setup - what you will be asked

When you run **`SETUP-First-Time.bat`** (order 2), it downloads the Hugging Face
song repository into a new `media/` folder. When prompted:

- **Hugging Face username:** your HF user name
- **Password:** paste your **HF Access Token** (from section 2.2)

If Git complains about your identity, set it once:
```
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
git config --global credential.helper manager
```

---

## 6. Adding songs

Inside the `media/` folder:

```
media/
  Morning Prayers/      <- one folder = one playlist
    song1.mp3
    song2.mp3
  Evening Aarti/
    song3.mp3
```

The player streams from Hugging Face, so after adding files always run
**Step 1 -> Step 2 -> Step 3**. To preview first, run `TOOL-Test-Website.bat`.

---

## 7. All files explained

| File | Purpose |
|------|---------|
| `LATEST-HELP-GUIDE.md` | This guide |
| `START-HERE.bat` | Menu that runs everything below |
| `SETUP-Check-System.bat` | Verify Git / Git LFS / Python / login |
| `SETUP-First-Time.bat` | Clone the Hugging Face songs into `media/` (once) |
| `SETUP-Fix-Problems.bat` | Reset a broken Git configuration |
| `SETUP-Large-Files.bat` | Tell Git LFS which media file types to track |
| `STEP-1-Upload-Songs.bat` | Upload (force-push) `media/` to Hugging Face |
| `STEP-2-Update-Website.bat` | Rebuild `data/songs.json` + `data/playlists.json` |
| `STEP-3-Publish-Website.bat` | Commit and push the website to GitHub Pages |
| `TOOL-Sync-Local.bat` | Rebuild `data/` from local `media/` (works offline) |
| `TOOL-Test-Website.bat` | Run the site locally (auto-picks a free port) |
| `TOOL-Reset-Data.bat` | Delete local `media/` + empty `data/` (dangerous) |
| `_generate-git-info.bat` | Optional: write `data/git-info.json` |

---

## 8. Troubleshooting

**"git / python / git lfs is not recognized"**
That software is not installed, or the terminal was open before you installed it.
Install it (section 1) and open a **new** terminal. Re-run `SETUP-Check-System.bat`.

**Login / authentication failed**
Use **tokens**, not passwords. GitHub -> Personal Access Token (repo scope);
Hugging Face -> Access Token (Write). Re-run `SETUP-Fix-Problems.bat` if Git
config is damaged, then run the step again.

**Website does not change after publishing**
Wait 1-2 minutes for GitHub Pages, then press **Ctrl+F5**.

**Songs do not play**
Check the files are real audio (`.mp3` etc.) and file/folder names do not contain
unusual characters.

**"Port 8080 is busy" when testing locally**
This is handled automatically - the server tries 8080, then 8081, 8082... and
prints the address it is using.

**I want to start completely fresh**
Run `TOOL-Reset-Data.bat` (deletes local `media/` and empties `data/`), then
**Step 1 -> Step 2 -> Step 3**.

**A `cmd` window flashes and disappears**
Open a terminal in the `mp3-management` folder and run the file by typing its
name, so you can read the error message. Then re-run
`SETUP-Check-System.bat`.

---

## 9. Quick cheat sheet

```
# one-time per computer
SETUP-Check-System.bat
SETUP-First-Time.bat

# every time you add / change / delete songs
STEP-1-Upload-Songs.bat
STEP-2-Update-Website.bat
TOOL-Test-Website.bat      (optional preview)
STEP-3-Publish-Website.bat

# offline rebuild from a local media/ folder
TOOL-Sync-Local.bat

# menu for everything
START-HERE.bat
```
