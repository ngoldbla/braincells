#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const { pipeline } = require('stream');
const { promisify } = require('util');
const extractZip = require('extract-zip');

const streamPipeline = promisify(pipeline);

const OLLAMA_RELEASES = {
  'darwin-arm64': {
    url: 'https://github.com/ollama/ollama/releases/latest/download/ollama-darwin',
    filename: 'ollama',
    extract: false
  },
  'darwin-x64': {
    url: 'https://github.com/ollama/ollama/releases/latest/download/ollama-darwin',
    filename: 'ollama',
    extract: false
  },
  'win32-x64': {
    url: 'https://github.com/ollama/ollama/releases/latest/download/ollama-windows-amd64.exe',
    filename: 'ollama.exe',
    extract: false
  },
  'linux-x64': {
    url: 'https://github.com/ollama/ollama/releases/latest/download/ollama-linux-amd64',
    filename: 'ollama',
    extract: false
  }
};

async function downloadFile(url, destination) {
  console.log(`Downloading from ${url}...`);
  
  return new Promise((resolve, reject) => {
    https.get(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 30000
    }, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        downloadFile(response.headers.location, destination)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloadedSize = 0;
      
      const fileStream = fs.createWriteStream(destination);
      
      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        const progress = ((downloadedSize / totalSize) * 100).toFixed(1);
        process.stdout.write(`\rDownloading... ${progress}%`);
      });
      
      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        console.log('\nDownload completed');
        resolve();
      });
      
      fileStream.on('error', (err) => {
        fs.unlink(destination, () => {}); // Delete incomplete file
        reject(err);
      });
    }).on('error', reject);
  });
}

async function downloadOllama() {
  const platforms = process.argv.slice(2);
  const downloadPlatforms = platforms.length > 0 ? platforms : Object.keys(OLLAMA_RELEASES);
  
  const resourcesDir = path.join(__dirname, '..', 'resources', 'ollama');
  
  for (const platform of downloadPlatforms) {
    if (!OLLAMA_RELEASES[platform]) {
      console.error(`Unknown platform: ${platform}`);
      continue;
    }
    
    const config = OLLAMA_RELEASES[platform];
    const platformDir = path.join(resourcesDir, platform);
    const binaryPath = path.join(platformDir, config.filename);
    
    // Check if already downloaded
    if (fs.existsSync(binaryPath)) {
      console.log(`Ollama for ${platform} already exists, skipping...`);
      continue;
    }
    
    // Create directory
    fs.mkdirSync(platformDir, { recursive: true });
    
    console.log(`\nDownloading Ollama for ${platform}...`);
    
    try {
      // Download the file
      const tempPath = path.join(platformDir, `${config.filename}.tmp`);
      await downloadFile(config.url, tempPath);
      
      // Extract if needed
      if (config.extract) {
        console.log('Extracting archive...');
        if (config.url.endsWith('.zip')) {
          await extractZip(tempPath, { dir: platformDir });
        }
        fs.unlinkSync(tempPath);
      } else {
        // Just rename the file
        fs.renameSync(tempPath, binaryPath);
      }
      
      // Make executable on Unix-like systems
      if (platform.startsWith('darwin') || platform.startsWith('linux')) {
        fs.chmodSync(binaryPath, '755');
      }
      
      console.log(`✓ Ollama for ${platform} downloaded successfully`);
      
    } catch (error) {
      console.error(`✗ Failed to download Ollama for ${platform}:`, error.message);
      // Clean up partial downloads
      if (fs.existsSync(platformDir)) {
        fs.rmSync(platformDir, { recursive: true });
      }
    }
  }
  
  console.log('\nAll downloads completed');
}

// Run the download
downloadOllama().catch(error => {
  console.error('Download failed:', error);
  process.exit(1);
});