@echo off
setlocal
cd /d %~dp0
if not exist .env copy .env.example .env >nul
where node >nul 2>nul || (echo Node.js LTS is required.&pause&exit /b 1)
if not exist node_modules (
  echo Installing game dependencies...
  call npm install || (echo npm install failed.&pause&exit /b 1)
)
for /f "tokens=2 delims=:" %%A in ('ipconfig ^| findstr /R /C:"IPv4 Address" /C:"IPv4"') do set LANIP=%%A
set LANIP=%LANIP: =%
echo.
echo Starting GIANG HO VO DINH for LAN/phone...
echo On this PC: http://127.0.0.1:5173
if defined LANIP echo On phone (same Wi-Fi): http://%LANIP%:5173
echo.
call npm run dev -- --host 0.0.0.0
pause
