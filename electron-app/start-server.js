// Production server starter for Electron app
const path = require('path');
const log = require('electron-log');
const { app } = require('electron');

function startServer() {
  try {
    // Set up environment
    const PORT = process.env.PORT || 3000;
    
    log.info('Starting production server...');
    log.info('App path:', app.getAppPath());
    log.info('Resources path:', process.resourcesPath);
    log.info('Port:', PORT);
    
    // In production, files are in the resources folder
    const resourcesPath = process.resourcesPath;
    
    // Try to find and start the server
    const possiblePaths = [
      // Production paths (in resources folder)
      path.join(resourcesPath, 'aisheets', 'server', 'entry.express.js'),
      path.join(resourcesPath, 'app', 'aisheets', 'server', 'entry.express.js'),
      path.join(resourcesPath, 'app.asar', 'aisheets', 'server', 'entry.express.js'),
      // Development fallback paths
      path.join(__dirname, '..', 'aisheets', 'server', 'entry.express.js'),
      path.join(__dirname, 'aisheets', 'server', 'entry.express.js'),
    ];
    
    let serverModule = null;
    let serverPath = null;
    
    for (const tryPath of possiblePaths) {
      try {
        require.resolve(tryPath);
        serverPath = tryPath;
        log.info(`Found server at: ${tryPath}`);
        break;
      } catch (e) {
        log.info(`Server not found at: ${tryPath}`);
      }
    }
    
    if (serverPath) {
      log.info(`Loading server from: ${serverPath}`);
      
      // Change to the aisheets directory for proper relative paths
      const aisheetsDir = path.join(path.dirname(serverPath), '..');
      
      // Set the NODE_PATH to include aisheets node_modules
      const aisheetsNodeModules = path.join(aisheetsDir, 'node_modules');
      process.env.NODE_PATH = aisheetsNodeModules;
      require('module').Module._initPaths();
      
      process.chdir(aisheetsDir);
      log.info(`Changed working directory to: ${aisheetsDir}`);
      log.info(`NODE_PATH set to: ${aisheetsNodeModules}`);
      
      // Load and start the server
      serverModule = require(serverPath);
      log.info('Server module loaded successfully');
    } else {
      // Log all tried paths for debugging
      log.error('Could not find server entry file in any of these locations:');
      possiblePaths.forEach(p => log.error(`  - ${p}`));
      throw new Error('Could not find server entry file in any expected location');
    }
    
    return serverModule;
  } catch (error) {
    log.error('Failed to start server:', error);
    log.error('Stack trace:', error.stack);
    throw error;
  }
}

module.exports = startServer;