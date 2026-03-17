#Requires -Version 5.1
<#
.SYNOPSIS
    Professional one-click deployment for maqas.site
.DESCRIPTION
    Builds, validates, packages, and deploys the salon application to Hostinger.
    Features: secure config, build validation, deployment logging, smart file skipping.
.PARAMETER SkipBuild
    Skip the frontend build step (use existing build output)
.PARAMETER DryRun
    Run all steps except the actual upload (for testing)
.PARAMETER ArchiveOnly
    Build and create archive only, skip FTP upload (for MCP deployment)
.PARAMETER Force
    Skip confirmation prompts
.EXAMPLE
    .\deploy.ps1                    # Full deploy
    .\deploy.ps1 -SkipBuild        # Deploy without rebuilding
    .\deploy.ps1 -DryRun           # Test run, no upload
    .\deploy.ps1 -ArchiveOnly      # Build archive for MCP deploy
#>

param(
    [switch]$SkipBuild,
    [switch]$DryRun,
    [switch]$ArchiveOnly,
    [switch]$Force
)

# ======================================================================
# CONFIGURATION
# ======================================================================

$ErrorActionPreference = "Stop"
$script:ROOT = $PSScriptRoot
$script:TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$script:DEPLOY_DIR = Join-Path $env:TEMP "maqas_deploy_$($script:TIMESTAMP)"
$script:ARCHIVE_PATH = Join-Path $env:TEMP "maqas_deploy_$($script:TIMESTAMP).tar.gz"
$script:LOG_DIR = Join-Path $script:ROOT "deploy-logs"
$script:FRONTEND_DIR = Join-Path $script:ROOT "frontend"
$script:BACKEND_DIR = Join-Path $script:ROOT "backend"
$script:CONFIG_FILE = Join-Path $script:ROOT "deploy.config.json"

# Deployment Statistics
$script:Stats = [ordered]@{
    StartTime      = ""
    EndTime        = ""
    BuildDuration  = ""
    DeployDuration = ""
    TotalDuration  = ""
    FilesUploaded  = 0
    FilesSkipped   = 0
    FilesFailed    = 0
    TotalSizeMB    = 0
    GitCommit      = ""
    GitBranch      = ""
    DeployMode     = ""
    Status         = "STARTED"
}

# ======================================================================
# DISPLAY FUNCTIONS
# ======================================================================

function Show-Banner {
    Write-Host ""
    Write-Host "  ===========================================================" -ForegroundColor Cyan
    Write-Host "  ||                                                         ||" -ForegroundColor Cyan
    Write-Host "  ||    M   A   Q   A   S   .   S   I   T   E               ||" -ForegroundColor Cyan
    Write-Host "  ||                                                         ||" -ForegroundColor Cyan
    Write-Host "  ||    >>> PROFESSIONAL DEPLOYMENT SYSTEM <<<               ||" -ForegroundColor Cyan
    Write-Host "  ||                                                         ||" -ForegroundColor Cyan
    Write-Host "  ===========================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Show-Step {
    param([string]$Number, [string]$Title, [string]$Icon)
    Write-Host ""
    Write-Host "  +----------------------------------------------------------" -ForegroundColor DarkCyan
    Write-Host "  |  $Icon  STEP $Number : $Title" -ForegroundColor Cyan
    Write-Host "  +----------------------------------------------------------" -ForegroundColor DarkCyan
}

function Show-SubStep {
    param([string]$Message, [string]$Status, [string]$Color = "Gray")
    Write-Host "     [+] $Message " -NoNewline -ForegroundColor $Color
    Write-Host "[$Status]" -ForegroundColor DarkGray
}

function Show-Success {
    param([string]$Message)
    Write-Host "     [OK] $Message" -ForegroundColor Green
}

function Show-Warning {
    param([string]$Message)
    Write-Host "     [!!] $Message" -ForegroundColor Yellow
}

function Show-Error {
    param([string]$Message)
    Write-Host "     [XX] $Message" -ForegroundColor Red
}

function Show-Info {
    param([string]$Message)
    Write-Host "     [i] $Message" -ForegroundColor DarkCyan
}

function Show-Progress {
    param([int]$Current, [int]$Total, [string]$Name)
    $pct = [math]::Round(($Current / [math]::Max($Total,1)) * 100)
    $filled = [math]::Round($pct / 5)
    $empty = 20 - $filled
    $bar = ("#" * $filled) + ("-" * $empty)
    Write-Host ("`r     [$bar] $pct% ($Current/$Total) $Name                    ") -NoNewline -ForegroundColor DarkCyan
}

# ======================================================================
# STEP 1: PRE-FLIGHT CHECKS
# ======================================================================

function Test-Prerequisites {
    Show-Step "1" "PRE-FLIGHT CHECKS" ">>>"
    $allPassed = $true

    # Check Node.js
    try {
        $nodeVer = (node --version 2>&1).ToString().Trim()
        Show-SubStep "Node.js" $nodeVer "Green"
    } catch {
        Show-Error "Node.js is not installed!"
        $allPassed = $false
    }

    # Check npm
    try {
        $npmVer = (npm --version 2>&1).ToString().Trim()
        Show-SubStep "npm" "v$npmVer" "Green"
    } catch {
        Show-Error "npm is not installed!"
        $allPassed = $false
    }

    # Check config file
    if (Test-Path $script:CONFIG_FILE) {
        Show-SubStep "Config file" "Found" "Green"
    } else {
        Show-Error "Config file not found: deploy.config.json"
        Show-Info "Copy deploy.config.example.json to deploy.config.json and fill in your credentials"
        $allPassed = $false
    }

    # Check frontend directory
    if (Test-Path $script:FRONTEND_DIR) {
        Show-SubStep "Frontend directory" "Found" "Green"
    } else {
        Show-Error "Frontend directory not found!"
        $allPassed = $false
    }

    # Check backend directory
    if (Test-Path $script:BACKEND_DIR) {
        Show-SubStep "Backend directory" "Found" "Green"
    } else {
        Show-Error "Backend directory not found!"
        $allPassed = $false
    }

    # Check Git status
    try {
        $gitBranch = (git -C $script:ROOT rev-parse --abbrev-ref HEAD 2>&1).ToString().Trim()
        $gitCommit = (git -C $script:ROOT rev-parse --short HEAD 2>&1).ToString().Trim()
        $gitDirty = (git -C $script:ROOT status --porcelain 2>&1)

        $script:Stats.GitBranch = $gitBranch
        $script:Stats.GitCommit = $gitCommit

        Show-SubStep "Git branch" $gitBranch "Green"
        Show-SubStep "Git commit" $gitCommit "Green"

        if ($gitDirty) {
            $changedCount = ($gitDirty | Measure-Object -Line).Lines
            Show-Warning "There are $changedCount uncommitted changes"
            if (-not $Force) {
                Show-Info "Consider committing your changes before deploying"
                Show-Info "Use -Force to skip this warning"
            }
        } else {
            Show-SubStep "Working tree" "Clean" "Green"
        }
    } catch {
        Show-Warning "Git not available - skipping version tracking"
        $script:Stats.GitBranch = "unknown"
        $script:Stats.GitCommit = "unknown"
    }

    if (-not $allPassed) {
        throw "Pre-flight checks failed. Fix the issues above and try again."
    }

    Show-Success "All pre-flight checks passed!"
}

# ======================================================================
# STEP 2: LOAD CONFIGURATION
# ======================================================================

function Read-Config {
    Show-Step "2" "LOADING CONFIGURATION" ">>>"

    $config = Get-Content $script:CONFIG_FILE -Raw | ConvertFrom-Json

    # Validate required fields
    if ([string]::IsNullOrEmpty($config.ftp.host) -or $config.ftp.host -match "^YOUR_") {
        throw "Missing FTP host in deploy.config.json"
    }
    if ([string]::IsNullOrEmpty($config.ftp.user) -or $config.ftp.user -match "^YOUR_") {
        throw "Missing FTP user in deploy.config.json"
    }
    if ([string]::IsNullOrEmpty($config.ftp.pass) -or $config.ftp.pass -match "^YOUR_") {
        throw "Missing FTP password in deploy.config.json"
    }

    Show-SubStep "Project" $config.project.name "Green"
    Show-SubStep "Domain" $config.project.domain "Green"
    Show-SubStep "FTP Host" $config.ftp.host "Green"
    Show-SubStep "FTP User" $config.ftp.user "Green"
    Show-SubStep "FTP Root" $config.ftp.root "Green"
    Show-SubStep "Password" "******** (hidden)" "Green"

    Show-Success "Configuration loaded!"
    return $config
}

# ======================================================================
# STEP 3: BUILD FRONTEND
# ======================================================================

function Build-Frontend {
    Show-Step "3" "BUILDING FRONTEND" ">>>"

    $buildStart = Get-Date

    # Install dependencies if needed
    $nodeModules = Join-Path $script:FRONTEND_DIR "node_modules"
    if (-not (Test-Path $nodeModules)) {
        Show-Info "Installing dependencies (first time setup)..."
        Push-Location $script:FRONTEND_DIR
        try {
            $installOut = & npm install 2>&1
            if ($LASTEXITCODE -ne 0) {
                throw "npm install failed: $installOut"
            }
            Show-SubStep "Dependencies" "Installed" "Green"
        } finally {
            Pop-Location
        }
    } else {
        Show-SubStep "Dependencies" "Already installed" "Green"
    }

    # Clean previous build
    $outDir = Join-Path $script:FRONTEND_DIR "out"
    if (Test-Path $outDir) {
        Remove-Item -Recurse -Force $outDir
        Show-SubStep "Previous build" "Cleaned" "Green"
    }

    # Run build
    Show-Info "Running Next.js build (this may take a minute)..."
    Push-Location $script:FRONTEND_DIR
    try {
        $buildOut = & npm run build 2>&1
        $buildCode = $LASTEXITCODE
    } finally {
        Pop-Location
    }

    if ($buildCode -ne 0) {
        $errLogName = "build_error_$($script:TIMESTAMP).log"
        $errorLogPath = Join-Path $script:ROOT $errLogName
        $buildOut | Out-File $errorLogPath -Encoding UTF8
        Show-Error "Build FAILED! Error log saved to: $errLogName"
        Show-Error "Fix the build errors and try again."
        throw "Frontend build failed with exit code $buildCode"
    }

    $buildSec = [math]::Round(((Get-Date) - $buildStart).TotalSeconds, 1)
    $script:Stats.BuildDuration = "${buildSec}s"

    Show-Success "Frontend built successfully in ${buildSec}s!"
}

# ======================================================================
# STEP 4: VALIDATE BUILD OUTPUT
# ======================================================================

function Test-BuildOutput {
    Show-Step "4" "VALIDATING BUILD OUTPUT" ">>>"

    $outDir = Join-Path $script:FRONTEND_DIR "out"

    # Check output directory exists
    if (-not (Test-Path $outDir)) {
        Show-Error "Build output directory not found: $outDir"
        throw "Build output missing. Run without -SkipBuild flag."
    }
    Show-SubStep "Output directory" "Exists" "Green"

    # Check for index.html
    $indexFile = Join-Path $outDir "index.html"
    if (-not (Test-Path $indexFile)) {
        Show-Error "index.html not found in build output!"
        throw "Invalid build output - missing index.html"
    }
    Show-SubStep "index.html" "Found" "Green"

    # Check for _next directory
    $nextDir = Join-Path $outDir "_next"
    if (-not (Test-Path $nextDir)) {
        Show-Warning "_next directory not found - static assets may be missing"
    } else {
        Show-SubStep "_next assets" "Found" "Green"
    }

    # Count files and calculate size
    $allFiles = Get-ChildItem $outDir -Recurse -File
    $fileCount = $allFiles.Count
    $totalBytes = ($allFiles | Measure-Object -Property Length -Sum).Sum
    $totalSizeMB = [math]::Round($totalBytes / 1MB, 1)

    if ($fileCount -lt 5) {
        Show-Warning "Build output has only $fileCount files - this seems low"
    }

    Show-SubStep "Total files" "$fileCount" "Green"
    Show-SubStep "Total size" "${totalSizeMB}MB" "Green"

    # Count HTML pages
    $htmlCount = ($allFiles | Where-Object { $_.Extension -eq ".html" }).Count
    Show-SubStep "HTML pages" "$htmlCount" "Green"

    Show-Success "Build validation passed!"
}

# ======================================================================
# STEP 5: CREATE DEPLOY PACKAGE
# ======================================================================

function New-DeployPackage {
    param([object]$Config)

    Show-Step "5" "CREATING DEPLOY PACKAGE" ">>>"

    $packageStart = Get-Date

    # Clean and create deploy directory
    if (Test-Path $script:DEPLOY_DIR) {
        Remove-Item -Recurse -Force $script:DEPLOY_DIR
    }
    New-Item -ItemType Directory -Path $script:DEPLOY_DIR -Force | Out-Null
    Show-SubStep "Deploy directory" "Created" "Green"

    # Copy frontend build output
    $outDir = Join-Path $script:FRONTEND_DIR "out"
    Copy-Item -Recurse -Force (Join-Path $outDir "*") ($script:DEPLOY_DIR + "\")
    $frontendCount = (Get-ChildItem $script:DEPLOY_DIR -Recurse -File).Count
    Show-SubStep "Frontend files" "$frontendCount files copied" "Green"

    # Copy backend directories
    $backendDirs = @("api", "config", "middleware")
    foreach ($dir in $backendDirs) {
        $srcPath = Join-Path $script:BACKEND_DIR $dir
        if (Test-Path $srcPath) {
            $dstPath = Join-Path $script:DEPLOY_DIR $dir
            Copy-Item -Recurse -Force $srcPath $dstPath
            $dirCount = (Get-ChildItem $dstPath -Recurse -File).Count
            Show-SubStep "Backend/$dir" "$dirCount files copied" "Green"
        }
    }

    # Copy .htaccess
    $htaccess = Join-Path $script:BACKEND_DIR ".htaccess"
    if (Test-Path $htaccess) {
        Copy-Item -Force $htaccess (Join-Path $script:DEPLOY_DIR ".htaccess")
        Show-SubStep ".htaccess" "Copied" "Green"
    }

    # Remove any sensitive files that might have been copied
    $sensitivePatterns = @("*.env", "*.env.*", "*.log", "*.sql", "deploy.config*")
    foreach ($pattern in $sensitivePatterns) {
        $found = Get-ChildItem $script:DEPLOY_DIR -Recurse -Filter $pattern -ErrorAction SilentlyContinue
        foreach ($f in $found) {
            Remove-Item $f.FullName -Force
            Show-Warning "Removed sensitive file from package: $($f.Name)"
        }
    }

    # Calculate final package stats
    $allFiles = Get-ChildItem $script:DEPLOY_DIR -Recurse -File
    $totalFiles = $allFiles.Count
    $totalBytes = ($allFiles | Measure-Object -Property Length -Sum).Sum
    $totalSizeMB = [math]::Round($totalBytes / 1MB, 1)
    $script:Stats.TotalSizeMB = $totalSizeMB

    Show-SubStep "Package total" "$totalFiles files, ${totalSizeMB}MB" "Green"

    # Create archive
    Show-Info "Creating compressed archive..."
    Push-Location $script:DEPLOY_DIR
    try {
        & tar -czf $script:ARCHIVE_PATH .
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to create archive"
        }
    } finally {
        Pop-Location
    }

    $archiveSizeMB = [math]::Round((Get-Item $script:ARCHIVE_PATH).Length / 1MB, 1)
    $compRatio = 0
    if ($totalSizeMB -gt 0) {
        $compRatio = [math]::Round((1 - ($archiveSizeMB / $totalSizeMB)) * 100)
    }

    Show-SubStep "Archive" "${archiveSizeMB}MB ($compRatio% compression)" "Green"
    Show-SubStep "Archive path" $script:ARCHIVE_PATH "Cyan"

    $packageSec = [math]::Round(((Get-Date) - $packageStart).TotalSeconds, 1)
    Show-Success "Package created in ${packageSec}s!"
}

# ======================================================================
# STEP 6: DEPLOY TO SERVER (FTP)
# ======================================================================

function Deploy-ViaFTP {
    param([object]$Config)

    Show-Step "6" "DEPLOYING TO SERVER" ">>>"

    $deployStart = Get-Date
    $ftpHost = $Config.ftp.host
    $ftpUser = $Config.ftp.user
    $ftpPass = $Config.ftp.pass
    $ftpRoot = $Config.ftp.root
    $ftpTimeout = 30000
    if ($Config.ftp.timeout) {
        $ftpTimeout = $Config.ftp.timeout * 1000
    }

    # Build skip lists
    $skipExts = @()
    if ($Config.deploy.skipExtensions) {
        $skipExts = @($Config.deploy.skipExtensions)
    }
    $skipDirs = @()
    if ($Config.deploy.skipDirectories) {
        $skipDirs = @($Config.deploy.skipDirectories)
    }
    $maxSizeMB = 10
    if ($Config.deploy.maxFileSizeMB) {
        $maxSizeMB = $Config.deploy.maxFileSizeMB
    }

    Show-Info "Connecting to $ftpHost..."
    Show-Info "Uploading to $ftpRoot"
    Write-Host ""

    # Track created directories to avoid duplicate requests
    $createdDirs = @{}

    # Get all files to upload
    $allFiles = Get-ChildItem $script:DEPLOY_DIR -Recurse -File
    $totalFiles = $allFiles.Count
    $currentFile = 0

    foreach ($file in $allFiles) {
        $currentFile++
        $relPath = $file.FullName.Substring($script:DEPLOY_DIR.Length).Replace("\", "/")
        $remotePath = "$ftpRoot$relPath"

        # Check if file is in a skipped directory
        $skipThis = $false
        foreach ($sd in $skipDirs) {
            if ($relPath -like "/$sd/*") {
                $skipThis = $true
                break
            }
        }

        # Check file extension and size
        $ext = [System.IO.Path]::GetExtension($file.Name).ToLower()
        $sizeMB = $file.Length / 1MB

        if ($skipThis -or ($skipExts -contains $ext) -or ($sizeMB -gt $maxSizeMB)) {
            $script:Stats.FilesSkipped++
            Show-Progress $currentFile $totalFiles "SKIP: $($file.Name)"
            continue
        }

        # Create directory structure
        $remoteDir = $remotePath.Substring(0, $remotePath.LastIndexOf("/"))
        if (-not $createdDirs.ContainsKey($remoteDir)) {
            # Create all parent directories
            $parts = $remoteDir.Split("/")
            $built = ""
            foreach ($p in $parts) {
                if ([string]::IsNullOrEmpty($p)) { continue }
                $built = "$built/$p"
                if (-not $createdDirs.ContainsKey($built)) {
                    try {
                        $dirUri = "ftp://${ftpHost}${built}/"
                        $dirReq = [System.Net.FtpWebRequest]::Create($dirUri)
                        $dirReq.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
                        $dirReq.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
                        $dirReq.UsePassive = $true
                        $dirReq.KeepAlive = $false
                        $resp = $dirReq.GetResponse()
                        $resp.Close()
                    } catch { }
                    $createdDirs[$built] = $true
                }
            }
        }

        # Upload file
        try {
            $fileUri = "ftp://${ftpHost}${remotePath}"
            $req = [System.Net.FtpWebRequest]::Create($fileUri)
            $req.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
            $req.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
            $req.UsePassive = $true
            $req.UseBinary = $true
            $req.KeepAlive = $false
            $req.Timeout = $ftpTimeout

            $content = [System.IO.File]::ReadAllBytes($file.FullName)
            $req.ContentLength = $content.Length
            $stream = $req.GetRequestStream()
            $stream.Write($content, 0, $content.Length)
            $stream.Close()
            $resp = $req.GetResponse()
            $resp.Close()

            $script:Stats.FilesUploaded++
            Show-Progress $currentFile $totalFiles $file.Name
        } catch {
            $script:Stats.FilesFailed++
            Write-Host ""
            Show-Error "Failed: $relPath - $($_.Exception.Message)"
        }
    }

    Write-Host ""  # New line after progress bar

    $deploySec = [math]::Round(((Get-Date) - $deployStart).TotalSeconds, 1)
    $script:Stats.DeployDuration = "${deploySec}s"

    if ($script:Stats.FilesFailed -gt 0) {
        Show-Warning "Deploy completed with $($script:Stats.FilesFailed) errors in ${deploySec}s"
    } else {
        Show-Success "All files deployed successfully in ${deploySec}s!"
    }
}

# ======================================================================
# STEP 7: DEPLOYMENT LOG
# ======================================================================

function Write-DeployLog {
    Show-Step "7" "SAVING DEPLOYMENT LOG" ">>>"

    if (-not (Test-Path $script:LOG_DIR)) {
        New-Item -ItemType Directory -Path $script:LOG_DIR -Force | Out-Null
    }

    $script:Stats.EndTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

    $logLines = @(
        "==========================================================="
        "  DEPLOYMENT LOG - $($script:Stats.EndTime)"
        "==========================================================="
        "  Status       : $($script:Stats.Status)"
        "  Mode         : $($script:Stats.DeployMode)"
        "  Git Branch   : $($script:Stats.GitBranch)"
        "  Git Commit   : $($script:Stats.GitCommit)"
        "  Build Time   : $($script:Stats.BuildDuration)"
        "  Deploy Time  : $($script:Stats.DeployDuration)"
        "  Total Time   : $($script:Stats.TotalDuration)"
        "  Files Sent   : $($script:Stats.FilesUploaded)"
        "  Files Skipped: $($script:Stats.FilesSkipped)"
        "  Files Failed : $($script:Stats.FilesFailed)"
        "  Package Size : $($script:Stats.TotalSizeMB)MB"
        "  Deployed By  : $env:USERNAME @ $env:COMPUTERNAME"
        "==========================================================="
        ""
    )
    $logText = $logLines -join "`r`n"

    # Save individual log
    $logFileName = "deploy_$($script:TIMESTAMP).log"
    $logFile = Join-Path $script:LOG_DIR $logFileName
    $logText | Out-File $logFile -Encoding UTF8

    # Append to history
    $historyFile = Join-Path $script:LOG_DIR "history.log"
    $logText | Out-File $historyFile -Append -Encoding UTF8

    Show-SubStep "Log saved" $logFileName "Green"
    Show-Success "Deployment log saved!"
}

# ======================================================================
# STEP 8: CLEANUP
# ======================================================================

function Remove-TempFiles {
    Show-Step "8" "CLEANUP" ">>>"

    if (Test-Path $script:DEPLOY_DIR) {
        Remove-Item -Recurse -Force $script:DEPLOY_DIR -ErrorAction SilentlyContinue
        Show-SubStep "Temp directory" "Removed" "Green"
    }

    if (-not $ArchiveOnly -and (Test-Path $script:ARCHIVE_PATH)) {
        Remove-Item -Force $script:ARCHIVE_PATH -ErrorAction SilentlyContinue
        Show-SubStep "Archive file" "Removed" "Green"
    } elseif ($ArchiveOnly) {
        Show-SubStep "Archive kept at" $script:ARCHIVE_PATH "Cyan"
    }

    Show-Success "Cleanup complete!"
}

# ======================================================================
# FINAL SUMMARY
# ======================================================================

function Show-Summary {
    $isOk = ($script:Stats.FilesFailed -eq 0)
    $statusText = if ($isOk) { "SUCCESS" } else { "PARTIAL" }
    $clr = if ($isOk) { "Green" } else { "Yellow" }

    $mode = $script:Stats.DeployMode
    $gitInfo = "$($script:Stats.GitBranch)@$($script:Stats.GitCommit)"
    $buildT = $script:Stats.BuildDuration
    $deployT = $script:Stats.DeployDuration
    $totalT = $script:Stats.TotalDuration
    $uploaded = $script:Stats.FilesUploaded
    $skipped = $script:Stats.FilesSkipped
    $failed = $script:Stats.FilesFailed
    $sizeMB = "$($script:Stats.TotalSizeMB)MB"
    $user = $env:USERNAME

    Write-Host ""
    Write-Host "  ===========================================================" -ForegroundColor $clr
    Write-Host "  ||              DEPLOYMENT SUMMARY                         ||" -ForegroundColor $clr
    Write-Host "  ===========================================================" -ForegroundColor $clr
    Write-Host "  ||  Status      : $statusText" -ForegroundColor $clr
    Write-Host "  ||  Mode        : $mode" -ForegroundColor White
    Write-Host "  ||  Git         : $gitInfo" -ForegroundColor White
    Write-Host "  ||  Build       : $buildT" -ForegroundColor White
    Write-Host "  ||  Deploy      : $deployT" -ForegroundColor White
    Write-Host "  ||  Total       : $totalT" -ForegroundColor White
    Write-Host "  ||  Files       : Uploaded=$uploaded  Skipped=$skipped  Failed=$failed" -ForegroundColor White
    Write-Host "  ||  Size        : $sizeMB" -ForegroundColor White
    Write-Host "  ||  Deployed by : $user" -ForegroundColor White
    Write-Host "  ===========================================================" -ForegroundColor $clr
    Write-Host "  ||  https://maqas.site" -ForegroundColor Cyan
    Write-Host "  ===========================================================" -ForegroundColor $clr
    Write-Host ""
}

# ======================================================================
# MAIN EXECUTION
# ======================================================================

$mainStart = Get-Date

try {
    $script:Stats.StartTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

    # Determine deploy mode
    if ($DryRun) {
        $script:Stats.DeployMode = "DRY RUN (no upload)"
    } elseif ($ArchiveOnly) {
        $script:Stats.DeployMode = "ARCHIVE ONLY (for MCP)"
    } elseif ($SkipBuild) {
        $script:Stats.DeployMode = "FTP DEPLOY (skip build)"
    } else {
        $script:Stats.DeployMode = "FULL FTP DEPLOY"
    }

    # Show banner
    Show-Banner
    Show-Info "Mode: $($script:Stats.DeployMode)"
    Show-Info "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

    # Confirmation
    if (-not $Force -and -not $DryRun) {
        Write-Host ""
        Write-Host "     Ready to deploy to " -NoNewline -ForegroundColor White
        Write-Host "maqas.site" -NoNewline -ForegroundColor Cyan
        Write-Host " ?" -ForegroundColor White
        Write-Host "     Press ENTER to continue or CTRL+C to cancel" -ForegroundColor Gray
        Read-Host | Out-Null
    }

    # Step 1: Pre-flight checks
    Test-Prerequisites

    # Step 2: Load configuration
    $config = Read-Config

    # Step 3: Build frontend
    if ($SkipBuild) {
        Show-Step "3" "BUILDING FRONTEND (SKIPPED)" ">>>"
        Show-Info "Using existing build output"
        $script:Stats.BuildDuration = "skipped"
    } else {
        Build-Frontend
    }

    # Step 4: Validate build output
    Test-BuildOutput

    # Step 5: Create deploy package
    New-DeployPackage -Config $config

    # Step 6: Deploy
    if ($DryRun) {
        Show-Step "6" "DEPLOYING TO SERVER (DRY RUN)" ">>>"
        Show-Info "Dry run mode - skipping upload"
        $script:Stats.DeployDuration = "skipped (dry run)"
    } elseif ($ArchiveOnly) {
        Show-Step "6" "ARCHIVE CREATED" ">>>"
        Show-Info "Archive ready at: $($script:ARCHIVE_PATH)"
        Show-Info "Use the Hostinger MCP tool or /deploy workflow to upload"
        $script:Stats.DeployDuration = "skipped (archive only)"
    } else {
        Deploy-ViaFTP -Config $config
    }

    # Calculate total time
    $totalSec = [math]::Round(((Get-Date) - $mainStart).TotalSeconds, 1)
    $script:Stats.TotalDuration = "${totalSec}s"
    $script:Stats.Status = if ($script:Stats.FilesFailed -eq 0) { "SUCCESS" } else { "PARTIAL" }

    # Step 7: Save log
    Write-DeployLog

    # Step 8: Cleanup
    Remove-TempFiles

    # Show summary
    Show-Summary

    # Exit with appropriate code
    if ($script:Stats.FilesFailed -gt 0) {
        exit 1
    }

} catch {
    Write-Host ""
    Write-Host "  ===========================================================" -ForegroundColor Red
    Write-Host "  ||              DEPLOYMENT FAILED                           ||" -ForegroundColor Red
    Write-Host "  ===========================================================" -ForegroundColor Red
    $errMsg = $_.Exception.Message
    if ($errMsg.Length -gt 70) { $errMsg = $errMsg.Substring(0, 70) + "..." }
    Write-Host "  ||  Error: $errMsg" -ForegroundColor Red
    Write-Host "  ===========================================================" -ForegroundColor Red
    Write-Host ""

    $script:Stats.Status = "FAILED"
    $totalSec = [math]::Round(((Get-Date) - $mainStart).TotalSeconds, 1)
    $script:Stats.TotalDuration = "${totalSec}s"

    # Still save the log even on failure
    try { Write-DeployLog } catch { }
    try { Remove-TempFiles } catch { }

    exit 1
}
