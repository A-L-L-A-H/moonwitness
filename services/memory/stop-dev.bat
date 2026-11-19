@echo off
setlocal
cd /d "%~dp0"

echo Stopping development servers...

REM Use PowerShell to find and kill only the dev servers started by start-dev.bat.
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$root = (Get-Location).Path;" ^
  "$targets = Get-CimInstance Win32_Process | Where-Object {" ^
  "  ($_.Name -eq 'python.exe' -and $_.CommandLine -match 'uvicorn|app\.main')" ^
  "};" ^
  "if ($targets) {" ^
  "  $targets | ForEach-Object { Write-Host ('Killing ' + $_.Name + ' PID ' + $_.ProcessId); Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" ^
  "} else { Write-Host 'No dev server processes found.' }"

timeout /t 2 /nobreak >nul
echo.
echo Development servers stopped.
echo Local data remains in data\.