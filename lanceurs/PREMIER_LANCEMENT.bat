@echo off
chcp 65001 >nul
setlocal
title sito - premier lancement de Claude Code
cd /d "%~dp0.."
rem Une seule fois (action F2 de memoire\actions-fabrice.md) :
rem Claude Code s ouvre dans le dossier sito. Accepter "faire confiance a ce dossier",
rem le serveur Playwright, et le mode auto s il le propose. Puis taper /exit et Entree.
rem Ensuite, chaque jour : lanceurs\CLAUDE_AUTONOME.bat.
where claude >nul 2>nul
if errorlevel 1 (
  echo   Claude Code n est pas installe : voir memoire\actions-fabrice.md, F0.
  goto :fin
)
echo.
echo   Accepter les questions de Claude Code (confiance, Playwright, mode auto),
echo   puis taper /exit et Entree.
echo.
claude --permission-mode auto
:fin
echo.
pause

