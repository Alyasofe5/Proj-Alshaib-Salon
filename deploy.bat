@echo off
title MAQAS.SITE - Professional Deployment
color 0B

echo.
echo    ================================================
echo     MAQAS.SITE - One-Click Deployment
echo    ================================================
echo.
echo    This will build and deploy your app to maqas.site
echo.

REM Change to script directory
cd /d "%~dp0"

REM Run the deployment script
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy.ps1" %*

echo.
if %ERRORLEVEL% EQU 0 (
    echo    ================================================
    echo     DEPLOYMENT COMPLETED SUCCESSFULLY!
    echo    ================================================
) else (
    echo    ================================================
    echo     DEPLOYMENT FAILED - Check errors above
    echo    ================================================
)
echo.
pause
