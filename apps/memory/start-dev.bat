@echo off
setlocal
cd /d "%~dp0"

echo [1/5] Checking Python...
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

echo [2/5] Preparing local data directory...
if not exist data mkdir data
if not exist data\inbox mkdir data\inbox
if not exist data\db mkdir data\db
if not exist data\vectors mkdir data\vectors
if not exist data\exports mkdir data\exports
if not exist data\exports\ndjson mkdir data\exports\ndjson

echo [3/5] Installing Python dependencies...
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

echo [4/5] Installing Node dependencies...
cd frontend
if not exist node_modules (
  npm install
  if errorlevel 1 (
    echo [ERROR] npm install failed.
    cd ..
    pause
    exit /b 1
  )
)
cd ..

echo [5/5] Starting backend and frontend...

REM Ensure .env exists for backend settings.
if not exist .env (
  copy /Y .env.example .env >nul
  echo Created .env from .env.example
)

REM Set quoted values so cmd.exe does not include trailing spaces in environment variables.
set "DATA_DIR=%CD%\data"
set "S3_ENDPOINT_URL="
set "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000"

REM Keep the root as the working directory so backend/app/config.py reads the root .env.
REM --app-dir makes backend/app importable while DATA_DIR points to the local data folder.
start "MoonWitness Backend" /D "%CD%" cmd /c "venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload"

REM Give backend a moment to boot.
timeout /t 3 /nobreak >nul

REM Start frontend in background.
start "MoonWitness Frontend" /D "%CD%\frontend" cmd /c "npm run dev"

echo.
echo Development servers are starting.
echo Backend API:  http://localhost:8000/docs
echo Frontend:    http://localhost:3000
echo.
echo Keep this window open. Use stop-dev.bat to shut down both servers.