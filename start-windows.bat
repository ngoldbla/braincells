@echo off
REM Brain Cells Windows Starter
REM This batch file runs the PowerShell setup script

echo Starting Brain Cells setup for Windows...
echo.

REM Check if PowerShell is available
where powershell >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: PowerShell is not installed or not in PATH
    echo Please install PowerShell or use Windows PowerShell
    pause
    exit /b 1
)

REM Run the PowerShell script with appropriate execution policy
powershell -ExecutionPolicy Bypass -File start.ps1

REM Keep window open if there was an error
if %errorlevel% neq 0 (
    echo.
    echo Setup encountered an error. Please check the messages above.
    pause
)