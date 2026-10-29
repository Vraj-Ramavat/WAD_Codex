@echo off
cd /d "%~dp0"
if not exist "backend\src\server.ts" (echo Please run: npm run setup & pause & exit /b 1)
start "CodeGalaxy API" cmd /k "cd backend && npm run dev"
start "CodeGalaxy NOVA Frontend" cmd /k "cd frontend && npm run dev"
echo Launch http://localhost:3000 in your browser.
pause
