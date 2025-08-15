@echo off
REM Script to pull the Ollama model after Brain Cells is running

echo.
echo ===============================================================
echo           Pulling Ollama Model for Brain Cells
echo ===============================================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo Checking if Ollama service is running...
docker ps --filter "name=braincells-ollama" --format "table {{.Names}}\t{{.Status}}" | findstr ollama >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Ollama container is not running.
    echo Please run 'docker compose up -d' first.
    pause
    exit /b 1
)

echo [OK] Ollama is running
echo.

REM Default model
set MODEL=gpt-oss:20b
if not "%1"=="" set MODEL=%1

echo Pulling model: %MODEL%
echo This may take several minutes depending on your internet speed...
echo.

docker exec braincells-ollama-1 ollama pull %MODEL%

if errorlevel 1 (
    echo.
    echo [ERROR] Failed to pull model.
    echo Make sure Ollama is fully started and try again.
    pause
    exit /b 1
)

echo.
echo ===============================================================
echo [SUCCESS] Model %MODEL% has been pulled successfully!
echo ===============================================================
echo.
echo You can now use Brain Cells with local AI at: http://localhost:3000
echo.
pause