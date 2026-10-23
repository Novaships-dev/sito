@echo off
chcp 65001 >nul
setlocal
title sito - reveiller la base Supabase
cd /d "%~dp0.."
rem Action F17 de memoire\actions-fabrice.md. Un projet Supabase gratuit se met
rem en pause apres quelques jours sans usage : la base ne repond plus et les
rem essais de droits ne peuvent pas tourner. Seul le tableau de bord sait la
rem relancer, Claude n a aucun moyen de le faire.
echo.
echo   1. La page du projet sito s ouvre dans le navigateur (se connecter si besoin).
echo   2. Cliquer sur le bouton "Restore project" (ou "Resume"), puis confirmer.
echo   3. Attendre que l etat passe a "Active healthy" (quelques minutes).
echo.
start "" "https://supabase.com/dashboard/project/magxzrpboyrzguuocjgj"
echo   Quand c est fait, Entree pour verifier d ici.
pause >nul
echo.
node scripts\compte-essai.mjs --verifier
echo.
echo   Si la cle secrete manque encore : lanceurs\CLE_SUPABASE.bat (action F1).
echo.
pause
