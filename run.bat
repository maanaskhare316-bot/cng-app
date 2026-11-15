@echo off
setlocal
title CNG Navigator - Smart Station Finder

echo ========================================================
echo   CNG Navigator - Smart CNG Highway Recommender
echo   Google Maps API Integration + Real-time Telemetry
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking Node.js runtime...
node -v >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not found in PATH!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [2/3] Checking frontend build...
if not exist "frontend\dist\index.html" (
    echo Building frontend web app...
    cd frontend
    call npm.cmd run build
    cd ..
)

echo [3/3] Starting CNG Navigator Full-Stack Server on port 8080...
echo.
echo ========================================================
echo   Web App URL : http://localhost:8080
echo   REST API    : http://localhost:8080/api/stations
echo   Status      : LIVE and READY
echo ========================================================
echo.

start "" "http://localhost:8080"
node backend\server.js

pause
