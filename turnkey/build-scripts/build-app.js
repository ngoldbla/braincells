#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const AISHEETS_DIR = path.join(__dirname, '..', '..', 'aisheets');
const TURNKEY_DIR = path.join(__dirname, '..');
const RESOURCES_DIR = path.join(TURNKEY_DIR, 'resources');

function log(message) {
  console.log(`[BUILD] ${message}`);
}

function error(message) {
  console.error(`[ERROR] ${message}`);
}

async function buildApp() {
  try {
    log('Starting Brain Cells Desktop build process...');
    
    // Step 1: Build the aisheets application
    log('Building aisheets application...');
    process.chdir(AISHEETS_DIR);
    
    // Install dependencies if needed
    if (!fs.existsSync(path.join(AISHEETS_DIR, 'node_modules'))) {
      log('Installing aisheets dependencies...');
      execSync('npm install', { stdio: 'inherit' });
    }
    
    // Build the application
    log('Running aisheets build...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // Step 2: Copy built files to resources
    log('Copying built application to resources...');
    const distDir = path.join(AISHEETS_DIR, 'dist');
    const targetDir = path.join(RESOURCES_DIR, 'app');
    
    // Create target directory
    fs.mkdirSync(targetDir, { recursive: true });
    
    // Copy dist files
    copyDirectory(distDir, targetDir);
    
    // Copy package.json and node_modules (production only)
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(AISHEETS_DIR, 'package.json'), 'utf8')
    );
    
    // Remove devDependencies for production
    delete packageJson.devDependencies;
    delete packageJson.scripts;
    
    fs.writeFileSync(
      path.join(targetDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    
    // Install production dependencies in target
    log('Installing production dependencies...');
    process.chdir(targetDir);
    execSync('npm install --production', { stdio: 'inherit' });
    
    // Step 3: Download Ollama binaries
    log('Downloading Ollama binaries...');
    process.chdir(TURNKEY_DIR);
    execSync('node build-scripts/download-ollama.js', { stdio: 'inherit' });
    
    // Step 4: Create icons if they don't exist
    log('Preparing application icons...');
    createIcons();
    
    // Step 5: Install Electron dependencies
    log('Installing Electron dependencies...');
    process.chdir(TURNKEY_DIR);
    
    if (!fs.existsSync(path.join(TURNKEY_DIR, 'node_modules'))) {
      execSync('npm install', { stdio: 'inherit' });
    }
    
    // Step 6: Build Electron app
    log('Building Electron application...');
    const platform = process.argv[2] || 'all';
    
    if (platform === 'mac' || platform === 'all') {
      log('Building for macOS...');
      execSync('npm run build:mac', { stdio: 'inherit' });
    }
    
    if (platform === 'win' || platform === 'all') {
      log('Building for Windows...');
      execSync('npm run build:win', { stdio: 'inherit' });
    }
    
    if (platform === 'linux' || platform === 'all') {
      log('Building for Linux...');
      execSync('npm run build:linux', { stdio: 'inherit' });
    }
    
    log('Build completed successfully!');
    log(`Output files are in: ${path.join(TURNKEY_DIR, 'dist')}`);
    
  } catch (err) {
    error(`Build failed: ${err.message}`);
    process.exit(1);
  }
}

function copyDirectory(source, target) {
  if (!fs.existsSync(source)) {
    error(`Source directory does not exist: ${source}`);
    return;
  }
  
  // Create target directory
  fs.mkdirSync(target, { recursive: true });
  
  // Copy files
  const files = fs.readdirSync(source);
  
  for (const file of files) {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);
    
    if (fs.lstatSync(sourcePath).isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

function createIcons() {
  const iconsDir = path.join(RESOURCES_DIR, 'icons');
  fs.mkdirSync(iconsDir, { recursive: true });
  
  // Create placeholder icons if they don't exist
  // In production, you would use proper icon generation tools
  
  if (!fs.existsSync(path.join(iconsDir, 'icon.png'))) {
    log('Creating placeholder icon.png...');
    // Create a simple placeholder PNG
    const pngData = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );
    fs.writeFileSync(path.join(iconsDir, 'icon.png'), pngData);
  }
  
  if (!fs.existsSync(path.join(iconsDir, 'icon.ico'))) {
    log('Creating placeholder icon.ico...');
    // For Windows, copy PNG as ICO (placeholder)
    fs.copyFileSync(
      path.join(iconsDir, 'icon.png'),
      path.join(iconsDir, 'icon.ico')
    );
  }
  
  if (!fs.existsSync(path.join(iconsDir, 'icon.icns'))) {
    log('Creating placeholder icon.icns...');
    // For macOS, copy PNG as ICNS (placeholder)
    fs.copyFileSync(
      path.join(iconsDir, 'icon.png'),
      path.join(iconsDir, 'icon.icns')
    );
  }
}

// Run the build
buildApp();