const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process
// to communicate with the main process
contextBridge.exposeInMainWorld('electronAPI', {
  // System information
  platform: process.platform,
  arch: process.arch,
  version: process.versions.electron,
  
  // IPC communication
  send: (channel, data) => {
    const validChannels = [
      'menu:new-dataset',
      'menu:open-dataset',
      'menu:import-csv',
      'menu:import-excel',
      'menu:import-json',
      'menu:export-csv',
      'menu:export-excel',
      'menu:export-json',
      'show:model-settings',
      'show:model-downloader',
      'show:api-settings'
    ];
    
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  
  receive: (channel, callback) => {
    const validChannels = [
      'menu:new-dataset',
      'menu:open-dataset',
      'menu:import-csv',
      'menu:import-excel',
      'menu:import-json',
      'menu:export-csv',
      'menu:export-excel',
      'menu:export-json',
      'show:model-settings',
      'show:model-downloader',
      'show:api-settings',
      'model:download:start',
      'model:download:progress',
      'model:download:complete',
      'model:download:error'
    ];
    
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },
  
  invoke: async (channel, ...args) => {
    const validChannels = [
      'get-system-status',
      'get-available-models',
      'get-installed-models',
      'download-model',
      'delete-model',
      'get-settings',
      'set-setting',
      'restart-services',
      'backup-database',
      'restore-database'
    ];
    
    if (validChannels.includes(channel)) {
      return await ipcRenderer.invoke(channel, ...args);
    }
  },
  
  // File operations
  selectFile: async (options = {}) => {
    return await ipcRenderer.invoke('select-file', options);
  },
  
  selectDirectory: async (options = {}) => {
    return await ipcRenderer.invoke('select-directory', options);
  },
  
  saveFile: async (options = {}) => {
    return await ipcRenderer.invoke('save-file', options);
  },
  
  // Application control
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  
  // Update notifications
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', callback);
  },
  
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update-downloaded', callback);
  },
  
  installUpdate: () => {
    ipcRenderer.send('install-update');
  }
});

// Add window controls for custom title bar if needed
window.addEventListener('DOMContentLoaded', () => {
  // Check if we need to add custom window controls
  if (process.platform !== 'darwin') {
    // Add Windows/Linux specific customizations
  }
});