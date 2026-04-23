param(
    [Parameter(Mandatory)][string]$Paths
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$mediaDir  = Join-Path $scriptDir "media"
$jsonPath  = Join-Path $mediaDir "media.json"

if (-not (Test-Path $mediaDir)) {
    New-Item -ItemType Directory -Path $mediaDir | Out-Null
    Write-Host "Created /media folder." -ForegroundColor Green
}

$mp3Files = [System.Collections.Generic.List[string]]::new()

foreach ($entry in ($Paths -split ";")) {
    $entry = $entry.Trim()
    if (-not $entry) { continue }

    if (Test-Path $entry -PathType Container) {
        $found = Get-ChildItem -Path $entry -Recurse -Filter "*.mp3" | Select-Object -ExpandProperty FullName
        foreach ($f in $found) { $mp3Files.Add($f) }
        Write-Host "Folder: found $($found.Count) MP3(s) in '$entry'" -ForegroundColor Cyan
    } elseif (Test-Path $entry -PathType Leaf) {
        if ([System.IO.Path]::GetExtension($entry).ToLower() -eq ".mp3") {
            $mp3Files.Add($entry)
        } else {
            Write-Host "SKIP: not an MP3 - $entry" -ForegroundColor Yellow
        }
    } else {
        Write-Host "WARNING: Path not found - $entry" -ForegroundColor Yellow
    }
}

if ($mp3Files.Count -eq 0) {
    Write-Host "No MP3 files found. Nothing to do." -ForegroundColor Yellow
    exit 0
}

$mediaData = $null
if (Test-Path $jsonPath) {
    try {
        $raw = Get-Content $jsonPath -Raw -Encoding UTF8
        $mediaData = $raw | ConvertFrom-Json
    } catch {
        Write-Host "WARNING: Could not parse media.json." -ForegroundColor Yellow
    }
}

$songsList = [System.Collections.Generic.List[object]]::new()
if ($mediaData -and $mediaData.songs) {
    foreach ($s in $mediaData.songs) { $songsList.Add($s) }
}

$added = 0

foreach ($srcPath in $mp3Files) {
    $fileName = [System.IO.Path]::GetFileName($srcPath)
    $destPath = Join-Path $mediaDir $fileName

    if (Test-Path $destPath) {
        Write-Host "EXISTS (skip copy): $fileName" -ForegroundColor DarkGray
    } else {
        Copy-Item -Path $srcPath -Destination $destPath
        Write-Host "Copied: $fileName" -ForegroundColor Green
    }

    $alreadyIn = $songsList | Where-Object { $_.file -eq "media/$fileName" }
    if ($alreadyIn) {
        Write-Host "EXISTS in media.json (skip): $fileName" -ForegroundColor DarkGray
        continue
    }

    $displayName = [System.IO.Path]::GetFileNameWithoutExtension($fileName)
    $displayName = $displayName -replace '^[\s\d\.]+', ''
    $displayName = $displayName -replace '[_\-]+', ' '
    $displayName = $displayName.Trim()

    $newId = "s" + ([System.DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()) + $added

    $newEntry = [PSCustomObject]@{
        id       = $newId
        title    = $displayName
        artist   = ""
        album    = ""
        altName  = @()
        duration = 0
        file     = "media/$fileName"
    }

    $songsList.Add($newEntry)
    $added++
    Write-Host "Added to media.json: $displayName" -ForegroundColor Green
}

if ($added -gt 0) {
    if ($mediaData) {
        $mediaData.songs = $songsList.ToArray()
        $jsonOut = $mediaData | ConvertTo-Json -Depth 10
    } else {
        $wrapper = [PSCustomObject]@{ songs = $songsList.ToArray() }
        $jsonOut = $wrapper | ConvertTo-Json -Depth 10
    }

    $utf8NoBom = [System.Text.UTF8Encoding]::new($false)
    [System.IO.File]::WriteAllText($jsonPath, $jsonOut, $utf8NoBom)

    Write-Host ""
    Write-Host "Done! Added $added new song(s) to media.json." -ForegroundColor Green
    Write-Host "TIP: Open media.json to fill in artist, album, altName, duration." -ForegroundColor Cyan
} else {
    Write-Host "No new songs were added (all already present)." -ForegroundColor Cyan
}