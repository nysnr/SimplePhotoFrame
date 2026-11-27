@echo off
cd /d "%~dp0.."
node windows_sync_bundle\apply-windows-sync.js --backup
if errorlevel 1 exit /b %errorlevel%
echo.
echo Next step:
echo   npm install
