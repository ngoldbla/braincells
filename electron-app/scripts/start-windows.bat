@echo off
echo Starting Brain Cells Electron App...
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed. Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

REM Check if Ollama is installed
where ollama >nul 2>&1
if %errorlevel% neq 0 (
    echo Ollama is not installed.
    set /p install="Would you like to install Ollama now? (Y/N): "
    if /i "%install%"=="Y" (
        echo Installing Ollama...
        powershell -Command "Invoke-WebRequest -Uri https://ollama.ai/download/OllamaSetup.exe -OutFile OllamaSetup.exe"
        start /wait OllamaSetup.exe
        del OllamaSetup.exe
    ) else (
        echo Please install Ollama from https://ollama.ai to use AI features.
    )
)

REM Navigate to electron-app directory
cd /d "%~dp0.."

REM Install dependencies if needed
if not exist node_modules (
    echo Installing dependencies...
    call npm install
)

REM Check if the frontend is built
if not exist ..\aisheets\dist (
    echo Building frontend...
    cd ..\aisheets
    call npm install
    call npm run build
    cd ..\electron-app
)

REM Start Ollama if installed
where ollama >nul 2>&1
if %errorlevel% equ 0 (
    echo Starting Ollama service...
    start /b ollama serve
    timeout /t 3 /nobreak >nul
)

REM Start the Electron app
echo Starting Brain Cells...
npm start

pause