@echo off
setlocal
title CNG Navigator - Dev Mode

echo ========================================================
echo   CNG Navigator - Development Mode (Vite + API)
echo ========================================================
echo.

cd /d "%~dp0"

echo Starting Backend API on port 8080...
start "CNG Backend API" cmd /k "node backend\server.js"

echo Starting Frontend Dev Server on port 5173...
cd frontend
start "" "http://localhost:5173"
call npm.cmd run dev
