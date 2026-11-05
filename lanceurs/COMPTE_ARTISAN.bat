@echo off
chcp 65001 >nul
setlocal
title sito - compte d un artisan
cd /d "%~dp0.."
rem Decision de Fabrice du 5 nov. 2026 : il donne a chaque artisan un
rem identifiant (son e-mail) et un mot de passe. Ce lanceur cree le compte
rem (ou pose un nouveau mot de passe) et affiche le mot de passe UNE fois,
rem dans cette fenetre seulement : rien n est ecrit sur le disque ni dans
rem GitHub. Il faut la cle secrete Supabase dans .env (lanceurs\CLE_SUPABASE.bat).
echo.
node atelier\comptes.mjs
echo.
echo   Notez le mot de passe avant de fermer cette fenetre.
echo.
pause
