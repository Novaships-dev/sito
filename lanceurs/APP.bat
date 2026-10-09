@echo off
chcp 65001 >nul
setlocal
title sito - l app de l artisan
cd /d "%~dp0..\app"
rem Ouvre l app sur http://localhost:5173.
rem Avec app\.env.local : la vraie base. Sans : la demonstration (code 123456).
rem Tout est ecrit dans app.log, a la racine de sito (ignore par Git).
set "LOG=%~dp0..\app.log"
> "%LOG%" echo === app === %DATE% %TIME%
if not exist node_modules (
  echo   Installation, une seule fois...
  call npm install >> "%LOG%" 2>&1
  if errorlevel 1 ( echo   ARRET : l installation a echoue, voir app.log. & goto :fin )
)
if exist .env.local ( echo   Mode : vraie base Supabase. ) else ( echo   Mode : demonstration. )
echo   L app s ouvre dans le navigateur. Fermer cette fenetre pour l arreter.
call npm run dev -- --open >> "%LOG%" 2>&1
:fin
echo.
pause
