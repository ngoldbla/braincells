const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const portfinder = require('portfinder');
const Store = require('electron-store');
const { ServiceManager } = require('./services/serviceManager');
const { OllamaService } = require('./services/ollamaService');
const { BackendService } = require('./services/backendService');
const { DatabaseManager } = require('./services/databaseManager');
const { ModelManager } = require('./services/modelManager');
const { autoUpdater } = require('electron-updater');

const isDev = process.argv.includes('--dev');
const store = new Store();

class BrainCellsApp {
  constructor() {
    this.mainWindow = null;
    this.serviceManager = new ServiceManager();
    this.ollamaService = null;
    this.backendService = null;
    this.databaseManager = null;
    this.modelManager = null;
    this.isQuitting = false;
    this.backendPort = 3000;
    this.ollamaPort = 11434;
  }

  async init() {
    await this.setupAppEvents();
    await this.setupIpcHandlers();
    await this.checkSingleInstance();
  }

  async setupAppEvents() {
    app.whenReady().then(async () => {
      await this.onReady();
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        this.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      }
    });

    app.on('before-quit', async (event) => {
      if (!this.isQuitting) {
        event.preventDefault();
        await this.gracefulShutdown();
      }
    });
  }

  async onReady() {
    try {
      // Initialize services
      await this.initializeServices();
      
      // Create main window
      await this.createMainWindow();
      
      // Start services
      await this.startServices();
      
      // Check for updates
      if (!isDev) {
        autoUpdater.checkForUpdatesAndNotify();
      }
      
      // Load the application
      await this.loadApplication();
      
    } catch (error) {
      console.error('Failed to start application:', error);
      dialog.showErrorBox('Startup Error', 
        `Failed to start Brain Cells: ${error.message}\n\nPlease try restarting the application.`);
      app.quit();
    }
  }

  async initializeServices() {
    // Find available ports
    this.backendPort = await portfinder.getPortPromise({ port: 3000 });
    this.ollamaPort = await portfinder.getPortPromise({ port: 11434 });
    
    // Get application paths
    const userDataPath = app.getPath('userData');
    const resourcesPath = isDev 
      ? path.join(__dirname, '..', 'resources')
      : path.join(process.resourcesPath);
    
    // Initialize database manager
    this.databaseManager = new DatabaseManager({
      dataDir: path.join(userDataPath, 'data'),
      isDev
    });
    await this.databaseManager.initialize();
    
    // Initialize model manager
    this.modelManager = new ModelManager({
      modelsDir: path.join(userDataPath, 'models'),
      resourcesPath,
      isDev
    });
    
    // Initialize Ollama service
    this.ollamaService = new OllamaService({
      port: this.ollamaPort,
      dataDir: path.join(userDataPath, 'ollama'),
      resourcesPath,
      isDev
    });
    
    // Initialize backend service
    this.backendService = new BackendService({
      port: this.backendPort,
      ollamaPort: this.ollamaPort,
      dataDir: path.join(userDataPath, 'data'),
      appPath: isDev 
        ? path.join(__dirname, '..', '..', 'aisheets')
        : path.join(resourcesPath, 'app'),
      isDev
    });
    
    // Register services with manager
    this.serviceManager.registerService('ollama', this.ollamaService);
    this.serviceManager.registerService('backend', this.backendService);
  }

  async startServices() {
    try {
      // Show splash screen with progress
      await this.showSplashScreen();
      
      // Start Ollama service
      this.updateSplashScreen('Starting AI services...');
      await this.ollamaService.start();
      
      // Download default model if needed
      this.updateSplashScreen('Checking AI models...');
      await this.modelManager.ensureDefaultModel(this.ollamaService);
      
      // Start backend service
      this.updateSplashScreen('Starting application server...');
      await this.backendService.start();
      
      // Initialize databases
      this.updateSplashScreen('Initializing databases...');
      await this.databaseManager.runMigrations();
      
      // Hide splash screen
      this.hideSplashScreen();
      
    } catch (error) {
      console.error('Failed to start services:', error);
      throw error;
    }
  }

  async createMainWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 800,
      minHeight: 600,
      title: 'Brain Cells',
      icon: this.getIconPath(),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      show: false
    });

    // Setup window events
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    this.mainWindow.on('close', (event) => {
      if (!this.isQuitting && process.platform === 'darwin') {
        event.preventDefault();
        this.mainWindow.hide();
      }
    });

    // Setup application menu
    this.setupMenu();
  }

  async loadApplication() {
    const appUrl = `http://localhost:${this.backendPort}`;
    
    // Wait for backend to be ready
    await this.waitForBackend(appUrl);
    
    // Load the application
    this.mainWindow.loadURL(appUrl);
    
    // Open DevTools in development
    if (isDev) {
      this.mainWindow.webContents.openDevTools();
    }
  }

  async waitForBackend(url, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(url);
        if (response.ok) return;
      } catch (error) {
        // Backend not ready yet
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error('Backend service failed to start');
  }

  setupMenu() {
    const template = [
      {
        label: 'File',
        submenu: [
          {
            label: 'New Dataset',
            accelerator: 'CmdOrCtrl+N',
            click: () => this.sendToRenderer('menu:new-dataset')
          },
          {
            label: 'Open Dataset',
            accelerator: 'CmdOrCtrl+O',
            click: () => this.sendToRenderer('menu:open-dataset')
          },
          { type: 'separator' },
          {
            label: 'Import Data',
            submenu: [
              { label: 'From CSV...', click: () => this.sendToRenderer('menu:import-csv') },
              { label: 'From Excel...', click: () => this.sendToRenderer('menu:import-excel') },
              { label: 'From JSON...', click: () => this.sendToRenderer('menu:import-json') }
            ]
          },
          {
            label: 'Export Data',
            submenu: [
              { label: 'As CSV...', click: () => this.sendToRenderer('menu:export-csv') },
              { label: 'As Excel...', click: () => this.sendToRenderer('menu:export-excel') },
              { label: 'As JSON...', click: () => this.sendToRenderer('menu:export-json') }
            ]
          },
          { type: 'separator' },
          { role: 'quit' }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectAll' }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      {
        label: 'AI',
        submenu: [
          {
            label: 'Model Settings',
            click: () => this.showModelSettings()
          },
          {
            label: 'Download Models',
            click: () => this.showModelDownloader()
          },
          { type: 'separator' },
          {
            label: 'API Keys',
            click: () => this.showApiKeySettings()
          }
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'Documentation',
            click: () => shell.openExternal('https://braincells.ai/docs')
          },
          {
            label: 'Report Issue',
            click: () => shell.openExternal('https://github.com/braincells/issues')
          },
          { type: 'separator' },
          {
            label: 'About Brain Cells',
            click: () => this.showAboutDialog()
          }
        ]
      }
    ];

    if (process.platform === 'darwin') {
      template.unshift({
        label: app.getName(),
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services', submenu: [] },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      });
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  setupIpcHandlers() {
    // System status
    ipcMain.handle('get-system-status', async () => {
      return {
        backend: this.backendService?.isRunning(),
        ollama: this.ollamaService?.isRunning(),
        backendPort: this.backendPort,
        ollamaPort: this.ollamaPort
      };
    });

    // Model management
    ipcMain.handle('get-available-models', async () => {
      return await this.modelManager.getAvailableModels();
    });

    ipcMain.handle('download-model', async (event, modelName) => {
      return await this.modelManager.downloadModel(modelName, this.ollamaService);
    });

    ipcMain.handle('delete-model', async (event, modelName) => {
      return await this.modelManager.deleteModel(modelName, this.ollamaService);
    });

    // Settings management
    ipcMain.handle('get-settings', async () => {
      return store.store;
    });

    ipcMain.handle('set-setting', async (event, key, value) => {
      store.set(key, value);
      return true;
    });

    // Service control
    ipcMain.handle('restart-services', async () => {
      await this.restartServices();
    });
  }

  async restartServices() {
    try {
      await this.serviceManager.stopAll();
      await this.serviceManager.startAll();
      this.mainWindow.reload();
    } catch (error) {
      console.error('Failed to restart services:', error);
      dialog.showErrorBox('Restart Error', 
        `Failed to restart services: ${error.message}`);
    }
  }

  async gracefulShutdown() {
    this.isQuitting = true;
    
    try {
      // Stop all services
      await this.serviceManager.stopAll();
      
      // Close databases
      if (this.databaseManager) {
        await this.databaseManager.close();
      }
      
      // Quit the app
      app.quit();
    } catch (error) {
      console.error('Error during shutdown:', error);
      app.quit();
    }
  }

  sendToRenderer(channel, data) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  showSplashScreen() {
    // Implementation for splash screen
    // This would show a loading window with progress updates
  }

  updateSplashScreen(message) {
    // Update splash screen message
    console.log(`Loading: ${message}`);
  }

  hideSplashScreen() {
    // Hide the splash screen
  }

  showModelSettings() {
    // Show model settings dialog
    this.sendToRenderer('show:model-settings');
  }

  showModelDownloader() {
    // Show model downloader dialog
    this.sendToRenderer('show:model-downloader');
  }

  showApiKeySettings() {
    // Show API key settings dialog
    this.sendToRenderer('show:api-settings');
  }

  showAboutDialog() {
    dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'About Brain Cells',
      message: 'Brain Cells Desktop',
      detail: `Version: ${app.getVersion()}\nElectron: ${process.versions.electron}\nNode: ${process.versions.node}`,
      buttons: ['OK']
    });
  }

  getIconPath() {
    if (process.platform === 'darwin') {
      return path.join(__dirname, '..', 'resources', 'icons', 'icon.icns');
    } else if (process.platform === 'win32') {
      return path.join(__dirname, '..', 'resources', 'icons', 'icon.ico');
    } else {
      return path.join(__dirname, '..', 'resources', 'icons', 'icon.png');
    }
  }

  checkSingleInstance() {
    const gotTheLock = app.requestSingleInstanceLock();

    if (!gotTheLock) {
      app.quit();
    } else {
      app.on('second-instance', () => {
        if (this.mainWindow) {
          if (this.mainWindow.isMinimized()) this.mainWindow.restore();
          this.mainWindow.focus();
        }
      });
    }
  }

  quit() {
    this.gracefulShutdown();
  }
}

// Initialize and start the application
const brainCellsApp = new BrainCellsApp();
brainCellsApp.init().catch(error => {
  console.error('Failed to initialize application:', error);
  app.quit();
});