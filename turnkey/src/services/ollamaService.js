const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const axios = require('axios');
const { EventEmitter } = require('events');

class OllamaService extends EventEmitter {
  constructor(options) {
    super();
    this.port = options.port || 11434;
    this.dataDir = options.dataDir;
    this.resourcesPath = options.resourcesPath;
    this.isDev = options.isDev;
    this.process = null;
    this.isRunning = false;
    this.platform = process.platform;
    this.arch = process.arch;
  }

  async start() {
    if (this.isRunning) {
      return;
    }

    try {
      // Ensure data directory exists
      await fs.mkdir(this.dataDir, { recursive: true });
      
      // Get Ollama binary path
      const ollamaBinary = await this.getOllamaBinary();
      
      // Set environment variables
      const env = {
        ...process.env,
        OLLAMA_HOST: `0.0.0.0:${this.port}`,
        OLLAMA_MODELS: path.join(this.dataDir, 'models'),
        OLLAMA_KEEP_ALIVE: '5m',
        OLLAMA_NUM_PARALLEL: '1',
        OLLAMA_MAX_LOADED_MODELS: '1'
      };

      // Start Ollama server
      console.log(`Starting Ollama service on port ${this.port}...`);
      this.process = spawn(ollamaBinary, ['serve'], {
        env,
        cwd: this.dataDir,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      // Handle process output
      this.process.stdout.on('data', (data) => {
        console.log(`[Ollama] ${data.toString()}`);
      });

      this.process.stderr.on('data', (data) => {
        console.error(`[Ollama Error] ${data.toString()}`);
      });

      this.process.on('error', (error) => {
        console.error('Failed to start Ollama:', error);
        this.emit('error', error);
      });

      this.process.on('exit', (code, signal) => {
        console.log(`Ollama process exited with code ${code} and signal ${signal}`);
        this.isRunning = false;
        this.emit('exit', { code, signal });
      });

      // Wait for Ollama to be ready
      await this.waitForReady();
      
      this.isRunning = true;
      this.emit('started');
      console.log('Ollama service started successfully');
      
    } catch (error) {
      console.error('Failed to start Ollama service:', error);
      throw error;
    }
  }

  async stop() {
    if (!this.isRunning || !this.process) {
      return;
    }

    return new Promise((resolve) => {
      this.process.once('exit', () => {
        this.isRunning = false;
        this.process = null;
        this.emit('stopped');
        resolve();
      });

      // Send graceful shutdown signal
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', this.process.pid, '/f', '/t']);
      } else {
        this.process.kill('SIGTERM');
      }

      // Force kill after 10 seconds
      setTimeout(() => {
        if (this.process) {
          this.process.kill('SIGKILL');
        }
      }, 10000);
    });
  }

  async waitForReady(maxAttempts = 30) {
    const url = `http://localhost:${this.port}/api/tags`;
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await axios.get(url, { timeout: 1000 });
        if (response.status === 200) {
          return true;
        }
      } catch (error) {
        // Not ready yet
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Ollama service failed to start within timeout');
  }

  async getOllamaBinary() {
    // Determine the correct binary based on platform
    let binaryName;
    let platformDir;
    
    if (this.platform === 'darwin') {
      binaryName = 'ollama';
      platformDir = this.arch === 'arm64' ? 'darwin-arm64' : 'darwin-x64';
    } else if (this.platform === 'win32') {
      binaryName = 'ollama.exe';
      platformDir = 'win32-x64';
    } else if (this.platform === 'linux') {
      binaryName = 'ollama';
      platformDir = 'linux-x64';
    } else {
      throw new Error(`Unsupported platform: ${this.platform}`);
    }
    
    const binaryPath = path.join(this.resourcesPath, 'ollama', platformDir, binaryName);
    
    // Check if binary exists
    try {
      await fs.access(binaryPath, fs.constants.X_OK);
    } catch (error) {
      // If not found in resources, try to use system Ollama
      if (this.isDev) {
        return 'ollama'; // Use system ollama in development
      }
      throw new Error(`Ollama binary not found at ${binaryPath}`);
    }
    
    return binaryPath;
  }

  async pullModel(modelName) {
    if (!this.isRunning) {
      throw new Error('Ollama service is not running');
    }

    const url = `http://localhost:${this.port}/api/pull`;
    
    try {
      const response = await axios.post(url, {
        name: modelName,
        stream: false
      });
      
      return response.data;
    } catch (error) {
      console.error(`Failed to pull model ${modelName}:`, error);
      throw error;
    }
  }

  async listModels() {
    if (!this.isRunning) {
      throw new Error('Ollama service is not running');
    }

    const url = `http://localhost:${this.port}/api/tags`;
    
    try {
      const response = await axios.get(url);
      return response.data.models || [];
    } catch (error) {
      console.error('Failed to list models:', error);
      throw error;
    }
  }

  async deleteModel(modelName) {
    if (!this.isRunning) {
      throw new Error('Ollama service is not running');
    }

    const url = `http://localhost:${this.port}/api/delete`;
    
    try {
      const response = await axios.delete(url, {
        data: { name: modelName }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Failed to delete model ${modelName}:`, error);
      throw error;
    }
  }

  async healthCheck() {
    if (!this.isRunning) {
      return { healthy: false, reason: 'Service not running' };
    }

    try {
      const response = await axios.get(`http://localhost:${this.port}/api/tags`, {
        timeout: 5000
      });
      
      return {
        healthy: response.status === 200,
        models: response.data.models?.length || 0
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }
}

module.exports = { OllamaService };