import SwiftUI

struct SpreadsheetView: View {
    @StateObject private var aiService = AIService.shared
    @State private var cells: [[String]] = Array(repeating: Array(repeating: "", count: 10), count: 20)
    @State private var selectedCell: (row: Int, col: Int)? = nil
    @State private var selectedRange: ((start: (row: Int, col: Int), end: (row: Int, col: Int)))? = nil
    @State private var showPromptPanel = false
    @State private var currentPrompt = ""
    @State private var showSettings = false
    @State private var errorMessage: String?
    @State private var isProcessing = false
    
    var body: some View {
        VStack(spacing: 0) {
            // Toolbar
            HStack {
                Button(action: { importData() }) {
                    Label("Import", systemImage: "square.and.arrow.down")
                }
                
                Button(action: { exportData() }) {
                    Label("Export", systemImage: "square.and.arrow.up")
                }
                
                Divider()
                    .frame(height: 20)
                
                // AI Provider Selector
                Picker("AI Provider", selection: $aiService.currentProvider) {
                    ForEach(AIProvider.allCases, id: \.self) { provider in
                        Text(provider.rawValue).tag(provider)
                    }
                }
                .pickerStyle(MenuPickerStyle())
                .frame(width: 150)
                .onChange(of: aiService.currentProvider) { _ in
                    Task {
                        await aiService.loadAvailableModels()
                    }
                }
                
                // Model Selector
                if !aiService.availableModels.isEmpty {
                    Picker("Model", selection: $aiService.selectedModel) {
                        ForEach(aiService.availableModels, id: \.self) { model in
                            Text(modelDisplayName(model)).tag(model)
                        }
                    }
                    .pickerStyle(MenuPickerStyle())
                    .frame(width: 200)
                }
                
                Button(action: { showSettings.toggle() }) {
                    Image(systemName: "gear")
                }
                
                Divider()
                    .frame(height: 20)
                
                Button(action: { showPromptPanel.toggle() }) {
                    Label("AI Prompt", systemImage: "sparkles")
                }
                .buttonStyle(.borderedProminent)
                .disabled(selectedCell == nil && selectedRange == nil)
                
                Spacer()
                
                // Status Indicator
                if isProcessing {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle())
                        .scaleEffect(0.7)
                }
                
                ConnectionStatusView()
            }
            .padding()
            .background(Color(NSColor.windowBackgroundColor))
            
            // Spreadsheet Grid
            ScrollView([.horizontal, .vertical]) {
                VStack(spacing: 0) {
                    // Header Row
                    HStack(spacing: 0) {
                        Rectangle()
                            .fill(Color.gray.opacity(0.2))
                            .frame(width: 50, height: 30)
                        
                        ForEach(0..<10, id: \.self) { col in
                            Text(columnName(col))
                                .font(.system(.body, design: .monospaced))
                                .frame(width: 100, height: 30)
                                .background(Color.gray.opacity(0.2))
                                .border(Color.gray.opacity(0.3), width: 0.5)
                        }
                    }
                    
                    // Data Rows
                    ForEach(0..<20, id: \.self) { row in
                        HStack(spacing: 0) {
                            Text("\(row + 1)")
                                .font(.system(.body, design: .monospaced))
                                .foregroundColor(.secondary)
                                .frame(width: 50, height: 30)
                                .background(Color.gray.opacity(0.2))
                                .border(Color.gray.opacity(0.3), width: 0.5)
                            
                            ForEach(0..<10, id: \.self) { col in
                                CellView(
                                    content: $cells[row][col],
                                    isSelected: isSelected(row: row, col: col),
                                    isInRange: isInRange(row: row, col: col),
                                    onTap: {
                                        selectCell(row: row, col: col)
                                    }
                                )
                            }
                        }
                    }
                }
            }
            .background(Color(NSColor.textBackgroundColor))
            
            // Prompt Panel
            if showPromptPanel {
                PromptPanelView(
                    prompt: $currentPrompt,
                    isProcessing: $isProcessing,
                    onExecute: { executePrompt() },
                    onCancel: { 
                        showPromptPanel = false
                        currentPrompt = ""
                    }
                )
            }
            
            // Error Message
            if let error = errorMessage {
                HStack {
                    Image(systemName: "exclamationmark.triangle")
                        .foregroundColor(.orange)
                    Text(error)
                        .foregroundColor(.secondary)
                    Spacer()
                    Button("Dismiss") {
                        errorMessage = nil
                    }
                }
                .padding()
                .background(Color.orange.opacity(0.1))
            }
        }
        .sheet(isPresented: $showSettings) {
            SettingsView()
        }
    }
    
    private func columnName(_ index: Int) -> String {
        let letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        return String(letters[letters.index(letters.startIndex, offsetBy: index)])
    }
    
    private func modelDisplayName(_ model: String) -> String {
        // Simplify long model names for display
        if model.contains("/") {
            return model.components(separatedBy: "/").last ?? model
        }
        return model
    }
    
    private func selectCell(row: Int, col: Int) {
        if NSEvent.modifierFlags.contains(.shift), let selected = selectedCell {
            // Range selection with Shift
            selectedRange = (
                start: (row: min(selected.row, row), col: min(selected.col, col)),
                end: (row: max(selected.row, row), col: max(selected.col, col))
            )
        } else {
            selectedCell = (row, col)
            selectedRange = nil
        }
    }
    
    private func isSelected(row: Int, col: Int) -> Bool {
        return selectedCell?.row == row && selectedCell?.col == col
    }
    
    private func isInRange(row: Int, col: Int) -> Bool {
        guard let range = selectedRange else { return false }
        return row >= range.start.row && row <= range.end.row &&
               col >= range.start.col && col <= range.end.col
    }
    
    private func executePrompt() {
        guard !currentPrompt.isEmpty else { return }
        
        isProcessing = true
        errorMessage = nil
        
        Task {
            defer {
                isProcessing = false
            }
            
            // Gather context from surrounding cells
            let context = gatherContext()
            
            // Process with AI
            let result = await aiService.processPrompt(currentPrompt, context: context)
            
            // Apply results to selected cells
            await MainActor.run {
                if result.hasPrefix("Error:") {
                    errorMessage = result
                } else {
                    applyResult(result)
                    showPromptPanel = false
                    currentPrompt = ""
                }
            }
        }
    }
    
    private func gatherContext() -> [[String]] {
        var context: [[String]] = []
        
        if let range = selectedRange {
            for row in range.start.row...range.end.row {
                var rowData: [String] = []
                for col in range.start.col...range.end.col {
                    rowData.append(cells[row][col])
                }
                context.append(rowData)
            }
        } else if let selected = selectedCell {
            // Get 3x3 grid around selected cell
            let startRow = max(0, selected.row - 1)
            let endRow = min(19, selected.row + 1)
            let startCol = max(0, selected.col - 1)
            let endCol = min(9, selected.col + 1)
            
            for row in startRow...endRow {
                var rowData: [String] = []
                for col in startCol...endCol {
                    rowData.append(cells[row][col])
                }
                context.append(rowData)
            }
        }
        
        return context
    }
    
    private func applyResult(_ result: String) {
        if let range = selectedRange {
            // Apply to range - split result by lines and tabs
            let lines = result.components(separatedBy: "\n")
            var lineIndex = 0
            
            for row in range.start.row...range.end.row {
                if lineIndex >= lines.count { break }
                let values = lines[lineIndex].components(separatedBy: "\t")
                var valueIndex = 0
                
                for col in range.start.col...range.end.col {
                    if valueIndex < values.count {
                        cells[row][col] = values[valueIndex]
                        valueIndex += 1
                    } else {
                        cells[row][col] = lines[lineIndex]
                    }
                }
                lineIndex += 1
            }
        } else if let selected = selectedCell {
            // Apply to single cell
            cells[selected.row][selected.col] = result
        }
    }
    
    private func importData() {
        // TODO: Implement CSV import
        print("Import data")
    }
    
    private func exportData() {
        // TODO: Implement CSV export
        print("Export data")
    }
}

struct CellView: View {
    @Binding var content: String
    let isSelected: Bool
    let isInRange: Bool
    let onTap: () -> Void
    
    var body: some View {
        TextField("", text: $content)
            .textFieldStyle(.plain)
            .font(.system(.body))
            .padding(.horizontal, 4)
            .frame(width: 100, height: 30)
            .background(backgroundColor)
            .border(borderColor, width: borderWidth)
            .onTapGesture {
                onTap()
            }
    }
    
    private var backgroundColor: Color {
        if isSelected {
            return Color.accentColor.opacity(0.2)
        } else if isInRange {
            return Color.accentColor.opacity(0.1)
        } else {
            return Color.white
        }
    }
    
    private var borderColor: Color {
        if isSelected {
            return Color.accentColor
        } else {
            return Color.gray.opacity(0.3)
        }
    }
    
    private var borderWidth: CGFloat {
        isSelected ? 2 : 0.5
    }
}

struct PromptPanelView: View {
    @Binding var prompt: String
    @Binding var isProcessing: Bool
    let onExecute: () -> Void
    let onCancel: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "sparkles")
                    .foregroundColor(.accentColor)
                Text("AI Prompt")
                    .font(.headline)
                Spacer()
            }
            
            Text("Describe what you want to do with the selected cells:")
                .font(.caption)
                .foregroundColor(.secondary)
            
            TextEditor(text: $prompt)
                .font(.system(.body, design: .monospaced))
                .frame(height: 80)
                .border(Color.gray.opacity(0.3))
                .disabled(isProcessing)
            
            // Examples
            VStack(alignment: .leading, spacing: 4) {
                Text("Examples:")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                ForEach([
                    "Extract email addresses from this text",
                    "Translate these items to Spanish",
                    "Categorize as positive, negative, or neutral",
                    "Generate product descriptions",
                    "Clean and format phone numbers"
                ], id: \.self) { example in
                    Button(action: { prompt = example }) {
                        Text("• \(example)")
                            .font(.caption)
                            .foregroundColor(.blue)
                    }
                    .buttonStyle(.plain)
                    .disabled(isProcessing)
                }
            }
            
            HStack {
                Spacer()
                
                Button("Cancel", action: onCancel)
                    .disabled(isProcessing)
                
                Button("Execute") {
                    onExecute()
                }
                .buttonStyle(.borderedProminent)
                .disabled(prompt.isEmpty || isProcessing)
                
                if isProcessing {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle())
                        .scaleEffect(0.7)
                }
            }
        }
        .padding()
        .background(Color(NSColor.windowBackgroundColor))
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(Color.gray.opacity(0.3), lineWidth: 1)
        )
    }
}

struct ConnectionStatusView: View {
    @StateObject private var aiService = AIService.shared
    @State private var status: (success: Bool, message: String) = (false, "Checking...")
    
    var body: some View {
        HStack {
            Circle()
                .fill(status.success ? Color.green : Color.orange)
                .frame(width: 8, height: 8)
            
            Text(status.message)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .onAppear {
            checkConnection()
        }
        .onChange(of: aiService.currentProvider) { _ in
            checkConnection()
        }
    }
    
    private func checkConnection() {
        Task {
            let result = await aiService.testConnection()
            await MainActor.run {
                status = result
            }
        }
    }
}

struct SettingsView: View {
    @AppStorage("openai_api_key") private var openAIKey = ""
    @AppStorage("anthropic_api_key") private var anthropicKey = ""
    @AppStorage("huggingface_token") private var huggingFaceToken = ""
    @AppStorage("custom_endpoint") private var customEndpoint = ""
    @AppStorage("custom_api_key") private var customAPIKey = ""
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("AI Provider Settings")
                .font(.largeTitle)
                .bold()
            
            Form {
                Section("OpenAI") {
                    SecureField("API Key", text: $openAIKey)
                    Link("Get API Key", destination: URL(string: "https://platform.openai.com/api-keys")!)
                }
                
                Section("Anthropic") {
                    SecureField("API Key", text: $anthropicKey)
                    Link("Get API Key", destination: URL(string: "https://console.anthropic.com/")!)
                }
                
                Section("Hugging Face") {
                    SecureField("Access Token", text: $huggingFaceToken)
                    Link("Get Token", destination: URL(string: "https://huggingface.co/settings/tokens")!)
                }
                
                Section("Custom OpenAI-Compatible Endpoint") {
                    TextField("Endpoint URL", text: $customEndpoint)
                        .textFieldStyle(.roundedBorder)
                    SecureField("API Key (optional)", text: $customAPIKey)
                        .textFieldStyle(.roundedBorder)
                }
            }
            .formStyle(.grouped)
            
            HStack {
                Spacer()
                Button("Done") {
                    dismiss()
                }
                .buttonStyle(.borderedProminent)
            }
        }
        .padding()
        .frame(width: 500, height: 400)
    }
}