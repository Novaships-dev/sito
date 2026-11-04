@echo off
chcp 65001 >nul
setlocal
title sito - secrets GitHub
cd /d "%~dp0.."
rem Action F21 de memoire\actions-fabrice.md (tache T45). Pose dans les secrets
rem du depot GitHub les cles du .env dont le workflow refaire-site a besoin.
rem Aucune valeur n est affichee ; Claude ne voit rien.
echo.
echo   Pose des secrets du depot GitHub (Supabase et Cloudflare)...
echo.
node scripts\secrets-github.mjs
echo.
pause
