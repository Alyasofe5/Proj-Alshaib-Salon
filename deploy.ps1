# deploy.ps1 - FTP Auto Deploy to maqas.site
# Usage: powershell -ExecutionPolicy Bypass -File deploy.ps1

$ftpHost = "145.223.77.220"
$ftpUser = "u778871816.maqas.site"
$ftpPass = 'eDpr>n[4'
$ftpRoot = "/public_html"
$localRoot = "$PSScriptRoot\deploy_combined"

# Skip large/static files that don't change between deploys
$skipExtensions = @('.glb', '.gltf', '.mp4', '.webm', '.mov', '.avi')
$maxFileSizeMB = 5  # Skip files larger than 5MB

$successCount = 0
$errorCount = 0
$skipCount = 0

function Create-FtpDir($remotePath) {
    try {
        $uri = "ftp://${ftpHost}${remotePath}"
        $req = [System.Net.FtpWebRequest]::Create($uri)
        $req.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
        $req.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
        $req.UsePassive = $true
        $req.UseBinary = $true
        $req.KeepAlive = $false
        $req.GetResponse() | Out-Null
    } catch { }
}

function Upload-File($localFile, $remotePath) {
    # Skip large static files
    $ext = [System.IO.Path]::GetExtension($localFile).ToLower()
    $sizeMB = (Get-Item $localFile).Length / 1MB
    if ($skipExtensions -contains $ext -or $sizeMB -gt $maxFileSizeMB) {
        $script:skipCount++
        Write-Host "  [SKIP] $remotePath ($([math]::Round($sizeMB,1))MB)" -ForegroundColor DarkGray
        return
    }

    try {
        $uri = "ftp://${ftpHost}${remotePath}"
        $req = [System.Net.FtpWebRequest]::Create($uri)
        $req.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
        $req.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
        $req.UsePassive = $true
        $req.UseBinary = $true
        $req.KeepAlive = $false
        $content = [System.IO.File]::ReadAllBytes($localFile)
        $req.ContentLength = $content.Length
        $stream = $req.GetRequestStream()
        $stream.Write($content, 0, $content.Length)
        $stream.Close()
        $script:successCount++
        Write-Host "  [OK] $remotePath" -ForegroundColor Green
    } catch {
        $script:errorCount++
        Write-Host "  [ERR] $remotePath - $_" -ForegroundColor Red
    }
}

function Deploy-Folder($localPath, $remotePath) {
    Create-FtpDir $remotePath
    Get-ChildItem $localPath | ForEach-Object {
        $remoteItem = "$remotePath/$($_.Name)"
        if ($_.PSIsContainer) {
            Deploy-Folder $_.FullName $remoteItem
        } else {
            Upload-File $_.FullName $remoteItem
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   MAQAS.SITE - FTP AUTO DEPLOY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Host : $ftpHost" -ForegroundColor Gray
Write-Host " User : $ftpUser" -ForegroundColor Gray
Write-Host " From : $localRoot" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (!(Test-Path $localRoot)) {
    Write-Host "[!] deploy_combined folder not found. Run build.ps1 first!" -ForegroundColor Red
    exit 1
}

$startTime = Get-Date
Deploy-Folder $localRoot $ftpRoot
$elapsed = [math]::Round(((Get-Date) - $startTime).TotalSeconds, 1)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Done in ${elapsed}s | OK: $successCount | ERR: $errorCount | SKIP: $skipCount" -ForegroundColor $(if ($errorCount -eq 0) { "Green" } else { "Yellow" })
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
