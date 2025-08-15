const path = require('path');
const fs = require('fs').promises;
const axios = require('axios');
const { EventEmitter } = require('events');

class ModelManager extends EventEmitter {
  constructor(options) {
    super();
    this.modelsDir = options.modelsDir;
    this.resourcesPath = options.resourcesPath;
    this.isDev = options.isDev;
    
    // Define available models with their sizes and capabilities
    this.availableModels = {
      'llama3.2:3b': {
        name: 'Llama 3.2 3B',
        size: '2GB',
        description: 'Compact and fast model for general tasks',
        capabilities: ['text-generation', 'conversation'],
        recommended: true
      },
      'gpt-oss:20b': {
        name: 'GPT-OSS 20B',
        size: '14GB',
        description: 'Large model with advanced capabilities',
        capabilities: ['text-generation', 'conversation', 'analysis'],
        recommended: false
      },
      'phi3:mini': {
        name: 'Phi-3 Mini',
        size: '2.3GB',
        description: 'Microsoft\'s efficient small model',
        capabilities: ['text-generation', 'conversation'],
        recommended: true
      },
      'mistral:7b': {
        name: 'Mistral 7B',
        size: '4.1GB',
        description: 'Balanced performance and size',
        capabilities: ['text-generation', 'conversation', 'coding'],
        recommended: true
      },
      'codellama:7b': {
        name: 'Code Llama 7B',
        size: '3.8GB',
        description: 'Specialized for code generation',
        capabilities: ['code-generation', 'code-explanation'],
        recommended: false
      },
      'gemma2:2b': {
        name: 'Gemma 2 2B',
        size: '1.6GB',
        description: 'Google\'s efficient small model',
        capabilities: ['text-generation', 'conversation'],
        recommended: true
      }
    };

    this.defaultModel = 'llama3.2:3b'; // Changed to smaller default model
  }

  async initialize() {
    try {
      await fs.mkdir(this.modelsDir, { recursive: true });
      console.log('Model manager initialized');
    } catch (error) {
      console.error('Failed to initialize model manager:', error);
      throw error;
    }
  }

  async getAvailableModels() {
    return this.availableModels;
  }

  async getInstalledModels(ollamaService) {
    if (!ollamaService || !ollamaService.isRunning) {
      return [];
    }

    try {
      const models = await ollamaService.listModels();
      return models.map(model => ({
        name: model.name,
        size: this.formatSize(model.size),
        modified: model.modified_at,
        digest: model.digest
      }));
    } catch (error) {
      console.error('Failed to get installed models:', error);
      return [];
    }
  }

  async ensureDefaultModel(ollamaService) {
    try {
      const installedModels = await this.getInstalledModels(ollamaService);
      const hasDefaultModel = installedModels.some(
        model => model.name === this.defaultModel
      );

      if (!hasDefaultModel) {
        console.log(`Downloading default model: ${this.defaultModel}`);
        this.emit('model:download:start', this.defaultModel);
        
        await this.downloadModel(this.defaultModel, ollamaService);
        
        this.emit('model:download:complete', this.defaultModel);
        console.log(`Default model ${this.defaultModel} downloaded successfully`);
      } else {
        console.log(`Default model ${this.defaultModel} already installed`);
      }
    } catch (error) {
      console.error('Failed to ensure default model:', error);
      // Don't throw error - app can still work with cloud providers
      this.emit('model:download:error', { model: this.defaultModel, error });
    }
  }

  async downloadModel(modelName, ollamaService) {
    if (!ollamaService || !ollamaService.isRunning) {
      throw new Error('Ollama service is not running');
    }

    try {
      this.emit('model:download:progress', { model: modelName, progress: 0 });
      
      // Pull model using Ollama service
      await ollamaService.pullModel(modelName);
      
      this.emit('model:download:progress', { model: modelName, progress: 100 });
      return true;
    } catch (error) {
      console.error(`Failed to download model ${modelName}:`, error);
      throw error;
    }
  }

  async deleteModel(modelName, ollamaService) {
    if (!ollamaService || !ollamaService.isRunning) {
      throw new Error('Ollama service is not running');
    }

    try {
      await ollamaService.deleteModel(modelName);
      this.emit('model:deleted', modelName);
      return true;
    } catch (error) {
      console.error(`Failed to delete model ${modelName}:`, error);
      throw error;
    }
  }

  async getModelInfo(modelName) {
    return this.availableModels[modelName] || null;
  }

  async checkDiskSpace() {
    // This would check available disk space
    // For now, return a mock value
    return {
      available: '50GB',
      required: '2GB',
      sufficient: true
    };
  }

  formatSize(bytes) {
    if (!bytes) return 'Unknown';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }

  async downloadModelOffline(modelName, downloadPath) {
    // This method would handle offline model downloads
    // For bundled models or pre-downloaded models
    const modelPath = path.join(this.resourcesPath, 'models', `${modelName}.gguf`);
    
    try {
      await fs.access(modelPath);
      const targetPath = path.join(this.modelsDir, `${modelName}.gguf`);
      await fs.copyFile(modelPath, targetPath);
      return true;
    } catch (error) {
      console.error(`Offline model ${modelName} not found`);
      return false;
    }
  }

  getRecommendedModels() {
    return Object.entries(this.availableModels)
      .filter(([_, info]) => info.recommended)
      .map(([key, info]) => ({ key, ...info }));
  }

  async validateModel(modelName, ollamaService) {
    try {
      // Test if model can generate a response
      const testPrompt = 'Hello, respond with OK if you are working.';
      const response = await this.generateTest(modelName, testPrompt, ollamaService);
      return response && response.length > 0;
    } catch (error) {
      console.error(`Model validation failed for ${modelName}:`, error);
      return false;
    }
  }

  async generateTest(modelName, prompt, ollamaService) {
    if (!ollamaService || !ollamaService.isRunning) {
      throw new Error('Ollama service is not running');
    }

    const url = `http://localhost:${ollamaService.port}/api/generate`;
    
    try {
      const response = await axios.post(url, {
        model: modelName,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          max_tokens: 50
        }
      });
      
      return response.data.response;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = { ModelManager };