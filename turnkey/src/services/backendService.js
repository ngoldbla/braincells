const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const axios = require('axios');
const { EventEmitter } = require('events');

class BackendService extends EventEmitter {
  constructor(options) {
    super();
    this.port = options.port || 3000;
    this.ollamaPort = options.ollamaPort || 11434;
    this.dataDir = options.dataDir;
    this.appPath = options.appPath;
    this.isDev = options.isDev;
    this.process = null;
    this.isRunning = false;
  }

  async start() {
    if (this.isRunning) {
      return;
    }

    try {
      // Ensure data directory exists
      await fs.mkdir(this.dataDir, { recursive: true });
      
      // Set environment variables
      const env = {
        ...process.env,
        NODE_ENV: this.isDev ? 'development' : 'production',
        PORT: this.port.toString(),
        DATA_DIR: this.dataDir,
        OLLAMA_HOST: `http://localhost:${this.ollamaPort}`,
        HF_TOKEN: process.env.HF_TOKEN || '',
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
        SERPER_API_KEY: process.env.SERPER_API_KEY || '',
        // Disable telemetry in production builds
        DO_NOT_TRACK: '1',
        TELEMETRY_DISABLED: '1'
      };

      // Determine the entry point
      const entryPoint = this.isDev
        ? path.join(this.appPath, 'src', 'entry.express.tsx')
        : path.join(this.appPath, 'server', 'entry.express.js');

      // Start the backend server
      console.log(`Starting backend service on port ${this.port}...`);
      
      if (this.isDev) {
        // In development, use npm run dev
        this.process = spawn('npm', ['run', 'dev'], {
          env,
          cwd: this.appPath,
          stdio: ['ignore', 'pipe', 'pipe']
        });
      } else {
        // In production, run the built server
        this.process = spawn('node', [entryPoint], {
          env,
          cwd: this.appPath,
          stdio: ['ignore', 'pipe', 'pipe']
        });
      }

      // Handle process output
      this.process.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`[Backend] ${output}`);
        
        // Check if server is ready
        if (output.includes('Server running') || output.includes('Listening on')) {
          this.isRunning = true;
          this.emit('ready');
        }
      });

      this.process.stderr.on('data', (data) => {
        console.error(`[Backend Error] ${data.toString()}`);
      });

      this.process.on('error', (error) => {
        console.error('Failed to start backend:', error);
        this.emit('error', error);
      });

      this.process.on('exit', (code, signal) => {
        console.log(`Backend process exited with code ${code} and signal ${signal}`);
        this.isRunning = false;
        this.emit('exit', { code, signal });
      });

      // Wait for backend to be ready
      await this.waitForReady();
      
      this.isRunning = true;
      this.emit('started');
      console.log('Backend service started successfully');
      
    } catch (error) {
      console.error('Failed to start backend service:', error);
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

  async waitForReady(maxAttempts = 60) {
    const url = `http://localhost:${this.port}`;
    
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
    
    throw new Error('Backend service failed to start within timeout');
  }

  async healthCheck() {
    if (!this.isRunning) {
      return { healthy: false, reason: 'Service not running' };
    }

    try {
      const response = await axios.get(`http://localhost:${this.port}/api/health`, {
        timeout: 5000
      });
      
      return {
        healthy: response.status === 200,
        ...response.data
      };
    } catch (error) {
      // Try basic endpoint if health endpoint doesn't exist
      try {
        const response = await axios.get(`http://localhost:${this.port}`, {
          timeout: 5000
        });
        
        return {
          healthy: response.status === 200
        };
      } catch (error) {
        return {
          healthy: false,
          error: error.message
        };
      }
    }
  }

  async restart() {
    await this.stop();
    await this.start();
  }
}

module.exports = { BackendService };