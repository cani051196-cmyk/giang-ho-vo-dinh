@echo off
setlocal
cd /d %~dp0
if not exist .env copy .env.example .env >nul
where node >nul 2>nul || (echo Node.js LTS is required.&pause&exit /b 1)
if not exist node_modules (
  echo Installing game dependencies...
  call npm install || (echo npm install failed.&pause&exit /b 1)
)
echo Starting GIANG HO VO DINH...
call npm run dev -- --host 0.0.0.0
pause
