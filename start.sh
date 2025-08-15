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

# Check available disk space
echo "📊 Checking disk space..."
AVAILABLE_SPACE=$(df -h . | awk 'NR==2 {print $4}')
echo "   Available space: $AVAILABLE_SPACE"

# Try to extract numeric value for comparison
SPACE_NUM=$(echo "$AVAILABLE_SPACE" | sed 's/[^0-9.]//g' | cut -d. -f1)
SPACE_UNIT=$(echo "$AVAILABLE_SPACE" | sed 's/[0-9.]//g')

if [[ "$SPACE_UNIT" == "G" ]] || [[ "$SPACE_UNIT" == "Gi" ]]; then
    if [[ "$SPACE_NUM" -lt 20 ]] 2>/dev/null; then
        echo ""
        echo "⚠️  WARNING: Low disk space detected!"
        echo "   Brain Cells requires at least 20GB of free space."
        echo ""
        echo "   🧹 To free up Docker space, you can run:"
        echo "      docker system prune -a --volumes"
        echo ""
        echo "   This will remove:"
        echo "   • All stopped containers"
        echo "   • All unused images"
        echo "   • All unused volumes"
        echo ""
        read -p "Would you like to clean Docker now? (y/n): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "🧹 Cleaning Docker system..."
            docker system prune -a --volumes -f
            echo "✅ Docker cleanup complete"
            echo ""
            # Re-check space
            AVAILABLE_SPACE=$(df -h . | awk 'NR==2 {print $4}')
            echo "   New available space: $AVAILABLE_SPACE"
        fi
        echo ""
        read -p "Do you want to continue with the installation? (y/n): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Installation cancelled. Please free up disk space and try again."
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
docker compose up -d --build

# Check if the build was successful
if [ $? -eq 0 ]; then
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
    echo "❌ Installation failed. Common issues:"
    echo ""
    echo "1. 💾 Not enough disk space:"
    echo "   • Run: docker system prune -a --volumes"
    echo "   • Free up at least 20GB of space"
    echo ""
    echo "2. 🔧 Docker Desktop settings:"
    echo "   • Increase disk image size in Docker Desktop preferences"
    echo "   • Restart Docker Desktop"
    echo ""
    echo "3. 📝 Check the logs:"
    echo "   • Run: docker compose logs"
    echo ""
    echo "For more help, visit: https://github.com/ngoldbla/braincells/issues"
    exit 1
fi