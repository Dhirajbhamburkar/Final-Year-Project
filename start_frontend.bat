@echo off
title SMADS - React Frontend
cd /d "%~dp0frontend"
echo Starting React Frontend on http://localhost:5173 ...
call npx vite
