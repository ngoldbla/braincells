#!/bin/bash

# Brain Cells Turnkey Build Setup Script
# This script prepares and builds the desktop application

set -e

echo "🚀 Brain Cells Desktop Build Setup"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js version
check_node() {
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed${NC}"
        echo "Please install Node.js 18+ from https://nodejs.org"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo -e "${RED}❌ Node.js version must be 18 or higher${NC}"
        echo "Current version: $(node -v)"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Node.js $(node -v) detected${NC}"
}

# Function to install dependencies
install_deps() {
    echo -e "\n${YELLOW}📦 Installing dependencies...${NC}"
    cd "$(dirname "$0")"
    
    # Install turnkey dependencies
    echo "Installing Electron dependencies..."
    npm install
    
    # Check if aisheets exists
    if [ ! -d "../aisheets" ]; then
        echo -e "${RED}❌ aisheets directory not found${NC}"
        echo "Please ensure the aisheets application is in the parent directory"
        exit 1
    fi
    
    # Install aisheets dependencies
    echo "Installing aisheets dependencies..."
    cd ../aisheets
    npm install
    
    cd ../turnkey
    echo -e "${GREEN}✓ Dependencies installed${NC}"
}

# Function to build aisheets
build_aisheets() {
    echo -e "\n${YELLOW}🔨 Building aisheets application...${NC}"
    cd ../aisheets
    
    if npm run build; then
        echo -e "${GREEN}✓ aisheets built successfully${NC}"
    else
        echo -e "${RED}❌ Failed to build aisheets${NC}"
        exit 1
    fi
    
    cd ../turnkey
}

# Function to prepare resources
prepare_resources() {
    echo -e "\n${YELLOW}📁 Preparing resources...${NC}"
    
    # Create resources directory structure
    mkdir -p resources/{app,icons,ollama,models}
    
    # Copy built aisheets to resources
    if [ -d "../aisheets/dist" ]; then
        echo "Copying aisheets build to resources..."
        cp -r ../aisheets/dist/* resources/app/
        
        # Copy package.json for production
        node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('../aisheets/package.json', 'utf8'));
        delete pkg.devDependencies;
        delete pkg.scripts;
        fs.writeFileSync('resources/app/package.json', JSON.stringify(pkg, null, 2));
        "
        
        # Install production dependencies
        cd resources/app
        npm install --production --omit=dev
        cd ../..
        
        echo -e "${GREEN}✓ Resources prepared${NC}"
    else
        echo -e "${RED}❌ aisheets dist directory not found${NC}"
        exit 1
    fi
}

# Function to download Ollama
download_ollama() {
    echo -e "\n${YELLOW}🤖 Downloading Ollama binaries...${NC}"
    
    # Make download script executable
    chmod +x build-scripts/download-ollama.js
    
    # Download for current platform
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if [[ $(uname -m) == "arm64" ]]; then
            node build-scripts/download-ollama.js darwin-arm64
        else
            node build-scripts/download-ollama.js darwin-x64
        fi
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
        node build-scripts/download-ollama.js win32-x64
    else
        node build-scripts/download-ollama.js linux-x64
    fi
    
    echo -e "${GREEN}✓ Ollama downloaded${NC}"
}

# Function to create icons
create_icons() {
    echo -e "\n${YELLOW}🎨 Creating application icons...${NC}"
    
    # Create basic icon files if they don't exist
    if [ ! -f "resources/icons/icon.png" ]; then
        # Create a simple colored square as placeholder
        node -e "
        const fs = require('fs');
        const { createCanvas } = require('canvas');
        
        // Create 512x512 icon
        const canvas = createCanvas(512, 512);
        const ctx = canvas.getContext('2d');
        
        // Gradient background
        const gradient = ctx.createLinearGradient(0, 0, 512, 512);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);
        
        // Add text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 180px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('BC', 256, 256);
        
        // Save as PNG
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync('resources/icons/icon.png', buffer);
        console.log('Created icon.png');
        " 2>/dev/null || {
            # Fallback: create a basic placeholder if canvas not available
            echo "Creating placeholder icons..."
            echo -n "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > resources/icons/icon.png
        }
        
        # Copy as other formats (placeholder)
        cp resources/icons/icon.png resources/icons/icon.ico
        cp resources/icons/icon.png resources/icons/icon.icns
    fi
    
    echo -e "${GREEN}✓ Icons created${NC}"
}

# Function to build the application
build_app() {
    echo -e "\n${YELLOW}🏗️  Building desktop application...${NC}"
    
    # Determine platform
    if [[ "$1" == "all" ]] || [[ -z "$1" ]]; then
        echo "Building for all platforms..."
        npm run build
    elif [[ "$1" == "mac" ]]; then
        echo "Building for macOS..."
        npm run build:mac
    elif [[ "$1" == "win" ]]; then
        echo "Building for Windows..."
        npm run build:win
    elif [[ "$1" == "linux" ]]; then
        echo "Building for Linux..."
        npm run build:linux
    else
        echo -e "${RED}Unknown platform: $1${NC}"
        echo "Use: mac, win, linux, or all"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Build complete!${NC}"
}

# Main execution
main() {
    echo "Starting build process..."
    echo ""
    
    # Check prerequisites
    check_node
    
    # Install dependencies
    install_deps
    
    # Build aisheets
    build_aisheets
    
    # Prepare resources
    prepare_resources
    
    # Download Ollama
    download_ollama
    
    # Create icons
    create_icons
    
    # Build the app
    build_app "$1"
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✅ Brain Cells Desktop build successful!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "Output files are in the 'dist' directory:"
    ls -la dist/ 2>/dev/null || echo "Run 'npm run build' to create installers"
    echo ""
    echo "To test the application without packaging:"
    echo "  npm start"
    echo ""
    echo "To create installers:"
    echo "  npm run build:mac    # For macOS"
    echo "  npm run build:win    # For Windows"
    echo "  npm run build        # For all platforms"
}

# Run with platform argument (optional)
# ./setup.sh [mac|win|linux|all]
main "$1"