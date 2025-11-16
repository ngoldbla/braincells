# Brain Cells Desktop - Tauri Edition

A cross-platform desktop application for AI-powered spreadsheet automation, built with Tauri, Rust, and React.

## Overview

This is a complete rewrite of Brain Cells as a native desktop application using Tauri. It provides:

- **Local AI Support**: Run models locally with Ollama or vLLM
- **Cloud AI Support**: Use OpenAI, Anthropic Claude, or custom OpenAI-compatible APIs
- **Cross-Platform**: Runs on Windows, macOS, and Linux
- **Secure**: Credentials stored securely using Tauri's encrypted store
- **Offline Capable**: Works completely offline with local AI models
- **Fast**: Native performance with Rust backend

## Architecture

```
desktop/
├── src-tauri/          # Rust backend
│   ├── src/
│   │   ├── providers/  # LLM provider implementations
│   │   ├── commands/   # Tauri commands (API)
│   │   ├── utils/      # Cross-platform utilities
│   │   └── lib.rs      # Main entry point
│   └── Cargo.toml
│
├── src/                # React frontend
│   ├── components/
│   │   └── setup-wizard/  # First-run setup wizard
│   ├── stores/         # Zustand state management
│   ├── lib/            # Tauri API wrappers
│   ├── types/          # TypeScript types
│   └── App.tsx         # Main app component
│
└── package.json
```

## Features

### Multi-Provider Support

Choose from multiple AI providers:

- **OpenAI**: GPT-4, GPT-3.5, and other OpenAI models
- **Anthropic**: Claude 3.5 Sonnet, Opus, and Haiku
- **Custom**: Any OpenAI-compatible API endpoint
- **Ollama**: Run models locally (Llama, Mistral, Qwen, etc.)
- **vLLM**: Advanced local inference (planned)

### Setup Wizard

Beautiful first-run experience that guides you through:

1. Welcome screen with feature overview
2. Provider selection (cloud vs. local)
3. Configuration (API keys or local installation)
4. Verification and completion

### Provider Management

- Multiple providers can be configured
- Switch between providers easily
- Test connections before saving
- Secure credential storage

### Cross-Platform

- **Windows**: MSI installer with automatic updates
- **macOS**: DMG for both Intel and Apple Silicon
- **Linux**: AppImage, .deb, and .rpm packages

## Development

### Prerequisites

- **Rust** 1.70+ (install from https://rustup.rs)
- **Node.js** 18+ (install from https://nodejs.org)
- **Platform-specific dependencies**:
  - **Linux**: `sudo apt install libwebkit2gtk-4.0-dev build-essential curl wget file libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev`
  - **macOS**: Xcode Command Line Tools
  - **Windows**: Microsoft C++ Build Tools

### Running in Development

```bash
cd desktop
npm install
npm run tauri dev
```

This will:
1. Start the Vite dev server
2. Compile the Rust backend
3. Launch the application in development mode

### Building for Production

```bash
npm run tauri build
```

This creates platform-specific installers in `src-tauri/target/release/bundle/`

## Provider Setup

### OpenAI

1. Get an API key from https://platform.openai.com/api-keys
2. Select "OpenAI" in the setup wizard
3. Enter your API key
4. Test connection
5. Done!

### Anthropic (Claude)

1. Get an API key from https://console.anthropic.com/
2. Select "Anthropic Claude" in the setup wizard
3. Enter your API key
4. Test connection
5. Done!

### Ollama (Local)

1. The app can install Ollama for you, or you can install manually from https://ollama.ai
2. Select "Local AI (Ollama)" in the setup wizard
3. Choose whether to install automatically or use existing installation
4. Select a model (Llama 3.3, Mistral, etc.)
5. Wait for model download (first time only)
6. Done!

## Security

- API keys are stored using Tauri's encrypted store plugin
- Never transmitted except to the provider you configure
- Local models run entirely offline
- All data stays on your machine

## Configuration

Configuration is stored in:

- **Windows**: `%APPDATA%\BrainCells\`
- **macOS**: `~/Library/Application Support/BrainCells/`
- **Linux**: `~/.local/share/braincells/`

## Troubleshooting

### Ollama won't start

- Check if port 11434 is already in use
- Try running `ollama serve` manually first
- Check system requirements (8GB+ RAM recommended)

### Build fails on Linux

- Make sure you have all system dependencies installed
- Run `sudo apt update && sudo apt install libwebkit2gtk-4.0-dev build-essential`

### API connection fails

- Verify your API key is correct
- Check your internet connection (for cloud providers)
- Ensure the base URL is correct

## Next Steps

The following features from the original Docker version will be migrated:

1. **Spreadsheet Interface**: Port the Qwik spreadsheet UI to React
2. **Database Integration**: Migrate DuckDB and LanceDB to desktop app
3. **Formula System**: Integrate AI-powered formulas
4. **Data Import/Export**: CSV, Excel, JSON support
5. **Web Search**: Integrate web search capabilities
6. **Image Generation**: Add image generation support

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Contributing

This is the next-generation architecture for Brain Cells. The original Docker-based version will be deprecated once feature parity is achieved.
