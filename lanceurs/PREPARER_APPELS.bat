@echo off
chcp 65001 >nul
setlocal
title sito - preparer les appels de demain
cd /d "%~dp0.."
echo.
echo   Preparation du lot de demain : extraction, recherche web des sites
echo   existants, fabrication, publication, page d appels.
echo   Cette fenetre reste ouverte pendant que Claude Code travaille.
echo.
claude -p "/preparer-appels" --permission-mode auto --permission-prompts none
echo.
echo   Termine. Voir memoire\maintenant.md pour le resultat.
pause
