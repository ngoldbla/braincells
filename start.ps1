# Brain Cells Quick Start Script for Windows
# This script helps you get Brain Cells up and running quickly on Windows
# Run with: powershell -ExecutionPolicy Bypass -File start.ps1

$ErrorActionPreference = "Stop"

Write-Host "🧠 Welcome to Brain Cells - Intelligent Spreadsheet Automation" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
try {
    $dockerVersion = docker --version 2>$null
    if (-not $dockerVersion) {
        throw "Docker not found"
    }
} catch {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first:" -ForegroundColor Red
    Write-Host "   https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    Write-Host "   Make sure to restart your computer after installation." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Docker is running
try {
    docker info 2>&1 | Out-Null
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
    Write-Host "   You may need to wait a minute for Docker Desktop to fully start." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Docker is installed and running" -ForegroundColor Green
Write-Host ""

# Check Docker disk usage and system space
Write-Host "📊 Checking disk space..." -ForegroundColor Yellow

# Check Docker's disk usage
$dockerDf = docker system df 2>$null
if ($dockerDf) {
    $dockerImages = $dockerDf | Select-String "Images" | Out-String
    if ($dockerImages) {
        Write-Host "   Docker disk usage:" -ForegroundColor Cyan
        Write-Host "   $dockerImages" -ForegroundColor Gray
    }
}

# Check available system disk space
$drive = Get-PSDrive -Name (Get-Location).Drive.Name
$availableGB = [math]::Round($drive.Free / 1GB, 2)
Write-Host "   System available space: ${availableGB}GB" -ForegroundColor Cyan

# Docker Desktop specific guidance
Write-Host ""
Write-Host "💡 Docker Desktop detected" -ForegroundColor Yellow
Write-Host ""
Write-Host "📝 Note: Docker Desktop has its own disk limit (separate from your system disk)." -ForegroundColor Cyan
Write-Host "   If you encounter 'no space left on device' errors during build:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   1. Open Docker Desktop" -ForegroundColor White
Write-Host "   2. Go to Settings → Resources → Advanced" -ForegroundColor White
Write-Host "   3. Increase 'Disk image size' to 80-100GB" -ForegroundColor White
Write-Host "   4. Click 'Apply `& Restart'" -ForegroundColor White
Write-Host ""

# Offer to clean Docker cache
Write-Host "🧹 First, let's try to free up any existing Docker space:" -ForegroundColor Yellow
$cleanDocker = Read-Host "Would you like to clean Docker cache before starting? (y/n)"

if ($cleanDocker -eq 'y' -or $cleanDocker -eq 'Y') {
    Write-Host "🧹 Cleaning Docker system (this may take a minute)..." -ForegroundColor Yellow
    
    Write-Host "   Removing:" -ForegroundColor Cyan
    Write-Host "   • All stopped containers" -ForegroundColor Gray
    Write-Host "   • All unused networks" -ForegroundColor Gray
    Write-Host "   • All dangling images" -ForegroundColor Gray
    Write-Host "   • All build cache" -ForegroundColor Gray
    
    docker system prune -a --volumes -f
    
    Write-Host ""
    Write-Host "✅ Docker cleanup complete!" -ForegroundColor Green
}

# Check for low disk space
if ($availableGB -lt 20) {
    Write-Host ""
    Write-Host "⚠️  WARNING: Low system disk space detected!" -ForegroundColor Yellow
    Write-Host "   Your system has less than 20GB free." -ForegroundColor Yellow
    Write-Host "   Brain Cells requires adequate space for Docker operations." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Recommended: Free up system space or increase Docker Desktop's disk allocation." -ForegroundColor Cyan
    Write-Host ""
    $continue = Read-Host "Do you want to continue anyway? (y/n)"
    if ($continue -ne 'y' -and $continue -ne 'Y') {
        Write-Host "Please free up disk space and try again." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "📝 No .env file found. Let's set up your configuration..." -ForegroundColor Yellow
    Write-Host ""
    
    # Copy template if it exists
    if (Test-Path ".env.template") {
        Copy-Item ".env.template" ".env"
        Write-Host "✅ Created .env file from template" -ForegroundColor Green
    } else {
        New-Item -ItemType File -Name ".env" -Force | Out-Null
        Write-Host "✅ Created empty .env file" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "🔑 RECOMMENDED: Add your Hugging Face token for the best experience" -ForegroundColor Cyan
    Write-Host "   1. Get your free token at: https://huggingface.co/settings/tokens" -ForegroundColor White
    Write-Host "   2. Edit the .env file and add your token" -ForegroundColor White
    Write-Host ""
    $addToken = Read-Host "Would you like to add your Hugging Face token now? (y/n)"
    
    if ($addToken -eq 'y' -or $addToken -eq 'Y') {
        $hfToken = Read-Host "Enter your Hugging Face token (or press Enter to skip)"
        if ($hfToken) {
            # Remove any existing HF_TOKEN lines and add the new one
            $envContent = Get-Content ".env" | Where-Object { $_ -notmatch "^HF_TOKEN=" }
            $envContent += "HF_TOKEN=$hfToken"
            $envContent | Set-Content ".env"
            Write-Host "✅ Hugging Face token added to .env" -ForegroundColor Green
        }
    }
} else {
    Write-Host "✅ Using existing .env file" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Starting Brain Cells..." -ForegroundColor Cyan
Write-Host ""
Write-Host "⏳ This may take 5-10 minutes on first run to:" -ForegroundColor Yellow
Write-Host "   • Build the Docker image" -ForegroundColor Gray
Write-Host "   • Download AI models" -ForegroundColor Gray
Write-Host "   • Install dependencies" -ForegroundColor Gray
Write-Host ""

# Start the services with build output
$logFile = "$env:TEMP\brain-cells-install.log"
try {
    # Run docker compose and capture output
    $process = Start-Process -FilePath "docker" -ArgumentList "compose", "up", "-d", "--build" -PassThru -NoNewWindow -RedirectStandardOutput $logFile -RedirectStandardError "$logFile.err" -Wait
    
    # Check if successful
    if ($process.ExitCode -eq 0) {
        Write-Host ""
        Write-Host "============================================================" -ForegroundColor Cyan
        Write-Host "✨ Brain Cells is starting up!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Access Brain Cells at: http://localhost:3000" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
        Write-Host "   You can check progress with: docker compose logs -f" -ForegroundColor Gray
        Write-Host ""
        Write-Host "💡 Useful commands:" -ForegroundColor Yellow
        Write-Host "   • View logs:        docker compose logs -f" -ForegroundColor Gray
        Write-Host "   • Stop Brain Cells: docker compose down" -ForegroundColor Gray
        Write-Host "   • Restart:          docker compose restart" -ForegroundColor Gray
        Write-Host "   • Clean up Docker:  docker system prune -a" -ForegroundColor Gray
        Write-Host ""
        Write-Host "🧠 Every Cell is a Brain Cell!" -ForegroundColor Cyan
        Write-Host "============================================================" -ForegroundColor Cyan
    } else {
        throw "Docker compose failed with exit code $($process.ExitCode)"
    }
} catch {
    Write-Host ""
    Write-Host "❌ Installation failed!" -ForegroundColor Red
    Write-Host ""
    
    # Check if it was a space issue
    $errorContent = ""
    if (Test-Path "$logFile.err") {
        $errorContent = Get-Content "$logFile.err" -Raw
    }
    if (Test-Path $logFile) {
        $errorContent += Get-Content $logFile -Raw
    }
    
    if ($errorContent -match "no space left on device") {
        Write-Host "🚨 The build failed due to lack of disk space." -ForegroundColor Red
        Write-Host ""
        Write-Host "This is usually a Docker Desktop disk limit issue, NOT your system disk." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "✅ TO FIX THIS:" -ForegroundColor Green
        Write-Host ""
        Write-Host "1. Open Docker Desktop" -ForegroundColor White
        Write-Host "2. Go to Settings → Resources → Advanced" -ForegroundColor White
        Write-Host "3. Increase 'Disk image size' from 60GB to 100GB (or more)" -ForegroundColor White
        Write-Host "4. Click 'Apply `& Restart'" -ForegroundColor White
        Write-Host "5. Run .\start.ps1 again" -ForegroundColor White
        Write-Host ""
        Write-Host "📝 Why this happens:" -ForegroundColor Cyan
        Write-Host "   Docker Desktop uses a virtual disk with a default 60GB limit." -ForegroundColor Gray
        Write-Host "   Brain Cells needs ~20GB for images and build artifacts." -ForegroundColor Gray
        Write-Host "   Other Docker projects on your system share this same limit." -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Host "📝 Check the error above for details." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Common issues:" -ForegroundColor Yellow
        Write-Host "1. Not enough Docker disk space (see instructions above)" -ForegroundColor Gray
        Write-Host "2. Network issues downloading dependencies" -ForegroundColor Gray
        Write-Host "3. Port 3000 already in use" -ForegroundColor Gray
        Write-Host ""
        
        if ($errorContent) {
            Write-Host "Error details:" -ForegroundColor Red
            Write-Host $errorContent.Substring(0, [Math]::Min(500, $errorContent.Length)) -ForegroundColor Gray
        }
    }
    
    Write-Host "For detailed logs, check: $logFile" -ForegroundColor Yellow
    Write-Host "For more help, visit: https://github.com/ngoldbla/braincells/issues" -ForegroundColor Cyan
    Read-Host "Press Enter to exit"
    exit 1
}

Read-Host "Press Enter to exit"