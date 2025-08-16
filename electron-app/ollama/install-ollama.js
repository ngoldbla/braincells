const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;
const https = require('https');
const log = require('electron-log');

const execAsync = promisify(exec);

class OllamaInstaller {
  constructor() {
    this.platform = process.platform;
    this.arch = process.arch;
  }

  async isInstalled() {
    try {
      if (this.platform === 'win32') {
        const { stdout } = await execAsync('where ollama');
        return stdout.trim().length > 0;
      } else {
        const { stdout } = await execAsync('which ollama');
        return stdout.trim().length > 0;
      }
    } catch (error) {
      return false;
    }
  }

  async downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
      const file = require('fs').createWriteStream(destPath);
      
      https.get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Handle redirect
          this.downloadFile(response.headers.location, destPath)
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
        let lastProgress = 0;
        
        response.on('data', (chunk) => {
          downloadedSize += chunk.length;
          const progress = Math.round((downloadedSize / totalSize) * 100);
          
          if (progress !== lastProgress && progress % 10 === 0) {
            lastProgress = progress;
            log.info(`Download progress: ${progress}%`);
          }
        });
        
        response.pipe(file);
        
        file.on('finish', () => {
          file.close(() => resolve(destPath));
        });
      }).on('error', (error) => {
        fs.unlink(destPath).catch(() => {});
        reject(error);
      });
    });
  }

  async installWindows() {
    const installerUrl = 'https://ollama.ai/download/OllamaSetup.exe';
    const installerPath = path.join(require('os').tmpdir(), 'OllamaSetup.exe');
    
    try {
      log.info('Downloading Ollama installer for Windows...');
      await this.downloadFile(installerUrl, installerPath);
      
      log.info('Running Ollama installer...');
      await execAsync(`"${installerPath}" /S`);
      
      log.info('Ollama installed successfully');
      await fs.unlink(installerPath).catch(() => {});
      
      return true;
    } catch (error) {
      log.error('Failed to install Ollama:', error);
      throw error;
    }
  }

  async installMac() {
    try {
      log.info('Installing Ollama for macOS...');
      
      // Check if Homebrew is installed
      try {
        await execAsync('which brew');
        // Install via Homebrew
        log.info('Installing Ollama via Homebrew...');
        await execAsync('brew install ollama');
      } catch (error) {
        // Download and install directly
        const downloadUrl = 'https://ollama.ai/download/Ollama-darwin.zip';
        const zipPath = path.join(require('os').tmpdir(), 'Ollama-darwin.zip');
        const extractPath = path.join(require('os').tmpdir(), 'Ollama.app');
        
        log.info('Downloading Ollama for macOS...');
        await this.downloadFile(downloadUrl, zipPath);
        
        log.info('Extracting Ollama...');
        await execAsync(`unzip -o "${zipPath}" -d "${path.dirname(extractPath)}"`);
        
        log.info('Moving Ollama to Applications...');
        await execAsync(`mv "${extractPath}" /Applications/`);
        
        log.info('Creating ollama command line tool...');
        await execAsync('ln -sf /Applications/Ollama.app/Contents/MacOS/ollama /usr/local/bin/ollama');
        
        await fs.unlink(zipPath).catch(() => {});
      }
      
      log.info('Ollama installed successfully');
      return true;
    } catch (error) {
      log.error('Failed to install Ollama:', error);
      throw error;
    }
  }

  async installLinux() {
    try {
      log.info('Installing Ollama for Linux...');
      
      const installScript = `curl -fsSL https://ollama.ai/install.sh | sh`;
      await execAsync(installScript);
      
      log.info('Ollama installed successfully');
      return true;
    } catch (error) {
      log.error('Failed to install Ollama:', error);
      throw error;
    }
  }

  async install() {
    if (await this.isInstalled()) {
      log.info('Ollama is already installed');
      return true;
    }

    switch (this.platform) {
      case 'win32':
        return await this.installWindows();
      case 'darwin':
        return await this.installMac();
      case 'linux':
        return await this.installLinux();
      default:
        throw new Error(`Unsupported platform: ${this.platform}`);
    }
  }
}

module.exports = OllamaInstaller;