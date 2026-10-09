@echo off
chcp 65001 >nul
setlocal
title sito - Claude Code travaille seul
cd /d "%~dp0.."
rem Lance Claude Code sur le depot sito, en travail autonome.
rem Il enchaine les taches de app\specs\07-TACHES.md selon CLAUDE.md.
rem Ce qu il attend de Fabrice : memoire\actions-fabrice.md
rem Ses questions : memoire\questions.md   Ou il en est : memoire\maintenant.md
where claude >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Claude Code n est pas installe sur cet ordinateur.
  echo   Ouvrir PowerShell et coller :  irm https://claude.ai/install.ps1 ^| iex
  echo   puis relancer ce fichier. Voir memoire\actions-fabrice.md, F0.
  goto :fin
)
echo   Mise a jour du depot...
git pull --ff-only
git config core.hooksPath git-hooks
if not exist node_modules ( echo   Installation, une seule fois... & call npm install )
if not exist app\node_modules ( call npm --prefix app install )
echo.
echo   Claude Code demarre. Fermer cette fenetre arrete le travail.
echo   Il s arrete seul quand il ne reste que des taches qui t attendent.
echo.
claude --permission-mode auto "/travailler"
:fin
echo.
pause
