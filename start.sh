#!/bin/bash

# Brain Cells Quick Start Script
# This script helps you get Brain Cells up and running quickly

set -e

echo "🧠 Welcome to Brain Cells - Intelligent Spreadsheet Automation"
echo "============================================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop first:"
    echo "   https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

echo "✅ Docker is installed and running"
echo ""

# Check Docker disk usage and system space
echo "📊 Checking disk space..."

# Check Docker's disk usage
DOCKER_USAGE=$(docker system df 2>/dev/null | grep "Images" | awk '{print $2}' | sed 's/GB//')
DOCKER_RECLAIMABLE=$(docker system df 2>/dev/null | grep "Images" | awk '{print $4}')
if [ ! -z "$DOCKER_USAGE" ]; then
    echo "   Docker images using: ${DOCKER_USAGE}GB (${DOCKER_RECLAIMABLE} reclaimable)"
fi

# Check available system disk space
AVAILABLE_SPACE=$(df -h . | awk 'NR==2 {print $4}')
echo "   System available space: $AVAILABLE_SPACE"

# For Docker Desktop, provide specific guidance
if [[ "$OSTYPE" == "darwin"* ]] || [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    # Check if Docker Desktop is installed
    if docker info 2>/dev/null | grep -q "Operating System"; then
        echo ""
        echo "💡 Docker Desktop detected"
        
        # Check if there's very little reclaimable space but still getting errors
        DOCKER_TOTAL=$(docker system df 2>/dev/null | tail -1 | awk '{print $4}')
        
        echo ""
        echo "📝 Note: Docker Desktop has its own disk limit (separate from your system disk)."
        echo "   If you encounter 'no space left on device' errors during build:"
        echo ""
        echo "   1. Open Docker Desktop"
        echo "   2. Go to Settings → Resources → Advanced"
        echo "   3. Increase 'Disk image size' to 80-100GB"
        echo "   4. Click 'Apply & Restart'"
        echo ""
        echo "🧹 First, let's try to free up any existing Docker space:"
        read -p "Would you like to clean Docker cache before starting? (y/n): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "🧹 Cleaning Docker system (this may take a minute)..."
            
            # Show what will be deleted
            echo "   Removing:"
            echo "   • All stopped containers"
            echo "   • All unused networks"
            echo "   • All dangling images"
            echo "   • All build cache"
            
            # Perform cleanup
            docker system prune -a --volumes -f
            
            # Show results
            DOCKER_USAGE_AFTER=$(docker system df 2>/dev/null | grep "Images" | awk '{print $2}' | sed 's/GB//')
            echo ""
            echo "✅ Docker cleanup complete!"
            echo "   Docker images now using: ${DOCKER_USAGE_AFTER}GB"
        fi
    fi
fi

# Try to extract numeric value for system disk check
SPACE_NUM=$(echo "$AVAILABLE_SPACE" | sed 's/[^0-9.]//g' | cut -d. -f1)
SPACE_UNIT=$(echo "$AVAILABLE_SPACE" | sed 's/[0-9.]//g')

if [[ "$SPACE_UNIT" == "G" ]] || [[ "$SPACE_UNIT" == "Gi" ]]; then
    if [[ "$SPACE_NUM" -lt 20 ]] 2>/dev/null; then
        echo ""
        echo "⚠️  WARNING: Low system disk space detected!"
        echo "   Your system has less than 20GB free."
        echo "   Brain Cells requires adequate space for Docker operations."
        echo ""
        echo "   Recommended: Free up system space or increase Docker Desktop's disk allocation."
        echo ""
        read -p "Do you want to continue anyway? (y/n): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Please free up disk space and try again."
            exit 1
        fi
    fi
fi

echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 No .env file found. Let's set up your configuration..."
    echo ""
    
    # Copy template if it exists
    if [ -f .env.template ]; then
        cp .env.template .env
        echo "✅ Created .env file from template"
    else
        touch .env
        echo "✅ Created empty .env file"
    fi
    
    echo ""
    echo "🔑 RECOMMENDED: Add your Hugging Face token for the best experience"
    echo "   1. Get your free token at: https://huggingface.co/settings/tokens"
    echo "   2. Edit the .env file and add your token"
    echo ""
    read -p "Would you like to add your Hugging Face token now? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your Hugging Face token (or press Enter to skip): " HF_TOKEN
        if [ ! -z "$HF_TOKEN" ]; then
            # Remove any existing HF_TOKEN lines and add the new one
            grep -v "^HF_TOKEN=" .env > .env.tmp || true
            mv .env.tmp .env
            echo "HF_TOKEN=$HF_TOKEN" >> .env
            echo "✅ Hugging Face token added to .env"
        fi
    fi
else
    echo "✅ Using existing .env file"
fi

echo ""
echo "🚀 Starting Brain Cells..."
echo ""
echo "⏳ This may take 5-10 minutes on first run to:"
echo "   • Build the Docker image"
echo "   • Download AI models"
echo "   • Install dependencies"
echo ""

# Start the services with build output
if docker compose up -d --build 2>&1 | tee /tmp/brain-cells-install.log; then
    echo ""
    echo "============================================================"
    echo "✨ Brain Cells is starting up!"
    echo ""
    echo "📊 Access Brain Cells at: http://localhost:3000"
    echo ""
    echo "⏳ Waiting for services to be ready..."
    echo "   You can check progress with: docker compose logs -f"
    echo ""
    echo "💡 Useful commands:"
    echo "   • View logs:        docker compose logs -f"
    echo "   • Stop Brain Cells: docker compose down"
    echo "   • Restart:          docker compose restart"
    echo "   • Clean up Docker:  docker system prune -a"
    echo ""
    echo "🧠 Every Cell is a Brain Cell!"
    echo "============================================================"
else
    echo ""
    echo "❌ Installation failed!"
    echo ""
    
    # Check if it was a space issue
    if grep -q "no space left on device" /tmp/brain-cells-install.log; then
        echo "🚨 The build failed due to lack of disk space."
        echo ""
        echo "This is usually a Docker Desktop disk limit issue, NOT your system disk."
        echo ""
        echo "✅ TO FIX THIS:"
        echo ""
        echo "1. Open Docker Desktop"
        echo "2. Go to Settings → Resources → Advanced"
        echo "3. Increase 'Disk image size' from 60GB to 100GB (or more)"
        echo "4. Click 'Apply & Restart'"
        echo "5. Run ./start.sh again"
        echo ""
        echo "📝 Why this happens:"
        echo "   Docker Desktop uses a virtual disk with a default 60GB limit."
        echo "   Brain Cells needs ~20GB for images and build artifacts."
        echo "   Other Docker projects on your system share this same limit."
        echo ""
    else
        echo "📝 Check the error above for details."
        echo ""
        echo "Common issues:"
        echo "1. Not enough Docker disk space (see instructions above)"
        echo "2. Network issues downloading dependencies"
        echo "3. Port 3000 already in use"
        echo ""
    fi
    
    echo "For detailed logs, check: /tmp/brain-cells-install.log"
    echo "For more help, visit: https://github.com/ngoldbla/braincells/issues"
    exit 1
fi