#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Create assets directory if it doesn't exist
const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir);
}

// Generate a simple brain icon
function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#4A90E2';
  ctx.fillRect(0, 0, size, size);
  
  // Brain emoji or simple shape
  ctx.fillStyle = 'white';
  ctx.font = `${size * 0.6}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🧠', size / 2, size / 2);
  
  return canvas.toBuffer();
}

// Generate icons for different platforms
console.log('Generating icons...');

try {
  // PNG for general use and Linux
  fs.writeFileSync(path.join(assetsDir, 'icon.png'), generateIcon(512));
  console.log('✓ Generated icon.png');
  
  // ICO for Windows (simplified - just use PNG data)
  fs.writeFileSync(path.join(assetsDir, 'icon.ico'), generateIcon(256));
  console.log('✓ Generated icon.ico');
  
  // ICNS for macOS (simplified - just use PNG data)
  fs.writeFileSync(path.join(assetsDir, 'icon.icns'), generateIcon(512));
  console.log('✓ Generated icon.icns');
  
  console.log('\n✅ All icons generated successfully!');
} catch (error) {
  console.error('Failed to generate icons:', error);
  
  // Create placeholder icons as fallback
  console.log('\nCreating placeholder icons...');
  const placeholderData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
  
  fs.writeFileSync(path.join(assetsDir, 'icon.png'), placeholderData);
  fs.writeFileSync(path.join(assetsDir, 'icon.ico'), placeholderData);
  fs.writeFileSync(path.join(assetsDir, 'icon.icns'), placeholderData);
  
  console.log('✓ Created placeholder icons');
}