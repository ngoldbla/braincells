const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const axios = require('axios');
const log = require('electron-log');
const { promisify } = require('util');

const execAsync = promisify(exec);

class OllamaManager {
  constructor() {
    this.process = null;
    this.isRunning = false;
    this.platform = process.platform;
    this.ollamaHost = 'http://localhost:11434';
  }

  async checkInstalled() {
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

  async checkRunning() {
    try {
      const response = await axios.get(`${this.ollamaHost}/api/tags`, { timeout: 2000 });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async start() {
    if (await this.checkRunning()) {
      log.info('Ollama is already running');
      this.isRunning = true;
      return true;
    }

    const isInstalled = await this.checkInstalled();
    
    if (!isInstalled) {
      log.warn('Ollama is not installed');
      return false;
    }

    return new Promise((resolve, reject) => {
      const env = { ...process.env, OLLAMA_HOST: '0.0.0.0:11434' };
      
      this.process = spawn('ollama', ['serve'], { env });
      
      this.process.stdout.on('data', (data) => {
        log.info(`Ollama: ${data}`);
        if (data.toString().includes('Listening on')) {
          this.isRunning = true;
          setTimeout(() => resolve(true), 1000);
        }
      });
      
      this.process.stderr.on('data', (data) => {
        log.error(`Ollama Error: ${data}`);
      });
      
      this.process.on('error', (error) => {
        log.error('Failed to start Ollama:', error);
        this.isRunning = false;
        reject(error);
      });
      
      this.process.on('exit', (code) => {
        log.info(`Ollama process exited with code ${code}`);
        this.isRunning = false;
      });
      
      setTimeout(() => {
        if (!this.isRunning) {
          this.checkRunning().then((running) => {
            this.isRunning = running;
            resolve(running);
          });
        }
      }, 5000);
    });
  }

  async stop() {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
    this.isRunning = false;
  }

  async pullModel(modelName, progressCallback) {
    try {
      log.info(`Pulling model: ${modelName}`);
      
      const response = await axios.post(`${this.ollamaHost}/api/pull`, {
        name: modelName
      }, {
        responseType: 'stream',
        timeout: 0
      });
      
      return new Promise((resolve, reject) => {
        let lastProgress = 0;
        
        response.data.on('data', (chunk) => {
          const lines = chunk.toString().split('\n').filter(Boolean);
          lines.forEach(line => {
            try {
              const data = JSON.parse(line);
              
              if (data.status === 'success') {
                log.info(`Model ${modelName} pulled successfully`);
                if (progressCallback) progressCallback({ status: 'complete', progress: 100 });
                resolve(true);
              } else if (data.status) {
                let progress = 0;
                if (data.completed && data.total) {
                  progress = Math.round((data.completed / data.total) * 100);
                }
                
                if (progress !== lastProgress) {
                  lastProgress = progress;
                  log.info(`Pull progress: ${progress}% - ${data.status}`);
                  if (progressCallback) {
                    progressCallback({
                      status: data.status,
                      progress: progress,
                      completed: data.completed,
                      total: data.total
                    });
                  }
                }
              }
            } catch (e) {
              // Ignore JSON parse errors
            }
          });
        });
        
        response.data.on('end', () => {
          resolve(true);
        });
        
        response.data.on('error', (error) => {
          log.error('Error pulling model:', error);
          reject(error);
        });
      });
    } catch (error) {
      log.error('Failed to pull model:', error);
      throw error;
    }
  }

  async listModels() {
    try {
      const response = await axios.get(`${this.ollamaHost}/api/tags`);
      return response.data.models || [];
    } catch (error) {
      log.error('Failed to list models:', error);
      return [];
    }
  }

  async deleteModel(modelName) {
    try {
      const response = await axios.delete(`${this.ollamaHost}/api/delete`, {
        data: { name: modelName }
      });
      return response.status === 200;
    } catch (error) {
      log.error('Failed to delete model:', error);
      return false;
    }
  }

  async generateCompletion(prompt, model = 'llama3.2', options = {}) {
    try {
      const response = await axios.post(`${this.ollamaHost}/api/generate`, {
        model: model,
        prompt: prompt,
        stream: false,
        ...options
      });
      
      return response.data.response;
    } catch (error) {
      log.error('Failed to generate completion:', error);
      throw error;
    }
  }

  async generateChat(messages, model = 'llama3.2', options = {}) {
    try {
      const response = await axios.post(`${this.ollamaHost}/api/chat`, {
        model: model,
        messages: messages,
        stream: false,
        ...options
      });
      
      return response.data.message;
    } catch (error) {
      log.error('Failed to generate chat:', error);
      throw error;
    }
  }
}

module.exports = OllamaManager;