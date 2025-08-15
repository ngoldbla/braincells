@echo off
setlocal enabledelayedexpansion

REM Brain Cells Windows Quick Start Script
REM This batch file helps you get Brain Cells up and running on Windows

echo.
echo ===============================================================
echo        Brain Cells - Intelligent Spreadsheet Automation
echo                    Windows Installation Script
echo ===============================================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed or not in PATH.
    echo.
    echo Please install Docker Desktop first:
    echo    https://www.docker.com/products/docker-desktop
    echo.
    echo After installation:
    echo    1. Restart your computer
    echo    2. Start Docker Desktop
    echo    3. Run this script again
    echo.
    pause
    exit /b 1
)

echo [OK] Docker is installed
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running.
    echo.
    echo Please:
    echo    1. Start Docker Desktop
    echo    2. Wait for it to fully start (about 30 seconds)
    echo    3. Run this script again
    echo.
    pause
    exit /b 1
)

echo [OK] Docker is running
echo.

REM Check disk space
echo Checking disk space...
for /f "tokens=3" %%a in ('dir /-c ^| findstr /c:"bytes free"') do set FREE_BYTES=%%a
set /a FREE_GB=!FREE_BYTES:~0,-9! 2>nul
if !FREE_GB! LSS 20 (
    echo.
    echo [WARNING] Less than 20GB free disk space detected.
    echo           Brain Cells requires adequate space for Docker operations.
    echo.
    set /p CONTINUE=Do you want to continue anyway? (y/n): 
    if /i not "!CONTINUE!"=="y" (
        echo Installation cancelled.
        pause
        exit /b 1
    )
)
echo.

REM Check for .env file
if not exist .env (
    echo No .env file found. Creating one...
    
    if exist .env.template (
        copy .env.template .env >nul
        echo [OK] Created .env from template
    ) else (
        type nul > .env
        echo [OK] Created empty .env file
    )
    
    echo.
    echo ===============================================================
    echo OPTIONAL: Hugging Face Token
    echo.
    echo For the best AI experience, you can add a Hugging Face token.
    echo Get your free token at: https://huggingface.co/settings/tokens
    echo.
    echo You can add it to the .env file later by editing it and adding:
    echo    HF_TOKEN=your_token_here
    echo ===============================================================
    echo.
) else (
    echo [OK] Using existing .env file
    echo.
)

REM Docker cleanup option
echo ===============================================================
echo Docker Maintenance
echo ===============================================================
echo.
echo Docker Desktop uses a virtual disk that can fill up over time.
echo Cleaning Docker can free up significant space.
echo.
set /p CLEAN=Would you like to clean Docker cache before starting? (y/n): 
if /i "!CLEAN!"=="y" (
    echo.
    echo Cleaning Docker system (this may take a minute)...
    echo    - Removing stopped containers
    echo    - Removing unused networks
    echo    - Removing dangling images
    echo    - Removing build cache
    echo.
    docker system prune -a --volumes -f
    echo.
    echo [OK] Docker cleanup complete!
)
echo.

REM Start Brain Cells
echo ===============================================================
echo Starting Brain Cells...
echo ===============================================================
echo.
echo This may take 5-10 minutes on first run to:
echo    - Build the Docker image
echo    - Download AI models
echo    - Install dependencies
echo.
echo Starting services...
echo.

docker compose up -d --build

if errorlevel 1 (
    echo.
    echo ===============================================================
    echo [ERROR] Installation failed!
    echo ===============================================================
    echo.
    echo Common issues and solutions:
    echo.
    echo 1. "No space left on device" error:
    echo    - Open Docker Desktop
    echo    - Go to Settings - Resources - Advanced
    echo    - Increase "Disk image size" to 80-100GB
    echo    - Click "Apply and Restart"
    echo    - Run this script again
    echo.
    echo 2. Port 3000 already in use:
    echo    - Stop the application using port 3000
    echo    - Or change the port in docker-compose.yml
    echo.
    echo 3. Network issues:
    echo    - Check your internet connection
    echo    - Check if you're behind a corporate proxy
    echo.
    echo For more help: https://github.com/ngoldbla/braincells/issues
    echo.
    pause
    exit /b 1
)

echo.
echo ===============================================================
echo [SUCCESS] Brain Cells is starting up!
echo ===============================================================
echo.
echo Access Brain Cells at: http://localhost:3000
echo.
echo It may take a minute for the service to be fully ready.
echo You can check the logs with: docker compose logs -f
echo.
echo Useful commands:
echo    - View logs:        docker compose logs -f
echo    - Stop Brain Cells: docker compose down
echo    - Restart:          docker compose restart
echo    - Clean up Docker:  docker system prune -a
echo.
echo Every Cell is a Brain Cell!
echo ===============================================================
echo.
pause