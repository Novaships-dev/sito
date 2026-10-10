@echo off
chcp 65001 >nul
setlocal
title sito - installer Claude Code
cd /d "%~dp0.."
rem Installe Claude Code avec l installateur officiel d Anthropic (code.claude.com,
rem installation Windows), pour le compte de Fabrice seulement, sans droits
rem d administrateur. Tout est ecrit dans installation-claude.log (ignore par Git).
set "LOG=%CD%\installation-claude.log"
> "%LOG%" echo === installation de Claude Code === %DATE% %TIME%
where claude >> "%LOG%" 2>&1
if not errorlevel 1 ( >> "%LOG%" echo [DEJA] Claude Code est deja installe & goto :version )
echo   Installation de Claude Code, une ou deux minutes...
powershell -NoProfile -ExecutionPolicy Bypass -Command "irm https://claude.ai/install.ps1 | iex" >> "%LOG%" 2>&1
set "PATH=%USERPROFILE%\.local\bin;%PATH%"
:version
claude --version >> "%LOG%" 2>&1
if errorlevel 1 ( >> "%LOG%" echo [ERREUR] claude ne repond pas apres l installation ) else ( >> "%LOG%" echo [OK] Claude Code installe )
>> "%LOG%" echo Suite : lanceurs\PREMIER_LANCEMENT.bat ^(se connecter, faire confiance au dossier^).
>> "%LOG%" echo === fin === %DATE% %TIME%
type "%LOG%"
echo.
pause

