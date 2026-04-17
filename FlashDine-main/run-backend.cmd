@echo off
setlocal

set "ROOT=%~dp0"
set "SERVER_DIR=%ROOT%server"

if not exist "%SERVER_DIR%\package.json" (
  echo Backend package.json not found at "%SERVER_DIR%"
  exit /b 1
)

cd /d "%SERVER_DIR%"

if not exist node_modules (
  echo Installing backend dependencies...
  call npm install
  if errorlevel 1 exit /b %errorlevel%
)

echo Starting backend in watch mode...
call npm run dev
exit /b %errorlevel%