@echo off
chcp 65001 >nul
setlocal
title sito - enregistrer et pousser sur GitHub
cd /d "%~dp0.."

echo   Controle du depot avant envoi...
node scripts\verifier-depot.mjs .
if errorlevel 1 (
  echo.
  echo   ARRET : le depot est incomplet, rien n a ete envoye.
  pause
  exit /b 1
)

git status --short
echo.
set /p "MSG=Ce qui a change, en une phrase : "
if "%MSG%"=="" set "MSG=Mise a jour du %DATE%"

git add -A
git commit -m "%MSG%"
git push -u origin main
if errorlevel 1 (echo. & echo   ECHEC de l envoi. Rien n est perdu : le commit est sur l ordinateur.) else (echo. & echo   OK, c est sur GitHub.)
pause
endlocal
