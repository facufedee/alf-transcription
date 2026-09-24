@echo off
setlocal enabledelayedexpansion

set "projectPath=C:\Users\VWAROHL\Desktop\Proyectos_App\alf-transcription"
cd /d "!projectPath!"

echo.
echo ========================================
echo ALF Project Setup
echo ========================================
echo.

REM Check if ZIP exists
if not exist "alf-project.zip" (
    echo Error: alf-project.zip not found
    pause
    exit /b 1
)

echo [*] Found alf-project.zip
echo [*] Extracting files...

REM Extract ZIP (requires tar in Windows 10/11)
tar -xf alf-project.zip -C "!projectPath!"

if !errorlevel! neq 0 (
    echo Error: Could not extract ZIP. Trying PowerShell method...
    powershell -Command "Expand-Archive -Path '!projectPath!\alf-project.zip' -DestinationPath '!projectPath!' -Force"
)

echo [+] Files extracted successfully
echo.

echo [*] Initializing git repository...
git init
git config user.email "facundoflores8@gmail.com"
git config user.name "Facundo Zonagarreta"

echo [*] Adding files...
git add .

echo [*] Creating initial commit...
git commit -m "Initial commit: ALF transcription platform"

echo [*] Setting branch to main...
git branch -M main

echo [*] Adding remote origin...
git remote add origin https://github.com/facufedee/alf-transcription.git 2>nul

echo [*] Pushing to GitHub...
git push -u origin main

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Go to: https://github.com/facufedee/alf-transcription
echo 2. Update DevPost with your GitHub link
echo 3. Start coding!
echo.
pause
