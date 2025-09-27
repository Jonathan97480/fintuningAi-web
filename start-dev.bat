@echo off
echo Starting Fine-tuning AI Web Application...
echo.

echo Starting Backend Server...
start "Backend" cmd /k "cd /d %~dp0backend && npm run dev"

timeout /t 3 /nobreak > nul

echo Starting Frontend Server...
start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers are starting in separate windows.
echo Backend: http://localhost:4000
echo Frontend: http://localhost:3000
echo.
echo Press any key to close this window...
pause > nul