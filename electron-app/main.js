const { app, BrowserWindow, Menu, dialog, shell, ipcMain } = require('electron');
const path = require('path');
const { spawn, fork } = require('child_process');
const fs = require('fs').promises;
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const Store = require('electron-store');
const OllamaManager = require('./ollama/manager');
const OllamaInstaller = require('./ollama/install-ollama');

const isDev = process.argv.includes('--dev') || !app.isPackaged;
const store = new Store();

let mainWindow;
let ollamaManager;
let expressServerProcess;
let serverPort = 3000;

log.transports.file.level = 'info';
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

async function findAvailablePort(startPort) {
  const net = require('net');
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

async function startOllama() {
  ollamaManager = new OllamaManager();
  
  // Check if Ollama is already running
  if (await ollamaManager.checkRunning()) {
    log.info('Ollama is already running');
    return true;
  }
  
  // Check if Ollama is installed
  const installer = new OllamaInstaller();
  const isInstalled = await installer.isInstalled();
  
  if (!isInstalled) {
    const result = await dialog.showMessageBox(mainWindow || null, {
      type: 'question',
      title: 'Ollama Not Found',
      message: 'Ollama is not installed. Would you like to install it now?',
      detail: 'Ollama is required for AI features in Brain Cells.',
      buttons: ['Install Ollama', 'Download Manually', 'Continue Without AI'],
      defaultId: 0
    });
    
    if (result.response === 0) {
      try {
        dialog.showMessageBox(mainWindow || null, {
          type: 'info',
          title: 'Installing Ollama',
          message: 'Installing Ollama... This may take a few minutes.',
          buttons: []
        });
        
        await installer.install();
        
        dialog.showMessageBox(mainWindow || null, {
          type: 'info',
          title: 'Installation Complete',
          message: 'Ollama has been installed successfully!'
        });
      } catch (error) {
        dialog.showErrorBox('Installation Failed', `Failed to install Ollama: ${error.message}`);
        return false;
      }
    } else if (result.response === 1) {
      shell.openExternal('https://ollama.ai');
      return false;
    } else {
      return false;
    }
  }
  
  // Start Ollama
  try {
    await ollamaManager.start();
    log.info('Ollama started successfully');
    
    // Check if default model is available
    const models = await ollamaManager.listModels();
    const defaultModel = store.get('ollamaModel', 'llama3.2');
    
    if (!models.some(m => m.name === defaultModel)) {
      const pullResult = await dialog.showMessageBox(mainWindow || null, {
        type: 'question',
        title: 'Download AI Model',
        message: `Would you like to download the ${defaultModel} model?`,
        detail: 'This model is required for AI features and may take some time to download.',
        buttons: ['Download', 'Skip'],
        defaultId: 0
      });
      
      if (pullResult.response === 0) {
        await pullOllamaModel(defaultModel);
      }
    }
    
    return true;
  } catch (error) {
    log.error('Failed to start Ollama:', error);
    return false;
  }
}

async function pullOllamaModel(modelName = 'llama3.2') {
  if (!ollamaManager) {
    ollamaManager = new OllamaManager();
  }
  
  try {
    log.info(`Pulling Ollama model: ${modelName}`);
    
    await ollamaManager.pullModel(modelName, (progress) => {
      if (mainWindow) {
        mainWindow.webContents.send('ollama-pull-progress', progress);
      }
    });
    
    return true;
  } catch (error) {
    log.error('Failed to pull model:', error);
    throw error;
  }
}

async function startExpressServer() {
  return new Promise(async (resolve, reject) => {
    try {
      serverPort = await findAvailablePort(serverPort);
      
      const env = {
        ...process.env,
        PORT: serverPort,
        OLLAMA_HOST: 'http://localhost:11434',
        APP_NAME: store.get('appName', 'Brain Cells'),
        APP_LOGO: store.get('appLogo', '🧠'),
        NODE_ENV: isDev ? 'development' : 'production'
      };
      
      const hfToken = store.get('hfToken');
      if (hfToken) {
        env.HF_TOKEN = hfToken;
      }
      
      // For development, we need to run the aisheets server directly
      if (isDev) {
        const serverPath = path.join(__dirname, '..', 'aisheets');
        process.chdir(serverPath);
        
        expressServerProcess = fork('node_modules/.bin/vite', ['--mode', 'ssr'], {
          env,
          silent: false
        });
      } else {
        // For production, start the server directly in the main process
        log.info('Starting production server...');
        
        try {
          // Set environment variables
          Object.assign(process.env, env);
          
          // Use the server starter module
          const startServer = require('./start-server');
          const server = startServer();
          
          log.info('Production server started successfully');
        } catch (error) {
          log.error('Failed to start production server:', error);
          
          // If direct start fails, show error to user
          dialog.showErrorBox(
            'Server Start Failed',
            `Failed to start the application server.\n\nError: ${error.message}\n\nPlease check the logs for more details.`
          );
          throw error;
        }
      }
      
      if (expressServerProcess) {
        expressServerProcess.on('message', (msg) => {
          log.info('Server message:', msg);
        });
        
        expressServerProcess.on('error', (error) => {
          log.error('Server error:', error);
          reject(error);
        });
      }
      
      // Wait for server to be ready
      setTimeout(() => {
        log.info(`Express server started on port ${serverPort}`);
        resolve();
      }, isDev ? 5000 : 2000);
      
    } catch (error) {
      log.error('Failed to start Express server:', error);
      reject(error);
    }
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  await mainWindow.loadURL(`http://localhost:${serverPort}`);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Dataset',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('new-dataset');
          }
        },
        {
          label: 'Open Dataset',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow.webContents.send('open-dataset');
          }
        },
        {
          label: 'Save Dataset',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('save-dataset');
          }
        },
        { type: 'separator' },
        {
          label: 'Import from Hub',
          click: () => {
            mainWindow.webContents.send('import-from-hub');
          }
        },
        {
          label: 'Export to Hub',
          click: () => {
            mainWindow.webContents.send('export-to-hub');
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Force Reload', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { label: 'Toggle Developer Tools', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: 'Actual Size', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: 'Toggle Fullscreen', accelerator: 'F11', role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Model',
      submenu: [
        {
          label: 'Pull Ollama Model',
          click: async () => {
            const result = await dialog.showMessageBox(mainWindow, {
              type: 'question',
              title: 'Pull Ollama Model',
              message: 'Which model would you like to pull?',
              buttons: ['llama3.2', 'mistral', 'codellama', 'Cancel'],
              defaultId: 0
            });
            
            if (result.response < 3) {
              const models = ['llama3.2', 'mistral', 'codellama'];
              try {
                await pullOllamaModel(models[result.response]);
                dialog.showMessageBox(mainWindow, {
                  type: 'info',
                  title: 'Success',
                  message: `Model ${models[result.response]} pulled successfully!`
                });
              } catch (error) {
                dialog.showErrorBox('Error', `Failed to pull model: ${error.message}`);
              }
            }
          }
        },
        {
          label: 'Check Ollama Status',
          click: async () => {
            const isRunning = await checkOllamaRunning();
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Ollama Status',
              message: isRunning ? 'Ollama is running' : 'Ollama is not running'
            });
          }
        },
        { type: 'separator' },
        {
          label: 'Settings',
          click: () => {
            mainWindow.webContents.send('open-settings');
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: () => {
            shell.openExternal('https://github.com/yourusername/braincells');
          }
        },
        {
          label: 'Report Issue',
          click: () => {
            shell.openExternal('https://github.com/yourusername/braincells/issues');
          }
        },
        { type: 'separator' },
        {
          label: 'About Brain Cells',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Brain Cells',
              message: 'Brain Cells - Intelligent Spreadsheet Automation',
              detail: 'Version 1.0.0\n\nPowered by Ollama and AI\n\n© 2024 Brain Cells Team',
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { label: 'About ' + app.getName(), role: 'about' },
        { type: 'separator' },
        { label: 'Services', role: 'services', submenu: [] },
        { type: 'separator' },
        { label: 'Hide ' + app.getName(), accelerator: 'Command+H', role: 'hide' },
        { label: 'Hide Others', accelerator: 'Command+Shift+H', role: 'hideothers' },
        { label: 'Show All', role: 'unhide' },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'Command+Q', click: () => app.quit() }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-settings', () => {
  return {
    hfToken: store.get('hfToken', ''),
    appName: store.get('appName', 'Brain Cells'),
    appLogo: store.get('appLogo', '🧠'),
    ollamaModel: store.get('ollamaModel', 'llama3.2')
  };
});

ipcMain.handle('save-settings', (event, settings) => {
  Object.keys(settings).forEach(key => {
    store.set(key, settings[key]);
  });
  
  if (settings.hfToken !== undefined) {
    process.env.HF_TOKEN = settings.hfToken;
  }
  if (settings.appName !== undefined) {
    process.env.APP_NAME = settings.appName;
  }
  if (settings.appLogo !== undefined) {
    process.env.APP_LOGO = settings.appLogo;
  }
  
  return true;
});

app.whenReady().then(async () => {
  try {
    log.info('Starting Brain Cells Electron App...');
    
    await startOllama();
    log.info('Ollama started successfully');
    
    await startExpressServer();
    log.info('Express server started successfully');
    
    await createWindow();
    createMenu();
    
    if (!isDev) {
      autoUpdater.checkForUpdatesAndNotify();
    }
    
  } catch (error) {
    log.error('Failed to start application:', error);
    dialog.showErrorBox('Startup Error', `Failed to start application: ${error.message}`);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (ollamaManager) {
    ollamaManager.stop();
  }
  if (expressServerProcess) {
    expressServerProcess.kill();
  }
});

process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  log.error('Unhandled Rejection:', error);
});