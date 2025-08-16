#!/bin/bash

echo "Starting Brain Cells Electron App..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js from https://nodejs.org"
    exit 1
fi

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "Ollama is not installed."
    read -p "Would you like to install Ollama now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Installing Ollama..."
        if command -v brew &> /dev/null; then
            brew install ollama
        else
            curl -fsSL https://ollama.ai/install.sh | sh
        fi
    else
        echo "Please install Ollama from https://ollama.ai to use AI features."
    fi
fi

# Navigate to electron-app directory
cd "$(dirname "$0")/.."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Check if the frontend is built
if [ ! -d "../aisheets/dist" ]; then
    echo "Building frontend..."
    cd ../aisheets
    npm install
    npm run build
    cd ../electron-app
fi

# Start Ollama if installed
if command -v ollama &> /dev/null; then
    echo "Starting Ollama service..."
    ollama serve &
    OLLAMA_PID=$!
    sleep 3
fi

# Start the Electron app
echo "Starting Brain Cells..."
npm start

# Clean up Ollama process on exit
if [ ! -z "$OLLAMA_PID" ]; then
    kill $OLLAMA_PID
fi