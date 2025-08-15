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
echo Checking Docker installation...
docker --version >nul 2>&1
if !errorlevel! neq 0 (
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

for /f "tokens=*" %%i in ('docker --version 2^>^&1') do set DOCKER_VERSION=%%i
echo [OK] Docker is installed: !DOCKER_VERSION!
echo.

REM Check if Docker daemon is running
echo Checking if Docker Desktop is running...
docker info >nul 2>&1
if !errorlevel! neq 0 (
    echo.
    echo ===============================================================
    echo [ERROR] Docker Desktop is not running!
    echo ===============================================================
    echo.
    echo Please start Docker Desktop:
    echo.
    echo    1. Open Docker Desktop from your Start Menu or Desktop
    echo    2. Wait for the whale icon in the system tray to stop animating
    echo    3. The Docker Desktop window should show "Docker Desktop is running"
    echo    4. This usually takes 30-60 seconds
    echo    5. Once Docker is running, run this script again
    echo.
    echo If Docker Desktop won't start:
    echo    - Make sure virtualization is enabled in your BIOS
    echo    - On Windows Home: Ensure WSL 2 is installed
    echo    - On Windows Pro/Enterprise: Ensure Hyper-V is enabled
    echo    - Try restarting your computer
    echo.
    pause
    exit /b 1
)

echo [OK] Docker Desktop is running
echo.

REM Test Docker with a simple command
echo Testing Docker functionality...
docker run --rm hello-world >nul 2>&1
if !errorlevel! neq 0 (
    echo.
    echo [WARNING] Docker test failed. Docker may not be fully initialized.
    echo           Waiting 10 seconds for Docker to fully start...
    timeout /t 10 /nobreak >nul
    
    REM Try again
    docker run --rm hello-world >nul 2>&1
    if !errorlevel! neq 0 (
        echo.
        echo [ERROR] Docker is not working properly.
        echo.
        echo Please try:
        echo    1. Restart Docker Desktop
        echo    2. Check Docker Desktop settings
        echo    3. Restart your computer
        echo.
        pause
        exit /b 1
    )
)

echo [OK] Docker is working properly
echo.

REM Skip disk space check - causes issues on some systems
echo [INFO] Disk space requirements: ~20GB for Docker images
echo.

REM Check for .env file
if not exist .env (
    echo No .env file found. Let's set up your configuration...
    
    if exist .env.template (
        copy .env.template .env >nul
        echo [OK] Created .env from template
    ) else (
        type nul > .env
        echo [OK] Created empty .env file
    )
    
    echo.
    echo ===============================================================
    echo RECOMMENDED: Add your Hugging Face Token
    echo ===============================================================
    echo.
    echo Hugging Face provides access to thousands of AI models.
    echo Adding a token enables the best AI experience.
    echo.
    echo To get your free token:
    echo    1. Visit: https://huggingface.co/settings/tokens
    echo    2. Sign up or log in (it's free!)
    echo    3. Click "New token" - Name it "Brain Cells" - Create
    echo.
    
    REM Prompt for Hugging Face token
    set "HF_TOKEN="
    set /p "HF_TOKEN=Enter your Hugging Face token (or press Enter to skip): "
    
    REM Check if user entered a token
    if defined HF_TOKEN (
        if not "!HF_TOKEN!"=="" (
            echo HF_TOKEN=!HF_TOKEN!>> .env
            echo.
            echo [OK] Hugging Face token added to .env
        ) else (
            echo.
            echo [INFO] Skipping Hugging Face token (you can add it later)
        )
    ) else (
        echo.
        echo [INFO] Skipping Hugging Face token (you can add it later)
    )
    echo.
) else (
    echo [OK] Using existing .env file
    
    REM Check if HF_TOKEN already exists in .env
    findstr /C:"HF_TOKEN=" .env >nul 2>&1
    if !errorlevel! neq 0 (
        echo.
        echo ===============================================================
        echo OPTIONAL: Add Hugging Face Token
        echo ===============================================================
        echo.
        echo No Hugging Face token found in .env file.
        echo To add one later, edit .env and add: HF_TOKEN=your_token_here
        echo Get your free token at: https://huggingface.co/settings/tokens
        echo.
    )
)

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
echo TIP: To free up Docker disk space later, run:
echo      docker system prune -a
echo.
echo Starting services with docker compose...
echo.
if exist docker-compose.yml (
    docker compose up -d --build
    )

REM Check if docker-compose.yml exists
if not exist docker-compose.yml (
    echo [ERROR] docker-compose.yml not found!
    echo.
    echo Make sure you are running this script from the braincells directory.
    echo Current directory: %CD%
    echo.
    echo Expected files:
    echo    - docker-compose.yml
    echo    - start-windows.bat
    echo    - .env (or .env.template)
    echo.
    pause
    exit /b 1
)


if !errorlevel! neq 0 (
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
    echo 4. Permission issues:
    echo    - Make sure Docker Desktop is running with proper permissions
    echo    - Try running this script as Administrator
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
echo NOTE: It may take 1-2 minutes for the service to be fully ready.
echo       If the page doesn't load immediately, wait a moment and refresh.
echo.
echo IMPORTANT: For local AI (Ollama), you need to pull a model:
echo    Run: docker exec braincells-ollama-1 ollama pull gpt-oss:20b
echo    Or use the included script: pull-model.bat
echo.
echo Useful commands:
echo    - View logs:        docker compose logs -f
echo    - Stop Brain Cells: docker compose down
echo    - Restart:          docker compose restart
echo    - Pull Ollama model: pull-model.bat
echo    - Clean up Docker:  docker system prune -a
echo.
echo Every Cell is a Brain Cell!
echo ===============================================================
echo.
pause