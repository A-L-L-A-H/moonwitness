@echo off
setlocal
cd /d "%~dp0"
echo Installing Prophet Research Engine v2.3...
npm run setup:e2e
if errorlevel 1 (
  echo.
  echo INSTALL FAILED. Check Node.js ^>=22.13 and internet access to npm registry.
  pause
  exit /b 1
)
echo.
echo INSTALL PASS. Next: double-click RUN-WINDOWS.cmd
pause
