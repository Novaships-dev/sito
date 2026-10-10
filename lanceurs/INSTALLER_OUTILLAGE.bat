@echo off
chcp 65001 >nul
setlocal
title sito - installer l outillage de Claude Code
cd /d "%~dp0.."
rem Copie _installation\ vers .claude\, .github\ et .mcp.json (chemins que les outils
rem de Claude ne peuvent pas ecrire a distance), puis supprime _installation\.
rem Tout est ecrit dans installation.log, a la racine de sito.
set "LOG=%CD%\installation.log"
> "%LOG%" echo === installation === %DATE% %TIME%
if not exist "_installation" ( >> "%LOG%" echo [RIEN] pas de dossier _installation & goto :fin )
if exist "_installation\claude" xcopy "_installation\claude" ".claude" /E /I /Y /Q >> "%LOG%" 2>&1
if exist "_installation\github" xcopy "_installation\github" ".github" /E /I /Y /Q >> "%LOG%" 2>&1
if exist "_installation\mcp.json" copy /Y "_installation\mcp.json" ".mcp.json" >> "%LOG%" 2>&1
rem Fichiers de configuration locaux (jamais dans Git) : copies seulement s ils
rem n existent pas encore, pour ne jamais ecraser une cle deja saisie.
if exist "_installation\env" if exist ".env" >> "%LOG%" echo [GARDE] .env existait deja : pas touche
if exist "_installation\env" if not exist ".env" ( copy "_installation\env" ".env" >nul & >> "%LOG%" echo [OK] .env cree, sans cle secrete )
if exist "_installation\app-env.local" if not exist "app\.env.local" ( copy "_installation\app-env.local" "app\.env.local" >nul & >> "%LOG%" echo [OK] app\.env.local cree, cle publique )
>> "%LOG%" echo --- fichiers en place ---
dir /S /B /A-D ".claude" ".github" ".mcp.json" >> "%LOG%" 2>&1
rmdir /S /Q "_installation"
if exist "_installation" ( >> "%LOG%" echo [ERREUR] _installation non supprime ) else ( >> "%LOG%" echo [OK] installe, _installation supprime )
:fin
>> "%LOG%" echo === fin === %DATE% %TIME%
type "%LOG%"
echo.
pause
