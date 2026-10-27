@echo off
chcp 65001 >nul
setlocal
title sito - ranger et verifier les images
cd /d "%~dp0.."
rem Fabrice depose en vrac dans images\couverture\ ou images\peinture\ les images
rem generees dans ChatGPT, nommees comme dans banque\prompts\<metier>.md
rem (l extension ne compte pas : .png ou .jpg). Ce fichier les range dans les
rem dossiers que le generateur lit, puis lance scripts\verifier-images.mjs.
rem Ecrit par Cowork le 28 oct. 2026.
for %%M in (couverture peinture) do call :ranger %%M
echo.
echo   Fini. Ce qui manque ou ne va pas est ecrit au-dessus, metier par metier.
echo.
pause
exit /b

:ranger
set "D=images\%1"
if not exist "%D%" exit /b
echo.
echo   ===== %1 =====
for %%S in (sources banque\matiere banque\ambiance banque\signes) do if not exist "%D%\%%S" mkdir "%D%\%%S"
for %%F in (hero hero-variante-2 avant-01 avant-02 avant-03 apres-01 apres-02 apres-03 chantier chantier-2 chantier-3 geste geste-2 geste-3 geste-4 geste-5 detail-zinc detail-peinture) do for %%X in ("%D%\%%F.*") do move /Y "%%~X" "%D%\sources\" >nul
for %%X in ("%D%\matiere-*.*") do move /Y "%%~X" "%D%\banque\matiere\" >nul
for %%X in ("%D%\ambiance-*.*") do move /Y "%%~X" "%D%\banque\ambiance\" >nul
for %%X in ("%D%\signe-*.*") do move /Y "%%~X" "%D%\banque\signes\" >nul
call node scripts\verifier-images.mjs %1
exit /b
