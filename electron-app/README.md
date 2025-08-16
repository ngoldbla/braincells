# Brain Cells - Electron Desktop App

A native desktop application for Brain Cells that runs on Windows and macOS without Docker, using Ollama directly for AI capabilities.

## Features

- 🖥️ Native desktop application for Windows and macOS
- 🤖 Built-in Ollama integration (no Docker required)
- 🔄 Automatic updates
- 📦 Self-contained application bundle
- 🎨 Native menu bar and system integration
- 💾 Local data storage
- 🚀 Fast startup and performance

## Prerequisites

- Node.js 18+ (for development)
- Ollama (will be prompted to install if not present)

## Quick Start

### Windows

1. Double-click `scripts/start-windows.bat`
2. Follow prompts to install Ollama if needed
3. The app will start automatically

### macOS

1. Run `scripts/start-mac.sh`
2. Follow prompts to install Ollama if needed
3. The app will start automatically

## Development

### Setup

```bash
# Install dependencies
cd electron-app
npm install

# Build the frontend
cd ../aisheets
npm install
npm run build

# Start the app in development mode
cd ../electron-app
npm run dev
```

### Building

```bash
# Build for current platform
npm run build:win   # Windows
npm run build:mac   # macOS

# Build for all platforms
npm run build:all
```

## Distribution

Built applications will be in the `dist` folder:

- **Windows**: `Brain Cells Setup.exe` (installer) and `Brain Cells.exe` (portable)
- **macOS**: `Brain Cells.dmg` (disk image) and `Brain Cells.app` (application bundle)

## Architecture

The app consists of:

1. **Electron Main Process** (`main.js`): Manages the application lifecycle, windows, and system integration
2. **Express Server**: Runs the Brain Cells backend locally
3. **Ollama Integration**: Direct integration with Ollama for AI capabilities
4. **Frontend**: The Qwik-based UI from the aisheets folder

## Configuration

The app stores configuration in:
- **Windows**: `%APPDATA%/brain-cells-electron`
- **macOS**: `~/Library/Application Support/brain-cells-electron`

## Ollama Models

The app can automatically download and manage Ollama models:

1. Use the Model menu to pull models
2. Supported models include:
   - llama3.2 (default)
   - mistral
   - codellama
   - And any other Ollama-compatible model

## Troubleshooting

### Ollama not starting

1. Check if Ollama is installed: `ollama --version`
2. If not installed, download from https://ollama.ai
3. Ensure port 11434 is not in use by another application

### App won't start

1. Check Node.js version: `node --version` (should be 18+)
2. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
3. Check logs in:
   - **Windows**: `%APPDATA%/brain-cells-electron/logs`
   - **macOS**: `~/Library/Logs/brain-cells-electron`

### Build issues

1. Ensure all dependencies are installed
2. Build the frontend first: `cd ../aisheets && npm run build`
3. For code signing issues on macOS, see electron-builder documentation

## License

MIT