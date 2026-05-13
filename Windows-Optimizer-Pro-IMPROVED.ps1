# ==========================================
# Windows Auto Optimizer Pro - IMPROVED VERSION
# Windows 10 / Windows 11
# Professional Cleanup & Optimization Tool
# ==========================================

# Run as Administrator Check
If (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "ERROR: This script requires Administrator privileges!" -ForegroundColor Red
    Write-Host "Right-click the script and select 'Run as Administrator'" -ForegroundColor Yellow
    Pause
    Exit
}

# ------------------------------
# Global Variables
# ------------------------------
$LogFile = "$env:USERPROFILE\Desktop\WindowsOptimizer_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"
$StartTime = Get-Date
$BeforeSize = 0
$AfterSize = 0
$ErrorCount = 0

# ------------------------------
# Logging Function
# ------------------------------
Function Write-Log {
    param(
        [string]$Message,
        [string]$Type = "INFO"
    )
    $Time = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "$Time [$Type] - $Message"
    
    # Write to file
    $LogMessage | Out-File -Append $LogFile -ErrorAction SilentlyContinue
    
    # Write to console with color
    switch ($Type) {
        "ERROR"   { Write-Host $Message -ForegroundColor Red }
        "WARNING" { Write-Host $Message -ForegroundColor Yellow }
        "SUCCESS" { Write-Host $Message -ForegroundColor Green }
        default   { Write-Host $Message -ForegroundColor Cyan }
    }
}

# ------------------------------
# Initialize Log
# ------------------------------
Function Initialize-Log {
    Write-Log "========================================" "INFO"
    Write-Log "Windows Auto Optimizer Pro - Started" "INFO"
    Write-Log "========================================" "INFO"
    Write-Log "Computer: $env:COMPUTERNAME" "INFO"
    Write-Log "User: $env:USERNAME" "INFO"
    Write-Log "OS: $(Get-CimInstance Win32_OperatingSystem | Select-Object -ExpandProperty Caption)" "INFO"
    Write-Log "PowerShell Version: $($PSVersionTable.PSVersion)" "INFO"
    Write-Log "========================================" "INFO"
}

# ------------------------------
# Get Disk Space
# ------------------------------
Function Get-DiskSpace {
    Try {
        $Drive = Get-PSDrive C -ErrorAction Stop
        return $Drive.Free
    }
    Catch {
        Write-Log "Failed to get disk space: $($_.Exception.Message)" "ERROR"
        return 0
    }
}

# ------------------------------
# Create Restore Point
# ------------------------------
Function Create-RestorePoint {
    Write-Host "`n[RESTORE POINT]" -ForegroundColor Yellow
    Write-Log "Creating System Restore Point..." "INFO"
    
    Try {
        # Check if restore points are enabled
        $RestoreStatus = Get-ComputerRestorePoint -ErrorAction SilentlyContinue
        
        # Enable restore on C: drive
        Enable-ComputerRestore -Drive "C:\" -ErrorAction Stop
        
        # Create restore point
        Checkpoint-Computer -Description "Before_Windows_Optimization_$(Get-Date -Format 'yyyyMMdd_HHmm')" -RestorePointType "MODIFY_SETTINGS" -ErrorAction Stop
        
        Write-Log "✓ Restore Point Created Successfully" "SUCCESS"
    }
    Catch {
        Write-Log "✗ Failed to create restore point: $($_.Exception.Message)" "WARNING"
        Write-Log "Continuing without restore point..." "WARNING"
    }
}

# ------------------------------
# Clear Temporary Files
# ------------------------------
Function Clear-TempFiles {
    Write-Host "`n[TEMPORARY FILES CLEANUP]" -ForegroundColor Green
    Write-Log "Cleaning Temporary Files..." "INFO"
    
    $Paths = @(
        @{Path="$env:TEMP\*"; Name="User Temp"},
        @{Path="C:\Windows\Temp\*"; Name="Windows Temp"},
        @{Path="C:\Windows\Prefetch\*"; Name="Prefetch"},
        @{Path="$env:LOCALAPPDATA\Microsoft\Windows\Explorer\thumbcache*"; Name="Thumbnail Cache"},
        @{Path="$env:LOCALAPPDATA\Temp\*"; Name="Local Temp"},
        @{Path="$env:LOCALAPPDATA\Microsoft\Windows\INetCache\*"; Name="IE Cache"},
        @{Path="$env:LOCALAPPDATA\Microsoft\Windows\WebCache\*"; Name="Web Cache"}
    )
    
    foreach ($Item in $Paths) {
        Try {
            $BeforeCount = (Get-ChildItem $Item.Path -Recurse -ErrorAction SilentlyContinue | Measure-Object).Count
            Remove-Item $Item.Path -Force -Recurse -ErrorAction SilentlyContinue
            Write-Log "✓ Cleaned: $($Item.Name) ($BeforeCount items)" "SUCCESS"
        }
        Catch {
            Write-Log "✗ Failed: $($Item.Name) - $($_.Exception.Message)" "WARNING"
        }
    }
    
    # Recycle Bin
    Try {
        Clear-RecycleBin -Force -ErrorAction Stop
        Write-Log "✓ Recycle Bin Cleared" "SUCCESS"
    }
    Catch {
        Write-Log "✗ Failed to clear Recycle Bin" "WARNING"
    }
    
    # Windows Update Cache
    Try {
        Write-Log "Cleaning Windows Update Cache..." "INFO"
        Stop-Service wuauserv -Force -ErrorAction Stop
        $UpdateFiles = Get-ChildItem "C:\Windows\SoftwareDistribution\Download\*" -ErrorAction SilentlyContinue
        Remove-Item "C:\Windows\SoftwareDistribution\Download\*" -Force -Recurse -ErrorAction SilentlyContinue
        Start-Service wuauserv -ErrorAction Stop
        Write-Log "✓ Windows Update Cache Cleared" "SUCCESS"
    }
    Catch {
        Write-Log "✗ Failed to clear Windows Update Cache: $($_.Exception.Message)" "WARNING"
        Start-Service wuauserv -ErrorAction SilentlyContinue
    }
    
    # Delivery Optimization Files
    Try {
        Delete-DeliveryOptimizationCache -Force -ErrorAction Stop
        Write-Log "✓ Delivery Optimization Cache Cleared" "SUCCESS"
    }
    Catch {
        Write-Log "✗ Failed to clear Delivery Optimization Cache" "WARNING"
    }
}

# ------------------------------
# Browser Cache Cleanup
# ------------------------------
Function Clear-BrowserCache {
    Write-Host "`n[BROWSER CACHE CLEANUP]" -ForegroundColor Green
    Write-Log "Cleaning Browser Cache..." "INFO"
    
    $Browsers = @(
        @{Path="$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Cache\*"; Name="Chrome Cache"},
        @{Path="$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Code Cache\*"; Name="Chrome Code Cache"},
        @{Path="$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Cache\*"; Name="Edge Cache"},
        @{Path="$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Code Cache\*"; Name="Edge Code Cache"},
        @{Path="$env:APPDATA\Mozilla\Firefox\Profiles\*\cache2\*"; Name="Firefox Cache"}
    )
    
    foreach ($Browser in $Browsers) {
        Try {
            if (Test-Path $Browser.Path) {
                Remove-Item $Browser.Path -Force -Recurse -ErrorAction SilentlyContinue
                Write-Log "✓ Cleaned: $($Browser.Name)" "SUCCESS"
            }
        }
        Catch {
            Write-Log "✗ Failed: $($Browser.Name)" "WARNING"
        }
    }
}

# ------------------------------
# Flush DNS
# ------------------------------
Function Flush-DNS {
    Write-Host "`n[DNS CACHE]" -ForegroundColor Green
    Write-Log "Flushing DNS Cache..." "INFO"
    
    Try {
        ipconfig /flushdns | Out-Null
        Write-Log "✓ DNS Cache Flushed" "SUCCESS"
    }
    Catch {
        Write-Log "✗ Failed to flush DNS" "ERROR"
    }
}

# ------------------------------
# Disk Cleanup
# ------------------------------
Function Run-DiskCleanup {
    Write-Host "`n[DISK CLEANUP]" -ForegroundColor Green
    Write-Log "Running Disk Cleanup..." "INFO"
    
    Try {
        # Set registry keys for automatic cleanup
        $CleanupKeys = @(
            "Active Setup Temp Folders",
            "BranchCache",
            "Downloaded Program Files",
            "Internet Cache Files",
            "Memory Dump Files",
            "Old ChkDsk Files",
            "Previous Installations",
            "Recycle Bin",
            "Service Pack Cleanup",
            "Setup Log Files",
            "System error memory dump files",
            "System error minidump files",
            "Temporary Files",
            "Temporary Setup Files",
            "Thumbnail Cache",
            "Update Cleanup",
            "Upgrade Discarded Files",
            "Windows Defender",
            "Windows Error Reporting Archive Files",
            "Windows Error Reporting Queue Files",
            "Windows Error Reporting System Archive Files",
            "Windows Error Reporting System Queue Files",
            "Windows ESD installation files",
            "Windows Upgrade Log Files"
        )
        
        foreach ($Key in $CleanupKeys) {
            $RegPath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VolumeCaches\$Key"
            if (Test-Path $RegPath) {
                Set-ItemProperty -Path $RegPath -Name "StateFlags0001" -Value 2 -ErrorAction SilentlyContinue
            }
        }
        
        # Run cleanup
        Start-Process "cleanmgr.exe" -ArgumentList "/sagerun:1" -Wait -NoNewWindow
        Write-Log "✓ Disk Cleanup Completed" "SUCCESS"
    }
    Catch {
        Write-Log "✗ Disk Cleanup Failed: $($_.Exception.Message)" "ERROR"
    }
}

# ------------------------------
# Remove Old Logs
# ------------------------------
Function Remove-OldLogs {
    Write-Host "`n[OLD LOGS CLEANUP]" -ForegroundColor Green
    Write-Log "Removing Old Logs (30+ days)..." "INFO"
    
    $LogPaths = @(
        "C:\Windows\Logs",
        "C:\Windows\System32\LogFiles",
        "C:\ProgramData\Microsoft\Windows\WER"
    )
    
    foreach ($LogPath in $LogPaths) {
        Try {
            if (Test-Path $LogPath) {
                $OldLogs = Get-ChildItem $LogPath -Recurse -ErrorAction SilentlyContinue |
                    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) }
                
                $Count = ($OldLogs | Measure-Object).Count
                $OldLogs | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
                
                Write-Log "✓ Removed $Count old log files from $LogPath" "SUCCESS"
            }
        }
        Catch {
            Write-Log "✗ Failed to clean logs in $LogPath" "WARNING"
        }
    }
}

# ------------------------------
# Clear Crash Dumps
# ------------------------------
Function Clear-CrashDumps {
    Write-Host "`n[CRASH DUMPS CLEANUP]" -ForegroundColor Green
    Write-Log "Cleaning Crash Dumps..." "INFO"
    
    Try {
        $DumpPaths = @(
            "C:\Windows\Minidump\*",
            "C:\Windows\MEMORY.DMP",
            "$env:LOCALAPPDATA\CrashDumps\*"
        )
        
        foreach ($Path in $DumpPaths) {
            if (Test-Path $Path) {
                Remove-Item $Path -Force -Recurse -ErrorAction SilentlyContinue
            }
        }
        
        Write-Log "✓ Crash Dumps Removed" "SUCCESS"
    }
    Catch {
        Write-Log "✗ Failed to remove crash dumps" "WARNING"
    }
}

# ------------------------------
# Clear Microsoft Store Cache
# ------------------------------
Function Clear-StoreCache {
    Write-Host "`n[MICROSOFT STORE CACHE]" -ForegroundColor Green
    Write-Log "Clearing Microsoft Store Cache..." "INFO"
    
    Try {
        Start-Process "wsreset.exe" -WindowStyle Hidden
        Start-Sleep -Seconds 5
        Stop-Process -Name "WinStore.App" -Force -ErrorAction SilentlyContinue
        Write-Log "✓ Microsoft Store Cache Cleared" "SUCCESS"
    }
    Catch {
        Write-Log "✗ Failed to clear Store cache" "WARNING"
    }
}

# ------------------------------
# Optimize Drives
# ------------------------------
Function Optimize-Drives {
    Write-Host "`n[DRIVE OPTIMIZATION]" -ForegroundColor Yellow
    Write-Log "Optimizing Drives..." "INFO"
    
    Try {
        $Drives = Get-PhysicalDisk
        
        foreach ($Drive in $Drives) {
            $DriveLetter = (Get-Partition -DiskNumber $Drive.DeviceID | Where-Object {$_.DriveLetter})[0].DriveLetter
            
            if ($DriveLetter) {
                if ($Drive.MediaType -eq "SSD") {
                    Write-Log "Optimizing SSD (Drive $DriveLetter) - Running TRIM..." "INFO"
                    Optimize-Volume -DriveLetter $DriveLetter -ReTrim -ErrorAction Stop
                    Write-Log "✓ SSD TRIM Completed on Drive $DriveLetter" "SUCCESS"
                }
                else {
                    Write-Log "Optimizing HDD (Drive $DriveLetter) - Running Defrag..." "INFO"
                    Optimize-Volume -DriveLetter $DriveLetter -Defrag -ErrorAction Stop
                    Write-Log "✓ HDD Defragmentation Completed on Drive $DriveLetter" "SUCCESS"
                }
            }
        }
    }
    Catch {
        Write-Log "✗ Drive Optimization Failed: $($_.Exception.Message)" "ERROR"
    }
}

# ------------------------------
# System Repair
# ------------------------------
Function Repair-Windows {
    Write-Host "`n[SYSTEM REPAIR]" -ForegroundColor Yellow
    Write-Log "Running System File Checker..." "INFO"
    
    Try {
        # SFC Scan
        Write-Log "Running SFC /scannow (this may take 10-15 minutes)..." "INFO"
        $SFCResult = sfc /scannow
        Write-Log "✓ SFC Scan Completed" "SUCCESS"
        
        # DISM Repair
        Write-Log "Running DISM RestoreHealth (this may take 15-20 minutes)..." "INFO"
        DISM /Online /Cleanup-Image /RestoreHealth
        Write-Log "✓ DISM Repair Completed" "SUCCESS"
    }
    Catch {
        Write-Log "✗ System Repair Failed: $($_.Exception.Message)" "ERROR"
    }
}

# ------------------------------
# Disk Health Check
# ------------------------------
Function Check-DiskHealth {
    Write-Host "`n[DISK HEALTH CHECK]" -ForegroundColor Yellow
    Write-Log "Checking Disk Health..." "INFO"
    
    Try {
        $Disks = Get-PhysicalDisk
        
        foreach ($Disk in $Disks) {
            $Health = $Disk.HealthStatus
            $Status = $Disk.OperationalStatus
            $Name = $Disk.FriendlyName
            
            Write-Log "Disk: $Name | Health: $Health | Status: $Status" "INFO"
            
            if ($Health -ne "Healthy") {
                Write-Log "⚠ WARNING: Disk '$Name' is not healthy!" "WARNING"
            }
        }
        
        Write-Log "✓ Disk Health Check Completed" "SUCCESS"
    }
    Catch {
        Write-Log "✗ Disk Health Check Failed" "ERROR"
    }
}

# ------------------------------
# Privacy Cleanup
# ------------------------------
Function Privacy-Cleanup {
    Write-Host "`n[PRIVACY CLEANUP]" -ForegroundColor Magenta
    Write-Log "Performing Privacy Cleanup..." "INFO"
    
    Try {
        # Recent Files
        Remove-Item "$env:APPDATA\Microsoft\Windows\Recent\*" -Force -Recurse -ErrorAction SilentlyContinue
        Write-Log "✓ Recent Files History Cleared" "SUCCESS"
        
        # Jump Lists
        Remove-Item "$env:APPDATA\Microsoft\Windows\Recent\AutomaticDestinations\*" -Force -ErrorAction SilentlyContinue
        Remove-Item "$env:APPDATA\Microsoft\Windows\Recent\CustomDestinations\*" -Force -ErrorAction SilentlyContinue
        Write-Log "✓ Jump Lists Cleared" "SUCCESS"
        
        # Clear Run History
        Remove-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\RunMRU" -Name "*" -ErrorAction SilentlyContinue
        Write-Log "✓ Run History Cleared" "SUCCESS"
    }
    Catch {
        Write-Log "✗ Privacy Cleanup Failed: $($_.Exception.Message)" "WARNING"
    }
}

# ------------------------------
# Disable Startup Apps
# ------------------------------
Function Show-StartupApps {
    Write-Host "`n[STARTUP APPLICATIONS]" -ForegroundColor Magenta
    Write-Log "Listing Startup Applications..." "INFO"
    
    Try {
        $StartupApps = Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location
        
        if ($StartupApps) {
            Write-Host "`nStartup Applications:" -ForegroundColor Yellow
            $StartupApps | Format-Table -AutoSize
            Write-Log "Found $($StartupApps.Count) startup applications" "INFO"
            
            Write-Host "`nTo disable startup apps, use Task Manager > Startup tab" -ForegroundColor Cyan
        }
        else {
            Write-Log "No startup applications found" "INFO"
        }
    }
    Catch {
        Write-Log "✗ Failed to list startup apps" "ERROR"
    }
}

# ------------------------------
# Schedule Weekly Cleanup
# ------------------------------
Function Schedule-Cleanup {
    Write-Host "`n[SCHEDULE AUTOMATIC CLEANUP]" -ForegroundColor Green
    Write-Log "Scheduling Weekly Cleanup..." "INFO"
    
    Try {
        $ScriptPath = $PSCommandPath
        
        if (-not $ScriptPath) {
            Write-Log "✗ Cannot schedule: Script path not found. Save the script first." "ERROR"
            return
        }
        
        $Action = New-ScheduledTaskAction -Execute "powershell.exe" `
            -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$ScriptPath`" -AutoRun"
        
        $Trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 3am
        
        $Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
        
        Register-ScheduledTask `
            -TaskName "WindowsAutoOptimizerPro" `
            -Action $Action `
            -Trigger $Trigger `
            -Settings $Settings `
            -RunLevel Highest `
            -Description "Automatic Windows cleanup and optimization" `
            -Force
        
        Write-Log "✓ Weekly Cleanup Scheduled (Every Sunday at 3:00 AM)" "SUCCESS"
    }
    Catch {
        Write-Log "✗ Failed to schedule cleanup: $($_.Exception.Message)" "ERROR"
    }
}

# ------------------------------
# Export Report
# ------------------------------
Function Export-Report {
    Write-Host "`n[GENERATING REPORT]" -ForegroundColor Green
    
    $AfterSize = Get-DiskSpace
    $Recovered = ($AfterSize - $BeforeSize) / 1GB
    $Duration = (Get-Date) - $StartTime
    
    $Report = @"

=========================================
OPTIMIZATION REPORT
=========================================
Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Duration: $($Duration.Hours)h $($Duration.Minutes)m $($Duration.Seconds)s

DISK SPACE:
- Before: $([math]::Round($BeforeSize / 1GB, 2)) GB free
- After: $([math]::Round($AfterSize / 1GB, 2)) GB free
- Recovered: $([math]::Round($Recovered, 2)) GB

STATUS: Optimization Completed
Errors: $ErrorCount

Log File: $LogFile
=========================================
"@
    
    Add-Content $LogFile $Report
    Write-Host $Report -ForegroundColor Cyan
    
    Write-Log "Report saved to: $LogFile" "SUCCESS"
}

# ------------------------------
# Quick Cleanup
# ------------------------------
Function Quick-Cleanup {
    $BeforeSize = Get-DiskSpace
    
    Clear-TempFiles
    Clear-BrowserCache
    Flush-DNS
    Run-DiskCleanup
    
    Export-Report
}

# ------------------------------
# Deep Cleanup
# ------------------------------
Function Deep-Cleanup {
    $BeforeSize = Get-DiskSpace
    
    Create-RestorePoint
    Clear-TempFiles
    Clear-BrowserCache
    Remove-OldLogs
    Clear-CrashDumps
    Clear-StoreCache
    Flush-DNS
    Run-DiskCleanup
    Optimize-Drives
    Privacy-Cleanup
    Show-StartupApps
    
    Export-Report
}

# ------------------------------
# Auto-Run Mode (for scheduled tasks)
# ------------------------------
if ($args -contains "-AutoRun") {
    Initialize-Log
    Write-Log "Running in AUTO-RUN mode (scheduled task)" "INFO"
    Quick-Cleanup
    Exit
}

# ------------------------------
# Main Menu
# ------------------------------
Initialize-Log

do {
    Clear-Host
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "     Windows Auto Optimizer Pro v2.0" -ForegroundColor White
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host " 1. Quick Cleanup (5-10 min)" -ForegroundColor Green
    Write-Host " 2. Deep Cleanup (15-30 min)" -ForegroundColor Green
    Write-Host " 3. Repair Windows (SFC + DISM)" -ForegroundColor Yellow
    Write-Host " 4. Optimize Drives" -ForegroundColor Yellow
    Write-Host " 5. Check Disk Health" -ForegroundColor Yellow
    Write-Host " 6. Schedule Automatic Cleanup" -ForegroundColor Magenta
    Write-Host " 7. Privacy Cleanup" -ForegroundColor Magenta
    Write-Host " 8. Show Startup Apps" -ForegroundColor Magenta
    Write-Host " 9. Exit" -ForegroundColor Red
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    
    $Choice = Read-Host "Enter Choice (1-9)"
    
    switch ($Choice) {
        1 { 
            Write-Host "`nStarting Quick Cleanup..." -ForegroundColor Green
            Quick-Cleanup
            Pause 
        }
        2 { 
            Write-Host "`nStarting Deep Cleanup..." -ForegroundColor Green
            $Confirm = Read-Host "This will create a restore point. Continue? (Y/N)"
            if ($Confirm -eq "Y" -or $Confirm -eq "y") {
                Deep-Cleanup
            }
            Pause 
        }
        3 { 
            Write-Host "`nStarting System Repair..." -ForegroundColor Yellow
            $Confirm = Read-Host "This may take 30+ minutes. Continue? (Y/N)"
            if ($Confirm -eq "Y" -or $Confirm -eq "y") {
                Repair-Windows
            }
            Pause 
        }
        4 { 
            Write-Host "`nStarting Drive Optimization..." -ForegroundColor Yellow
            Optimize-Drives
            Pause 
        }
        5 { 
            Check-DiskHealth
            Pause 
        }
        6 { 
            Schedule-Cleanup
            Pause 
        }
        7 { 
            Privacy-Cleanup
            Pause 
        }
        8 { 
            Show-StartupApps
            Pause 
        }
        9 { 
            Write-Host "`nExiting..." -ForegroundColor Yellow
            Exit 
        }
        default {
            Write-Host "`nInvalid Choice! Please enter 1-9" -ForegroundColor Red
            Start-Sleep -Seconds 2
        }
    }
} while ($true)
