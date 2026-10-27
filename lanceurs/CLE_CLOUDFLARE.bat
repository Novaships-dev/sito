@echo off
chcp 65001 >nul
setlocal
title sito - jeton Cloudflare
cd /d "%~dp0.."
rem Action F5 de memoire\actions-fabrice.md. Le jeton ne passe que par ce fichier
rem et le .env de cet ordinateur : ni Claude, ni GitHub ne le voient.
rem Jeton de compte (Manage account > Account API tokens) ou jeton personnel :
rem les deux sont verifies (27 oct. 2026 : Cloudflare propose d abord le jeton de compte).
if not exist ".env" copy ".env.example" ".env" >nul
echo.
echo   1. Colle ici l Account ID de Cloudflare (Workers et Pages, a droite : Account ID).
echo.
set "CFID="
set /p "CFID=  Account ID : "
echo.
echo   2. La page des jetons s ouvre. Cree le jeton comme indique, copie-le,
echo      puis clic droit ici pour coller, et Entree.
echo.
start "" "https://dash.cloudflare.com/profile/api-tokens"
set "CFJETON="
set /p "CFJETON=  Jeton : "
cls
powershell -NoProfile -Command "$id=('' + $env:CFID).Trim(); $t=('' + $env:CFJETON).Trim(); if($id -notmatch '^[0-9a-f]{32}$'){Write-Host '  Account ID invalide (32 caracteres 0-9 a-f). Rien n a ete ecrit.'; exit 1}; if($t.Length -lt 30){Write-Host '  Jeton trop court : la copie n a pas pris. Rien n a ete ecrit.'; exit 1}; try { $ok=$false; foreach($u in @(('https://api.cloudflare.com/client/v4/accounts/' + $id + '/tokens/verify'), 'https://api.cloudflare.com/client/v4/user/tokens/verify')){ try { $r = Invoke-RestMethod -Uri $u -Headers @{Authorization=('Bearer ' + $t)}; if($r.result.status -eq 'active'){ $ok=$true; break } } catch { } }; if(-not $ok){ throw 'inactif' } } catch { Write-Host '  Cloudflare refuse ce jeton (pas actif). Rien n a ete ecrit.'; exit 1 }; $p=Join-Path (Get-Location) '.env'; $l=@([IO.File]::ReadAllLines($p)); $set={ param($k,$v) $found=$false; $script:l = $script:l | ForEach-Object { if($_ -like ($k + '=*')){ $found=$true; $k + '=' + $v } else { $_ } }; if(-not $found){ $script:l = @($script:l) + ($k + '=' + $v) } }; & $set 'CLOUDFLARE_COMPTE_ID' $id; & $set 'CLOUDFLARE_JETON_API' $t; [IO.File]::WriteAllLines($p, [string[]]$l); Write-Host '  Cloudflare verifie et enregistre dans .env (jamais envoye sur GitHub).'"
if errorlevel 1 ( set "CFJETON=" & goto :fin )
set "CFJETON="
:fin
echo.
pause
