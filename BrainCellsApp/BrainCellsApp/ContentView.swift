import SwiftUI

struct ContentView: View {
    @State private var selectedTab = 0
    @State private var searchText = ""
    @State private var ollamaStatus: OllamaStatus = .checking
    
    var body: some View {
        NavigationSplitView {
            List(selection: $selectedTab) {
                Section("Workspace") {
                    Label("AI Spreadsheet", systemImage: "tablecells")
                        .tag(0)
                    Label("Data Sources", systemImage: "doc.badge.plus")
                        .tag(1)
                    Label("Templates", systemImage: "doc.text")
                        .tag(2)
                }
                
                Section("AI Models") {
                    HStack {
                        Label("Ollama Models", systemImage: "cpu")
                        Spacer()
                        StatusIndicator(status: ollamaStatus)
                    }
                    .tag(3)
                    
                    Label("Hugging Face", systemImage: "cloud")
                        .tag(4)
                    Label("API Keys", systemImage: "key")
                        .tag(5)
                }
                
                Section("Tools") {
                    Label("Prompts Library", systemImage: "text.bubble")
                        .tag(6)
                    Label("History", systemImage: "clock")
                        .tag(7)
                }
            }
            .listStyle(SidebarListStyle())
            .navigationTitle("🧠 Brain Cells")
            .searchable(text: $searchText)
            .frame(minWidth: 250)
        } detail: {
            DetailView(selectedTab: selectedTab, ollamaStatus: $ollamaStatus)
        }
        .frame(minWidth: 1200, minHeight: 700)
        .onAppear {
            checkOllamaStatus()
        }
    }
    
    func checkOllamaStatus() {
        Task {
            ollamaStatus = await OllamaService.shared.checkStatus()
        }
    }
}

enum OllamaStatus {
    case checking, running, stopped, error
    
    var color: Color {
        switch self {
        case .checking: return .orange
        case .running: return .green
        case .stopped: return .gray
        case .error: return .red
        }
    }
}

struct StatusIndicator: View {
    let status: OllamaStatus
    
    var body: some View {
        Circle()
            .fill(status.color)
            .frame(width: 8, height: 8)
    }
}

struct DetailView: View {
    let selectedTab: Int
    @Binding var ollamaStatus: OllamaStatus
    
    var body: some View {
        VStack {
            switch selectedTab {
            case 0:
                SpreadsheetView()
            case 1:
                DataSourcesView()
            case 2:
                TemplatesView()
            case 3:
                OllamaModelsView(status: $ollamaStatus)
            case 4:
                HuggingFaceView()
            case 5:
                APIKeysView()
            case 6:
                PromptsLibraryView()
            case 7:
                HistoryView()
            default:
                SpreadsheetView()
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// SpreadsheetView is now in a separate file

// Toolbar is now integrated into SpreadsheetView

// Cell components are now in SpreadsheetView.swift

struct OllamaModelsView: View {
    @Binding var status: OllamaStatus
    @State private var models: [OllamaModel] = []
    @State private var isLoading = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            HStack {
                Text("Ollama Models")
                    .font(.largeTitle)
                    .bold()
                
                Spacer()
                
                HStack {
                    Text("Status:")
                    StatusIndicator(status: status)
                    Text(statusText)
                        .foregroundColor(.secondary)
                }
            }
            .padding()
            
            if status == .running {
                List(models) { model in
                    ModelRow(model: model)
                }
            } else {
                VStack(spacing: 20) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.system(size: 50))
                        .foregroundColor(.orange)
                    
                    Text("Ollama is not running")
                        .font(.title2)
                    
                    Text("Please start Ollama to use local AI models")
                        .foregroundColor(.secondary)
                    
                    Button("Start Ollama") {
                        startOllama()
                    }
                    .buttonStyle(.borderedProminent)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .onAppear {
            loadModels()
        }
    }
    
    var statusText: String {
        switch status {
        case .checking: return "Checking..."
        case .running: return "Running"
        case .stopped: return "Stopped"
        case .error: return "Error"
        }
    }
    
    func loadModels() {
        Task {
            models = await OllamaService.shared.listModels()
        }
    }
    
    func startOllama() {
        Task {
            status = .checking
            await OllamaService.shared.start()
            status = await OllamaService.shared.checkStatus()
            loadModels()
        }
    }
}

struct ModelRow: View {
    let model: OllamaModel
    
    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text(model.name)
                    .font(.headline)
                Text(model.size)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            if model.isDownloaded {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.green)
            } else {
                Button("Download") {
                    downloadModel()
                }
            }
        }
        .padding()
    }
    
    func downloadModel() {
        Task {
            await OllamaService.shared.pullModel(model.name)
        }
    }
}

struct DataSourcesView: View {
    var body: some View {
        VStack {
            Text("Data Sources")
                .font(.largeTitle)
                .bold()
            Text("Import data from CSV, Excel, Google Sheets, and more")
                .foregroundColor(.secondary)
            Spacer()
        }
        .padding()
    }
}

struct TemplatesView: View {
    var body: some View {
        VStack {
            Text("Templates")
                .font(.largeTitle)
                .bold()
            Text("Pre-built prompts and workflows")
                .foregroundColor(.secondary)
            Spacer()
        }
        .padding()
    }
}

struct HuggingFaceView: View {
    @State private var token = ""
    
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Hugging Face Integration")
                .font(.largeTitle)
                .bold()
                .padding()
            
            VStack(alignment: .leading) {
                Text("Access thousands of AI models")
                    .font(.headline)
                
                Text("Add your Hugging Face token to unlock cloud models")
                    .foregroundColor(.secondary)
                
                HStack {
                    SecureField("HF Token", text: $token)
                        .textFieldStyle(.roundedBorder)
                        .frame(width: 300)
                    
                    Button("Save") {
                        saveToken()
                    }
                }
            }
            .padding()
            
            Spacer()
        }
    }
    
    func saveToken() {
        UserDefaults.standard.set(token, forKey: "HF_TOKEN")
    }
}

struct APIKeysView: View {
    var body: some View {
        VStack {
            Text("API Keys")
                .font(.largeTitle)
                .bold()
            Text("Configure OpenAI, Anthropic, and other API providers")
                .foregroundColor(.secondary)
            Spacer()
        }
        .padding()
    }
}

struct PromptsLibraryView: View {
    var body: some View {
        VStack {
            Text("Prompts Library")
                .font(.largeTitle)
                .bold()
            Text("Save and reuse your favorite prompts")
                .foregroundColor(.secondary)
            Spacer()
        }
        .padding()
    }
}

struct HistoryView: View {
    var body: some View {
        VStack {
            Text("History")
                .font(.largeTitle)
                .bold()
            Text("View your recent AI operations")
                .foregroundColor(.secondary)
            Spacer()
        }
        .padding()
    }
}

// OllamaModel and OllamaService are defined in AIService.swift

#Preview {
    ContentView()
}