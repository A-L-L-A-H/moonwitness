@echo off
setlocal
cd /d "%~dp0"
npm run verify
if errorlevel 1 (
  echo VERIFY FAILED.
  pause
  exit /b 1
)
echo VERIFY PASS.
pause
