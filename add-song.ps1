# ══════════════════════════════════════════════════════
#  add-song.ps1  —  Called by add-song.bat
#  Copies an MP3 to /media and updates media.json
# ══════════════════════════════════════════════════════
param(
    [Parameter(Mandatory)][string]$FilePath
)

# ── Resolve paths ──────────────────────────────────────
$scriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$mediaDir   = Join-Path $scriptDir "media"
$jsonPath   = Join-Path $scriptDir "media.json"

# ── Validate input file ────────────────────────────────
if (-not (Test-Path $FilePath)) {
    Write-Host "ERROR: File not found: $FilePath" -ForegroundColor Red
    exit 1
}
if ([System.IO.Path]::GetExtension($FilePath).ToLower() -ne ".mp3") {
    Write-Host "ERROR: Only .mp3 files are supported." -ForegroundColor Red
    exit 1
}

# ── Ensure /media folder exists ────────────────────────
if (-not (Test-Path $mediaDir)) {
    New-Item -ItemType Directory -Path $mediaDir | Out-Null
    Write-Host "Created /media folder."
}

# ── Copy file ──────────────────────────────────────────
$fileName = [System.IO.Path]::GetFileName($FilePath)
$destPath = Join-Path $mediaDir $fileName

if (Test-Path $destPath) {
    Write-Host "WARNING: '$fileName' already exists in /media. Skipping copy." -ForegroundColor Yellow
} else {
    Copy-Item -Path $FilePath -Destination $destPath
    Write-Host "Copied: $fileName -> /media/" -ForegroundColor Green
}

# ── Load existing media.json ───────────────────────────
$songs = @()
if (Test-Path $jsonPath) {
    try {
        $raw   = Get-Content $jsonPath -Raw -Encoding UTF8
        $songs = $raw | ConvertFrom-Json
        # ConvertFrom-Json returns PSCustomObject array; convert to list
        $songs = [System.Collections.Generic.List[object]]($songs)
    } catch {
        Write-Host "WARNING: Could not parse media.json. Starting fresh." -ForegroundColor Yellow
        $songs = [System.Collections.Generic.List[object]]::new()
    }
} else {
    $songs = [System.Collections.Generic.List[object]]::new()
}

# ── Check for duplicate entry ──────────────────────────
$alreadyIn = $songs | Where-Object { $_.fileName -eq $fileName }
if ($alreadyIn) {
    Write-Host "INFO: '$fileName' is already in media.json. No changes made." -ForegroundColor Cyan
    exit 0
}

# ── Build display name from filename ──────────────────
# Strip extension, replace underscores/hyphens with spaces, trim
$displayName = [System.IO.Path]::GetFileNameWithoutExtension($fileName)
$displayName = $displayName -replace '[_\-]+', ' '
$displayName = $displayName.Trim()

# ── Generate unique ID ─────────────────────────────────
$newId = "s" + ([System.DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())

# ── Build new entry ────────────────────────────────────
$newEntry = [PSCustomObject]@{
    id            = $newId
    fileName      = $fileName
    displayName   = $displayName
    alternateNames = @()
    filePath      = "media/$fileName"
}

# ── Append and save ────────────────────────────────────
$songs.Add($newEntry)

$jsonOut = $songs | ConvertTo-Json -Depth 5
# Ensure UTF-8 without BOM (important for browser fetch)
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[System.IO.File]::WriteAllText($jsonPath, $jsonOut, $utf8NoBom)

Write-Host ""
Write-Host "SUCCESS: Added '$displayName' to media.json" -ForegroundColor Green
Write-Host "  ID       : $newId"
Write-Host "  filePath : media/$fileName"
Write-Host ""
Write-Host "TIP: Open media.json to add alternateNames for better search." -ForegroundColor Cyan
