@echo off
title Smriti Dementia Care Platform (SIH26003)
echo ===================================================
echo   Smriti (smriti) - Dementia Care Web Application
echo   MDoNER / SIH Problem Statement 26003
echo ===================================================
echo.

cd /d "%~dp0backend"

set PYTHON_EXE=python
where python >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\Users\HP\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" (
        set PYTHON_EXE="C:\Users\HP\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
    )
)

echo Starting Smriti full-stack server on http://localhost:8000 ...
echo - Serving backend API routes (/api)
echo - Serving built React frontend (/)
echo - Demo Patient credentials: Code: DEMO01 | PIN: 1234
echo - Caregiver Portal: caregiver@smriti.in | Smriti@2026
echo.
%PYTHON_EXE% run.py
pause
