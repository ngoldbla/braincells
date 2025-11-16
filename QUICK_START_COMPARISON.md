# Brain Cells Quick Start Comparison

## 🚀 Which Version Should I Use?

### Web Application (Docker) - **Recommended for Current Use**

**Use this if you want:**
- ✅ Complete, production-ready AI spreadsheet **today**
- ✅ All features working (spreadsheet, AI, database, web search)
- ✅ Familiar Docker setup
- ✅ Easy deployment on servers

**Quick Start:**
```bash
git clone https://github.com/ngoldbla/braincells.git
cd braincells
./start.sh  # Mac/Linux
# or
start-windows.bat  # Windows
```

**System Requirements:**
- Docker Desktop
- 20GB+ disk space
- 8GB+ RAM

---

### Desktop Application (Tauri) - **Future Native Experience**

**Use this if you want:**
- ✅ Native desktop performance
- ✅ Multi-provider LLM setup (OpenAI, Anthropic, Ollama, vLLM)
- ✅ No Docker dependency
- ✅ Smaller footprint (~3MB vs ~100MB)
- ⚠️ **Note**: Spreadsheet UI not yet migrated (in progress)

**Quick Start:**
```bash
cd braincells/desktop
npm install
npm run tauri dev
```

**System Requirements:**
- Rust toolchain
- Node.js 18+
- 4GB+ RAM

**Current Status:**
- ✅ LLM providers: **100% complete**
- ✅ Setup wizard: **100% complete**
- ✅ Security & credentials: **100% complete**
- ⚙️ Spreadsheet UI: **0% complete** (migration in progress)
- ⚙️ Database integration: **0% complete**
- ⚙️ vLLM provider: **30% complete** (structure exists)

---

## 🔄 Feature Comparison

| Feature | Web App | Desktop App |
|---------|---------|-------------|
| **AI Spreadsheet** | ✅ Full | ⚙️ In Progress |
| **OpenAI Integration** | ✅ Yes | ✅ Yes |
| **Anthropic Claude** | ✅ Yes | ✅ Yes |
| **Ollama (Local)** | ✅ Yes | ✅ Yes |
| **vLLM (Local)** | ❌ No | ⚙️ Partial |
| **DuckDB** | ✅ Yes | ⚙️ Planned |
| **LanceDB** | ✅ Yes | ⚙️ Planned |
| **Web Search** | ✅ Yes | ⚙️ Planned |
| **Image Generation** | ✅ Yes | ⚙️ Planned |
| **Import/Export** | ✅ Yes | ⚙️ Planned |
| **Setup Wizard** | ❌ No | ✅ Yes |
| **Multi-Provider UI** | ❌ No | ✅ Yes |
| **Native Performance** | ❌ No | ✅ Yes |
| **Auto-Updates** | ❌ N/A | ⚙️ Planned |
| **Offline-First** | ⚠️ Partial | ✅ Yes |

**Legend:**
- ✅ Complete & Working
- ⚙️ In Progress / Planned
- ❌ Not Available

---

## 🎯 Recommended Path

### For Immediate Use
1. **Start with Web App** - It's production-ready today
2. **Try Desktop App** - Experience the new multi-provider setup wizard
3. **Monitor Progress** - Watch for desktop app feature parity

### For Contributors
1. **Review [ROBUSTNESS_ROADMAP.md](ROBUSTNESS_ROADMAP.md)** - Comprehensive implementation plan
2. **Check [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - What's been built
3. **Read [desktop/MIGRATION_GUIDE.md](desktop/MIGRATION_GUIDE.md)** - Migration strategy

---

## 📅 Timeline to Desktop App Parity

Based on the [ROBUSTNESS_ROADMAP.md](ROBUSTNESS_ROADMAP.md):

| Phase | Feature | ETA | Priority |
|-------|---------|-----|----------|
| 1 | Enhanced Configuration | 1-2 weeks | High |
| 2 | vLLM Integration | 1-2 weeks | High |
| 3 | Provider Management | 1 week | Medium |
| 4 | Database Integration | 1-2 weeks | High |
| 5 | Spreadsheet UI | 2-3 weeks | High |
| 6 | Offline-First | 1-2 weeks | Medium |
| 7 | Cross-Platform Polish | 1-2 weeks | High |
| 8 | Advanced Features | 1-2 weeks | Low |

**Estimated Total**: 10-16 weeks to full parity

**Most Critical for MVP:**
- ✅ Phase 1: Enhanced Configuration (70% done)
- ⚙️ Phase 2: vLLM Integration (0% done)
- ⚙️ Phase 4: Database Integration (0% done)
- ⚙️ Phase 5: Spreadsheet UI (0% done)

---

## 🛠️ Developer Quick Reference

### Running Web App
```bash
# Development
cd braincells
docker compose up -d

# Access at http://localhost:3000

# View logs
docker compose logs -f braincells
docker compose logs -f ollama

# Stop
docker compose down
```

### Running Desktop App
```bash
# Development
cd braincells/desktop
npm install
npm run tauri dev

# Build for production
npm run tauri build

# Output: src-tauri/target/release/bundle/
```

### Environment Variables

**Web App (.env):**
```bash
HF_TOKEN=hf_xxxxx              # Hugging Face
OPENAI_API_KEY=sk-xxxxx        # OpenAI
ANTHROPIC_API_KEY=sk-ant-xxxxx # Anthropic
OLLAMA_HOST=http://ollama:11434
```

**Desktop App (managed in UI):**
- Credentials stored in OS keychain
- Configured via Setup Wizard
- Settings UI for modifications

---

## 🔐 Security Comparison

| Aspect | Web App | Desktop App |
|--------|---------|-------------|
| **Credential Storage** | ENV files | OS Keychain (encrypted) |
| **Data Privacy** | Docker volumes | Native file system |
| **Network Isolation** | Docker network | Tauri scoped HTTP |
| **Process Isolation** | Containers | OS sandboxing |
| **Auto-Updates** | Manual rebuild | Tauri updater |
| **Code Signing** | N/A | Platform-specific certs |

---

## 💡 Key Advantages of Each

### Web App Strengths
1. **Complete Feature Set** - Everything works today
2. **Easy Deployment** - One command setup
3. **Consistent Environment** - Docker ensures reproducibility
4. **Server-Ready** - Can deploy to remote servers
5. **Team Familiar** - Most of codebase here

### Desktop App Strengths
1. **Native Performance** - 10-100x faster backend (Rust)
2. **Smaller Footprint** - ~3MB vs Docker's ~GB
3. **Better UX** - Native OS integration, notifications, etc.
4. **Multi-Provider UI** - Beautiful setup wizard
5. **Offline-First** - Works without internet
6. **Auto-Updates** - Tauri built-in updater
7. **Secure by Default** - OS keychain, sandboxing

---

## 🎯 Next Steps

### If You're a User
1. **Use Web App** for production work today
2. **Test Desktop App** to provide feedback on setup wizard
3. **Star the repo** to track progress

### If You're a Contributor
1. **Read [ROBUSTNESS_ROADMAP.md](ROBUSTNESS_ROADMAP.md)** for systematic implementation plan
2. **Pick a phase** from the roadmap that interests you
3. **Open an issue** to discuss your contribution
4. **Submit a PR** - all help welcome!

### Priority Contributions Needed
- 🔴 **High Priority**: vLLM provider implementation
- 🔴 **High Priority**: Spreadsheet UI migration to React
- 🔴 **High Priority**: Database integration (DuckDB + LanceDB)
- 🟡 **Medium Priority**: Enhanced provider health monitoring
- 🟡 **Medium Priority**: Offline-first work queue

---

## 📞 Support & Questions

- **Issues**: [github.com/ngoldbla/braincells/issues](https://github.com/ngoldbla/braincells/issues)
- **Discussions**: [github.com/ngoldbla/braincells/discussions](https://github.com/ngoldbla/braincells/discussions)
- **Documentation**: See links in main [README.md](README.md)

---

**Last Updated**: 2025-11-16
**Version**: Web App v1.0 (stable), Desktop App v0.1.0 (alpha)
