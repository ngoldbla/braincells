#!/bin/bash

# Quick Start Script - Simple steps to build Brain Cells Desktop

echo "🚀 Brain Cells Desktop - Quick Start"
echo "===================================="
echo ""

# Step 1: Install dependencies
echo "Step 1: Installing dependencies..."
npm install

# Step 2: Run the setup
echo ""
echo "Step 2: Running full setup..."
./setup.sh mac

echo ""
echo "✅ Done! Your application is ready."
echo ""
echo "The installer is in the 'dist' folder:"
ls -lh dist/*.dmg 2>/dev/null || echo "Build may still be in progress..."
echo ""
echo "To run in development mode: npm start"