@echo off
setlocal
cd /d "%~dp0"

echo [1/4] Checking Python...
where python >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Python is not installed. Install Python 3.11+ and ensure it is on PATH.
  pause
  exit /b 1
)

python --version
if errorlevel 1 (
  echo [ERROR] Could not read Python version.
  pause
  exit /b 1
)

echo [2/4] Preparing local data directory...
if not exist data mkdir data
if not exist data\inbox mkdir data\inbox
if not exist data\db mkdir data\db
if not exist data\vectors mkdir data\vectors
if not exist data\exports mkdir data\exports
if not exist data\exports\ndjson mkdir data\exports\ndjson

echo [3/4] Installing Python dependencies...
if not exist venv (
  python -m venv venv
  if errorlevel 1 (
    echo [ERROR] Failed to create virtual environment.
    pause
    exit /b 1
  )
)

call venv\Scripts\activate.bat
python -m pip install --upgrade pip >nul
pip install -r backend\requirements.txt
if errorlevel 1 (
  echo [ERROR] Python dependency installation failed.
  pause
  exit /b 1
)

echo [4/4] Starting backend API...

if not exist .env (
  copy /Y .env.example .env >nul
  echo Created .env from .env.example
)

set "DATA_DIR=%CD%\data"
set "S3_ENDPOINT_URL="

start "MoonWitness Backend" /D "%CD%" cmd /c "venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload"

echo.
echo Development server is starting.
echo Backend API:  http://localhost:8000/docs
echo Web UI:       http://localhost:3000/memory (via pnpm --filter @moonwitness/web dev)
echo.
echo Keep this window open. Use stop-dev.bat to shut down the backend server.
