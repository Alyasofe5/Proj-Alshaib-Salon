# build.ps1 - Build + Package for deployment
$root = "C:\Users\WASEEM\Desktop\NA\Projects\Proj-Alshaib-Salon"

# 1. Build Next.js
Set-Location "$root\frontend"
npx next build

# 2. Package
Set-Location $root
Remove-Item -Recurse -Force "deploy_combined\*"
Copy-Item -Recurse -Force "frontend\out\*" "deploy_combined\"
Copy-Item -Recurse -Force "backend\api" "deploy_combined\api"
Copy-Item -Recurse -Force "backend\config" "deploy_combined\config"
Copy-Item -Recurse -Force "backend\middleware" "deploy_combined\middleware"
Copy-Item -Force "backend\.htaccess" "deploy_combined\.htaccess"

# 3. Create archive
Set-Location "deploy_combined"
tar -czf "..\deploy_full.tar.gz" .
Set-Location $root

Write-Host "DONE"
