@echo off
chcp 65001 >nul
setlocal
title sito - fabriquer les sites de demonstration
cd /d "%~dp0.."
set "LOG=%~dp0fabriquer-demo.log"

echo   Fabrication des 3 sites et des 5 verificateurs. Compter 5 a 10 minutes.
echo   Ne ferme pas cette fenetre.
echo.
node scripts\fabriquer-demo.mjs > "%LOG%" 2>&1
set "ERR=%ERRORLEVEL%"
type "%LOG%"
echo.
if not "%ERR%"=="0" (
  echo   ECHEC. Le detail est dans %LOG%
) else (
  echo   OK. Les sites sont dans le dossier sites, un fichier .html par entreprise.
  start "" "%CD%\sites"
)
pause
endlocal
