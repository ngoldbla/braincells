# Brain Cells

**AI-powered spreadsheet automation running entirely on your computer.**

## Installation

### 1. Download

Go to [Releases](https://github.com/ngoldbla/braincells/releases) and download the installer for your platform:

- **Mac**: Download the `.dmg` file
- **Windows**: Download the `.msi` file
- **Linux**: Download the `.AppImage`, `.deb`, or `.rpm` file

### 2. Install

- **Mac**: Open the `.dmg` and drag Brain Cells to Applications
- **Windows**: Run the `.msi` installer
- **Linux**: Run the AppImage or install the `.deb`/`.rpm` package

### 3. Run

Launch Brain Cells from your Applications folder or Start menu.

That's it!

## What Can You Do?

- Generate content from prompts ("Write product descriptions for these items")
- Extract information ("Pull email addresses from this text")
- Translate text ("Translate to Spanish")
- Analyze data ("Categorize these reviews as positive/negative")
- Clean data ("Standardize these phone numbers")

## AI Providers

Brain Cells supports multiple AI providers:

- **Local**: Install Ollama for completely offline AI (the app can install it for you)
- **OpenAI**: Use GPT-4 and GPT-3.5 models
- **Anthropic**: Use Claude models

Configure your preferred provider on first launch.

## For Developers: Creating a Release

To build and publish new executables:

1. **Merge changes** - Merge your PR into the main branch on GitHub
2. **Create a release** - Go to GitHub → Releases → "Draft a new release"
3. **Create tag** - Click "Choose a tag" → Type `v0.1.0` (or your version) → "Create new tag on publish"
4. **Publish** - Click "Publish release"

This automatically triggers the GitHub Actions workflow to build executables for all platforms (Mac, Windows, Linux). The installers will be attached to the release once the build completes.

## License

MIT License - See [LICENSE](LICENSE)

Built on [Hugging Face AI Sheets](https://huggingface.co/spaces/HuggingFace/ai-sheets) and [Ollama](https://ollama.ai).
