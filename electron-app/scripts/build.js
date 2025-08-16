#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const platform = process.argv[2] || process.platform;

console.log('🚀 Building Brain Cells Electron App...');
console.log(`Platform: ${platform}`);

// Step 1: Build the frontend
console.log('\n📦 Building frontend...');
process.chdir(path.join(__dirname, '..', '..', 'aisheets'));

if (!fs.existsSync('node_modules')) {
  console.log('Installing frontend dependencies...');
  execSync('npm install', { stdio: 'inherit' });
}

execSync('npm run build', { stdio: 'inherit' });

// Step 2: Prepare Electron app
console.log('\n⚡ Preparing Electron app...');
process.chdir(path.join(__dirname, '..'));

if (!fs.existsSync('node_modules')) {
  console.log('Installing Electron dependencies...');
  execSync('npm install', { stdio: 'inherit' });
}

// Step 3: Copy necessary files
console.log('\n📁 Copying files...');

// Create server directory if it doesn't exist
if (!fs.existsSync('server')) {
  fs.mkdirSync('server');
}

// Copy built aisheets server files
const serverSourceDir = path.join('..', 'aisheets', 'server');
const serverDestDir = 'server';

if (fs.existsSync(serverSourceDir)) {
  console.log('Copying server files...');
  execSync(`cp -r ${serverSourceDir}/* ${serverDestDir}/`, { stdio: 'inherit' });
}

// Step 4: Create icons if they don't exist
console.log('\n🎨 Checking icons...');
if (!fs.existsSync('assets/icon.png')) {
  console.log('Creating placeholder icon...');
  // Create a simple placeholder icon (you should replace with actual icon)
  const iconData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
  fs.writeFileSync('assets/icon.png', iconData);
  fs.writeFileSync('assets/icon.ico', iconData);
  fs.writeFileSync('assets/icon.icns', iconData);
}

// Step 5: Build with electron-builder
console.log('\n🏗️ Building with electron-builder...');

let buildCommand;
switch (platform) {
  case 'win32':
  case 'win':
    buildCommand = 'npm run build:win';
    break;
  case 'darwin':
  case 'mac':
    buildCommand = 'npm run build:mac';
    break;
  case 'all':
    buildCommand = 'npm run build:all';
    break;
  default:
    buildCommand = 'npm run dist';
}

try {
  execSync(buildCommand, { stdio: 'inherit' });
  console.log('\n✅ Build complete! Check the dist/ folder for the built application.');
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}