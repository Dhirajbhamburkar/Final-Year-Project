@echo off
title SMADS - Launcher
color 0A

echo ================================================
echo   SMADS - AI-Powered Addiction Detection System
echo ================================================
echo.

:: Step 1: Ensure MongoDB data directory exists
if not exist "C:\data\db" (
    echo [1/3] Creating MongoDB data directory...
    mkdir "C:\data\db"
) else (
    echo [1/3] MongoDB data directory OK.
)
echo.

:: Step 2: Start MongoDB in its own window
echo [2/3] Starting MongoDB on port 27017...
start "SMADS MongoDB" "%~dp0start_mongo.bat"
echo      MongoDB window opened. Waiting 3 seconds for it to start...
timeout /t 3 /nobreak >nul
echo.

:: Step 3: Start FastAPI Backend
echo [3/3] Starting FastAPI Backend on port 8000...
start "SMADS Backend" "%~dp0start_backend.bat"
echo      Backend starting at http://localhost:8000
echo      API Docs at http://localhost:8000/docs
echo.

:: Step 4: Start React Frontend (wait a bit for backend)
echo [4/3] Starting React Frontend on port 5173...
start "SMADS Frontend" "%~dp0start_frontend.bat"
echo      Frontend starting at http://localhost:5173
echo.

echo ================================================
echo   SMADS is starting up!
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:8000
echo   API Docs:  http://localhost:8000/docs
echo   Demo Login: demo@smads.com / Demo@1234
echo ================================================
echo.
echo Three windows have opened for MongoDB, Backend, and Frontend.
echo Wait ~10 seconds for all services to fully start.
echo.
pause
