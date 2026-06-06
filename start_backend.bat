@echo off
title SMADS - FastAPI Backend
cd /d "%~dp0backend"
call venv\Scripts\activate.bat
echo Starting FastAPI Backend on http://localhost:8000 ...
echo API Docs: http://localhost:8000/docs
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
