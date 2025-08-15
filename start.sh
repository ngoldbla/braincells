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

# Start the services
docker compose up -d

echo ""
echo "============================================================"
echo "✨ Brain Cells is starting up!"
echo ""
echo "📊 Access Brain Cells at: http://localhost:3000"
echo ""
echo "⏳ First run will take 5-10 minutes to download models."
echo "   You can check progress with: docker compose logs -f"
echo ""
echo "💡 Tips:"
echo "   - Stop Brain Cells: docker compose down"
echo "   - View logs: docker compose logs"
echo "   - Restart: docker compose restart"
echo ""
echo "🧠 Every Cell is a Brain Cell!"
echo "============================================================"