@echo off
chcp 65001 >nul
setlocal
title sito - enregistrer et pousser sur GitHub
cd /d "%~dp0.."
rem Tout ce qui se passe est ecrit dans pousser.log, a la racine de sito
rem (ignore par Git). Si quelque chose bloque, Claude lit ce fichier.
set "LOG=%CD%\pousser.log"
> "%LOG%" echo === pousser === %DATE% %TIME%
>> "%LOG%" echo dossier : %CD%

echo   Controle du depot avant envoi...
node scripts\verifier-depot.mjs . >> "%LOG%" 2>&1
if errorlevel 1 (
  echo.
  echo   ARRET : le controle du depot a refuse. Rien n a ete envoye.
  >> "%LOG%" echo [ARRET] verifier-depot a refuse
  goto :fin
)
>> "%LOG%" echo [OK] depot complet

git status --short >> "%LOG%" 2>&1
echo.
set "MSG="
set /p "MSG=Ce qui a change, en une phrase (Entree pour un message automatique) : "
if "%MSG%"=="" set "MSG=Mise a jour du %DATE%"
>> "%LOG%" echo message : %MSG%

git add -A >> "%LOG%" 2>&1
git commit -m "%MSG%" >> "%LOG%" 2>&1
if errorlevel 1 (
  echo   ARRET : l enregistrement a echoue, voir pousser.log.
  >> "%LOG%" echo [ARRET] git commit a echoue
  goto :fin
)
>> "%LOG%" echo [OK] enregistre
git log --oneline -1 >> "%LOG%" 2>&1
git push -u origin main >> "%LOG%" 2>&1
if errorlevel 1 (
  echo   ECHEC de l envoi. Rien n est perdu : l enregistrement est sur l ordinateur.
  >> "%LOG%" echo [ERREUR] git push a echoue
) else (
  echo   OK, c est sur GitHub.
  >> "%LOG%" echo [OK] envoye sur GitHub
)

:fin
>> "%LOG%" echo === fin === %DATE% %TIME%
echo.
type "%LOG%"
echo.
pause
endlocal
