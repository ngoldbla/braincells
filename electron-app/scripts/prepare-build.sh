#!/bin/bash

echo "Preparing Brain Cells Electron build..."

# Navigate to electron-app directory
cd "$(dirname "$0")/.."

# Ensure aisheets is built
echo "Building frontend..."
cd ../aisheets

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing aisheets dependencies..."
    npm install --legacy-peer-deps
fi

# Build the frontend
npm run build

# Go back to electron-app
cd ../electron-app

# Install electron dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing Electron dependencies..."
    npm install
fi

echo "Build preparation complete!"
echo ""
echo "You can now run:"
echo "  npm run build:mac   # For macOS"
echo "  npm run build:win   # For Windows"