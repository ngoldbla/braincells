const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getVersion: () => ipcRenderer.invoke('get-app-version'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  
  onNewDataset: (callback) => ipcRenderer.on('new-dataset', callback),
  onOpenDataset: (callback) => ipcRenderer.on('open-dataset', callback),
  onSaveDataset: (callback) => ipcRenderer.on('save-dataset', callback),
  onImportFromHub: (callback) => ipcRenderer.on('import-from-hub', callback),
  onExportToHub: (callback) => ipcRenderer.on('export-to-hub', callback),
  onOpenSettings: (callback) => ipcRenderer.on('open-settings', callback),
  onOllamaPullProgress: (callback) => ipcRenderer.on('ollama-pull-progress', (event, data) => callback(data)),
  
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  
  platform: process.platform,
  isElectron: true
});