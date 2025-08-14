# 🦅 KSU Office of Research - AI Data Workbench

<div align="center">
  <img src="https://www.kennesaw.edu/_resources/images/global/logo-large.png" alt="Kennesaw State University" width="300">
  
  **Office of Research**
  
  *Advancing Research Through AI Innovation*
</div>

---

## 🛠️ AI-Powered Research Infrastructure

A comprehensive Docker Compose stack developed by the **Kennesaw State University Office of Research** that transforms your research workstation into an **AI-powered data laboratory**.

### 👥 Meet Our Elite Research Team

<div align="center">
  <img src="research-team.png" alt="KSU Research Team in Action" width="600">
  
  *Our dedicated research team demonstrating proper collaborative debugging posture*
</div>

When your code works on the first try, this is how the entire Office of Research celebrates. Join us in advancing AI research with style!

### 🎯 Core Services

| Service  | What it does | Default URL |
|----------|--------------|-------------|
| **AI Sheets** | Low-code spreadsheet UI for prompting, cleaning & enriching data with any LLM | <http://localhost:3000> |
| **Ollama**    | Local model runner – completely offline if you want | <http://localhost:11434> (REST) |
| **Crawl4AI** | Fast website crawler/ scraper ready for RAG pipelines | CLI in the `crawl4ai` container |

---

## ✨ Research-Ready Features

* **🔑 Flexible API Integration** – Seamlessly works with Hugging Face, OpenAI, Anthropic, and other research-grade LLM providers
* **🎯 Hardware-Optimized Models** – Select from our curated model collection tailored to your research workstation's capabilities
* **🚀 Zero-Configuration Deployment** – Pre-configured Docker stack optimized for research environments on Windows/macOS/Linux
* **🔒 Data Privacy First** – Complete offline capability for sensitive research data, ensuring FERPA and IRB compliance
* **📊 Research Collaboration** – Share configurations and workflows with your research team

---

## 🚀 Quick Start for KSU Researchers

> **Prerequisites for Research Workstations**
> * Docker Desktop **v24+** (Windows/macOS) or Docker Engine (Linux)
> * ~15 GB free disk space (for AI models)
> * KSU network access or VPN connection (for initial setup)
> * Optional: NVIDIA GPU for accelerated inference

```bash
# 1. Clone the KSU Research repository
 git clone https://github.com/ksu-research/ai-data-workbench.git
 cd ai-data-workbench

# 2. Copy env template and edit values
 cp .env.template .env
 $EDITOR .env   # or open with VS Code / Notepad / TextEdit

# 3. Fire it up 🚀
 docker compose up -d

# 4. Open your browser
 open http://localhost:3000   # macOS
 start http://localhost:3000  # Windows PowerShell
```

First load may take several minutes while Docker pulls images **and** Ollama downloads the model you selected.

---

## ⚙️ Research Environment Configuration (.env)

Configure your research environment by creating a `.env` file (step 2 above). The KSU Office of Research provides template configurations for common research scenarios.

```ini
# === KSU Research Configuration ===
# Contact research@kennesaw.edu for institutional tokens

# === Mandatory ===
HF_TOKEN=           # Institutional or personal token from https://huggingface.co/settings/tokens

# === Optional cloud providers ===
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
# or another Inference Endpoint:  MODEL_ENDPOINT_URL=https://....

# === Local model ===
# Pick ONE from the table below. Larger models need more RAM/VRAM.
OLLAMA_MODEL=gpt-oss:20b
```

### Model Selection Guide for Research Applications

| `OLLAMA_MODEL` value | VRAM / RAM needed | Research Use Cases |
|----------------------|-------------------|-------|
| `phi:2.7b`           | 4 GB              | Quick data annotation, basic text classification |
| `gemma:2b`           | 6 GB              | Literature review assistance, creative text generation |
| `mistral:7b`         | 8 GB              | Research paper summarization, data analysis |
| `gpt-oss:20b` (default) | 12–14 GB        | Advanced NLP tasks, comprehensive research assistance |
| `gpt-oss:120b`       | 30–40 GB          | State-of-the-art performance for complex research tasks |

If you don’t want any local model (e.g. you’ll use OpenAI), set `DISABLE_OLLAMA=true`.

### Cloud only?

Just leave `OLLAMA_MODEL` blank **and** supply one of:

* `HF_TOKEN` – runs via Hugging Face Inference Endpoints (pay-as-you-go)
* `OPENAI_API_KEY` – uses OpenAI Chat Completions
* `ANTHROPIC_API_KEY` – uses Claude models

AI Sheets automatically picks the first available backend.

---

## 🖥️ Platform-Specific Guidelines for Research Workstations

### Windows 11/10

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop) and enable **WSL 2 backend**.
2. Run the commands in *PowerShell*.
3. To open the app after boot: `docker compose start`.

### macOS (Apple Silicon & Intel)

* Docker Desktop handles multi-arch images – the stack ships `linux/arm64` & `linux/amd64`.
* Use `brew install ollama` if you ever want to run Ollama outside Docker.

### Linux

* Any recent distro with Docker Engine works.
* Add your user to `docker` group to avoid `sudo` each time.

---

## 🛠️ Research Workflow Integration

### AI Sheets for Data Analysis

1. Visit `http://localhost:3000`.
2. Click **⚙ Settings → Keys** to paste additional API keys any time.
3. Create or upload a CSV, then type a prompt in a new column, hit **▶ Run**.

### Crawl4AI for Web Data Collection

Open a shell in the container:

```bash
docker compose exec crawl4ai bash
# example crawl
crwl https://docs.python.org --deep-crawl bfs --max-pages 20 --output markdown
```

Results appear under `./data` inside the container (mount volumes if you need persistence).

### Direct Model API Access for Custom Research Applications

```bash
curl -s http://localhost:11434/api/generate -d '{"model":"gpt-oss:20b","prompt":"Hello"}' | jq -r .response
```

---

## 🤖 Advanced Research Configuration & Support

* **Port Configuration** – Modify `docker-compose.yml` for lab network requirements
* **Memory Optimization** – Select appropriate models based on available hardware resources
* **Authentication Issues** – Contact research@kennesaw.edu for institutional token support
* **System Updates** – Run `docker compose pull && docker compose up -d` for latest research tools
* **Technical Support** – KSU researchers can contact the Office of Research IT support team

---

## 📄 License & Attribution

**MIT License** – Open for research collaboration and academic use

Developed and maintained by the **Kennesaw State University Office of Research**

### 🎓 Academic Citation

If you use this workbench in your research, please cite:

```bibtex
@software{ksu_ai_workbench_2024,
  title = {KSU AI Data Workbench},
  author = {Kennesaw State University Office of Research},
  year = {2024},
  url = {https://github.com/ksu-research/ai-data-workbench}
}
```

### 📧 Contact

**Office of Research**  
Kennesaw State University  
Email: research@kennesaw.edu  
Web: https://research.kennesaw.edu

---

<div align="center">
  <strong>Advancing Research Through AI Innovation</strong><br>
  Kennesaw State University • Office of Research
</div>
