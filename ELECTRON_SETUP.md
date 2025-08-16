# Brain Cells Electron App - Setup & Build Guide

## Overview

This is a native Electron desktop application version of Brain Cells that runs on Windows and macOS without Docker. It uses Ollama directly for AI capabilities.

## Project Structure

```
braincells/
├── aisheets/           # Original web application
│   ├── src/            # Source code
│   ├── dist/           # Built frontend (generated)
│   └── package.json
├── electron-app/       # Electron desktop application
│   ├── main.js         # Main Electron process
│   ├── preload.js      # Preload script for security
│   ├── package.json    # Electron dependencies
│   ├── ollama/         # Ollama integration
│   │   ├── manager.js  # Ollama process management
│   │   └── install-ollama.js  # Auto-installer
│   ├── scripts/        # Build and startup scripts
│   │   ├── start-windows.bat
│   │   ├── start-mac.sh
│   │   └── build.js
│   ├── server/         # Express server for Electron
│   └── assets/         # Icons and resources
└── docker-compose.yml  # Original Docker setup (still available)
```

## Quick Start

### For Users

#### Windows
1. Navigate to `electron-app/scripts/`
2. Double-click `start-windows.bat`
3. Follow prompts to install Ollama if needed
4. The app will start automatically

#### macOS
1. Open Terminal in `electron-app/scripts/`
2. Run `./start-mac.sh`
3. Follow prompts to install Ollama if needed
4. The app will start automatically

### For Developers

#### Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd braincells

# Install dependencies for the web app
cd aisheets
npm install
npm run build

# Install dependencies for Electron
cd ../electron-app
npm install
```

#### Development Mode

```bash
# Start in development mode with hot reload
cd electron-app
npm run dev
```

#### Building for Distribution

```bash
# Build for current platform
cd electron-app
npm run build:win   # For Windows
npm run build:mac   # For macOS

# Or use the build script
node scripts/build.js win   # For Windows
node scripts/build.js mac   # For macOS
node scripts/build.js all   # For all platforms
```

## Features

### Ollama Integration
- **Automatic Installation**: Prompts to install Ollama if not found
- **Model Management**: Download and manage AI models through the UI
- **Direct Integration**: No Docker required, runs natively

### Supported Models
- llama3.2 (default)
- mistral
- codellama
- Any Ollama-compatible model

### Application Features
- Native menu bar integration
- Auto-updater for easy updates
- Local data storage
- Settings persistence
- Cross-platform support (Windows & macOS)

## Configuration

### Environment Variables
The app supports the following environment variables:
- `HF_TOKEN`: Hugging Face API token
- `OPENAI_API_KEY`: OpenAI API key (optional)
- `ANTHROPIC_API_KEY`: Anthropic API key (optional)
- `APP_NAME`: Custom app name
- `APP_LOGO`: Custom app logo/emoji

### Settings Storage
Settings are stored in:
- **Windows**: `%APPDATA%/brain-cells-electron`
- **macOS**: `~/Library/Application Support/brain-cells-electron`

## Distribution

Built applications are located in `electron-app/dist/`:

### Windows
- `Brain Cells Setup.exe` - Installer with auto-update support
- `Brain Cells Portable.exe` - Standalone portable version

### macOS
- `Brain Cells.dmg` - Disk image for easy installation
- `Brain Cells.app` - Application bundle

## Troubleshooting

### Common Issues

#### Ollama not starting
1. Check if Ollama is installed: `ollama --version`
2. Manually install from https://ollama.ai
3. Ensure port 11434 is available

#### Build fails
1. Ensure Node.js 18+ is installed
2. Build frontend first: `cd aisheets && npm run build`
3. Clear node_modules: `rm -rf node_modules && npm install`

#### App won't launch
1. Check logs:
   - Windows: `%APPDATA%/brain-cells-electron/logs`
   - macOS: `~/Library/Logs/brain-cells-electron`
2. Try running in development mode for debugging

### Development Tips

1. **Hot Reload**: Use `npm run dev` for development with hot reload
2. **DevTools**: Press F12 in the app to open Chrome DevTools
3. **Logs**: Check electron-log output for debugging

## Architecture Details

### Main Process (`main.js`)
- Manages application lifecycle
- Creates and controls browser windows
- Handles system integration (menu, tray, etc.)
- Manages Ollama process
- Starts Express server

### Renderer Process
- Runs the Qwik-based web application
- Communicates with main process via IPC
- Has access to Electron APIs through preload script

### Ollama Integration
- Automatic detection and installation
- Process management
- Model downloading and management
- Direct API communication without Docker

### Express Server
- Runs locally within Electron
- Serves the web application
- Handles API requests
- Proxies Ollama requests

## Security

- Context isolation enabled
- Node integration disabled in renderer
- Preload script for secure IPC
- Signed binaries for distribution (requires certificates)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on both Windows and macOS
5. Submit a pull request

## License

MIT

## Support

For issues and questions:
- GitHub Issues: [Report bugs and request features]
- Documentation: Check this guide and README files
- Ollama Support: https://ollama.ai/docs