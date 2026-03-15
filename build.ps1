# build.ps1 - Build + Package for deployment
$root = $PSScriptRoot

# 1. Build Next.js
Set-Location "$root\frontend"
if (!(Test-Path "node_modules")) {
    npm install
}
npm run build

# 2. Package
Set-Location $root
if (Test-Path "deploy_combined") {
    Remove-Item -Recurse -Force "deploy_combined\*"
} else {
    New-Item -ItemType Directory -Path "deploy_combined"
}

Copy-Item -Recurse -Force "frontend\out\*" "deploy_combined\"
Copy-Item -Recurse -Force "backend\api" "deploy_combined\api"
Copy-Item -Recurse -Force "backend\config" "deploy_combined\config"
Copy-Item -Recurse -Force "backend\middleware" "deploy_combined\middleware"
Copy-Item -Force "backend\.htaccess" "deploy_combined\.htaccess"

# 3. Create zip (Hostinger MCP supports zip best)
Set-Location $root
# We zip the contents of deploy_combined directly
$zipPath = "$root\deploy_full.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath }
Compress-Archive -Path "$root\deploy_combined\*" -DestinationPath $zipPath

Write-Host "DONE: deploy_full.zip created"
