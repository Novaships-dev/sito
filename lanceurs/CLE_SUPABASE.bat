@echo off
chcp 65001 >nul
setlocal
title sito - cle secrete Supabase
cd /d "%~dp0.."
rem Action F1 de memoire\actions-fabrice.md. La cle secrete ne passe que par
rem ce fichier et le .env de cet ordinateur : ni Claude, ni GitHub ne la voient.
if not exist ".env" copy ".env.example" ".env" >nul
echo.
echo   1. La page Supabase s ouvre dans le navigateur (se connecter si besoin).
echo   2. Section "Secret keys" : cliquer sur l oeil, puis copier la cle
echo      (elle commence par sb_secret_).
echo   3. Revenir ici : clic droit pour coller, puis Entree.
echo.
start "" "https://supabase.com/dashboard/project/magxzrpboyrzguuocjgj/settings/api-keys"
set "CLE="
set /p "CLE=  Cle secrete : "
cls
powershell -NoProfile -Command "$c=('' + $env:CLE).Trim(); if(-not ($c.StartsWith('sb_secret_') -or $c.StartsWith('eyJ'))){Write-Host '  Ce n est pas une cle secrete Supabase (sb_secret_...). Rien n a ete ecrit.'; exit 1}; $p=Join-Path (Get-Location) '.env'; $l=[IO.File]::ReadAllLines($p); $ok=$false; $l=$l | ForEach-Object { if($_ -like 'SUPABASE_CLE_SERVICE=*'){ $ok=$true; 'SUPABASE_CLE_SERVICE=' + $c } else { $_ } }; if(-not $ok){ $l = @($l) + ('SUPABASE_CLE_SERVICE=' + $c) }; [IO.File]::WriteAllLines($p, [string[]]$l); Write-Host '  Cle enregistree dans .env (jamais envoyee sur GitHub).'"
if errorlevel 1 ( set "CLE=" & goto :fin )
set "CLE="
echo.
echo   Creation du compte d essai dans la base (entreprise inventee, SIREN 000000000)...
node scripts\compte-essai.mjs
node scripts\compte-essai.mjs --verifier
:fin
echo.
pause

