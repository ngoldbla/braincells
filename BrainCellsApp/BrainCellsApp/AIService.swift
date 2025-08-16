import Foundation
import SwiftUI

enum AIProvider: String, CaseIterable {
    case ollama = "Ollama (Local)"
    case openai = "OpenAI"
    case anthropic = "Anthropic"
    case huggingface = "Hugging Face"
    case custom = "Custom Endpoint"
    
    var requiresAPIKey: Bool {
        switch self {
        case .ollama:
            return false
        case .openai, .anthropic, .huggingface, .custom:
            return true
        }
    }
}

@MainActor
class AIService: ObservableObject {
    static let shared = AIService()
    
    @Published var currentProvider: AIProvider = .ollama
    @Published var selectedModel: String = ""
    @Published var availableModels: [String] = []
    @Published var isProcessing = false
    @Published var lastError: String?
    
    // API Keys and endpoints
    @AppStorage("openai_api_key") private var openAIKey = ""
    @AppStorage("anthropic_api_key") private var anthropicKey = ""
    @AppStorage("huggingface_token") private var huggingFaceToken = ""
    @AppStorage("custom_endpoint") private var customEndpoint = ""
    @AppStorage("custom_api_key") private var customAPIKey = ""
    @AppStorage("preferred_ollama_model") private var preferredOllamaModel = "llama3.2:latest"
    
    private init() {
        Task {
            await loadAvailableModels()
        }
    }
    
    func loadAvailableModels() async {
        switch currentProvider {
        case .ollama:
            let models = await NetworkService.shared.listOllamaModels()
            await MainActor.run {
                self.availableModels = models.map { $0.name }
                if selectedModel.isEmpty && !availableModels.isEmpty {
                    selectedModel = availableModels.first ?? preferredOllamaModel
                }
            }
            
        case .openai:
            availableModels = ["gpt-4-turbo-preview", "gpt-4", "gpt-3.5-turbo"]
            if selectedModel.isEmpty {
                selectedModel = "gpt-3.5-turbo"
            }
            
        case .anthropic:
            availableModels = ["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"]
            if selectedModel.isEmpty {
                selectedModel = "claude-3-haiku-20240307"
            }
            
        case .huggingface:
            availableModels = [
                "mistralai/Mistral-7B-Instruct-v0.2",
                "google/flan-t5-base",
                "facebook/bart-large-cnn",
                "microsoft/DialoGPT-medium"
            ]
            if selectedModel.isEmpty {
                selectedModel = "mistralai/Mistral-7B-Instruct-v0.2"
            }
            
        case .custom:
            availableModels = ["custom-model"]
            selectedModel = "custom-model"
        }
    }
    
    func processPrompt(_ prompt: String, context: [[String]]? = nil) async -> String {
        isProcessing = true
        lastError = nil
        defer { 
            Task { @MainActor in
                isProcessing = false
            }
        }
        
        // Format context if provided
        var contextString: String? = nil
        if let context = context {
            contextString = context.map { row in
                row.joined(separator: "\t")
            }.joined(separator: "\n")
        }
        
        do {
            switch currentProvider {
            case .ollama:
                return try await processWithOllama(prompt: prompt, context: contextString)
                
            case .openai:
                guard !openAIKey.isEmpty else {
                    throw AIError.missingAPIKey("OpenAI API key is required")
                }
                return try await NetworkService.shared.generateWithOpenAICompatible(
                    prompt: prompt,
                    model: selectedModel,
                    apiKey: openAIKey,
                    endpoint: "https://api.openai.com",
                    context: contextString
                )
                
            case .anthropic:
                guard !anthropicKey.isEmpty else {
                    throw AIError.missingAPIKey("Anthropic API key is required")
                }
                return try await NetworkService.shared.generateWithOpenAICompatible(
                    prompt: prompt,
                    model: selectedModel,
                    apiKey: anthropicKey,
                    endpoint: "https://api.anthropic.com",
                    context: contextString
                )
                
            case .huggingface:
                guard !huggingFaceToken.isEmpty else {
                    throw AIError.missingAPIKey("Hugging Face token is required")
                }
                return try await NetworkService.shared.generateWithHuggingFace(
                    prompt: prompt,
                    model: selectedModel,
                    token: huggingFaceToken,
                    context: contextString
                )
                
            case .custom:
                guard !customEndpoint.isEmpty else {
                    throw AIError.missingAPIKey("Custom endpoint URL is required")
                }
                return try await NetworkService.shared.generateWithOpenAICompatible(
                    prompt: prompt,
                    model: selectedModel,
                    apiKey: customAPIKey.isEmpty ? nil : customAPIKey,
                    endpoint: customEndpoint,
                    context: contextString
                )
            }
        } catch {
            await MainActor.run {
                lastError = error.localizedDescription
            }
            return "Error: \(error.localizedDescription)"
        }
    }
    
    private func processWithOllama(prompt: String, context: String?) async throws -> String {
        // First check if Ollama is running
        let isRunning = await NetworkService.shared.checkOllamaStatus()
        guard isRunning else {
            throw AIError.ollamaNotRunning
        }
        
        // Ensure we have models
        if availableModels.isEmpty {
            await loadAvailableModels()
        }
        
        // Use selected model or fallback
        let model = selectedModel.isEmpty ? preferredOllamaModel : selectedModel
        
        return try await NetworkService.shared.generateWithOllama(
            prompt: prompt,
            model: model,
            context: context
        )
    }
    
    func testConnection() async -> (success: Bool, message: String) {
        switch currentProvider {
        case .ollama:
            let isRunning = await NetworkService.shared.checkOllamaStatus()
            if isRunning {
                let models = await NetworkService.shared.listOllamaModels()
                return (true, "Ollama is running with \(models.count) model(s)")
            } else {
                return (false, "Ollama is not running. Please start the Ollama app.")
            }
            
        case .openai:
            if openAIKey.isEmpty {
                return (false, "OpenAI API key is not set")
            }
            return (true, "OpenAI API key is configured")
            
        case .anthropic:
            if anthropicKey.isEmpty {
                return (false, "Anthropic API key is not set")
            }
            return (true, "Anthropic API key is configured")
            
        case .huggingface:
            if huggingFaceToken.isEmpty {
                return (false, "Hugging Face token is not set")
            }
            return (true, "Hugging Face token is configured")
            
        case .custom:
            if customEndpoint.isEmpty {
                return (false, "Custom endpoint is not set")
            }
            return (true, "Custom endpoint is configured: \(customEndpoint)")
        }
    }
}

enum AIError: LocalizedError {
    case ollamaNotRunning
    case missingAPIKey(String)
    case invalidResponse
    case networkError(String)
    
    var errorDescription: String? {
        switch self {
        case .ollamaNotRunning:
            return "Ollama is not running. Please start the Ollama app from your Applications folder."
        case .missingAPIKey(let provider):
            return "\(provider)"
        case .invalidResponse:
            return "Invalid response from AI service"
        case .networkError(let message):
            return "Network error: \(message)"
        }
    }
}

// Type alias for UI compatibility
typealias OllamaModel = OllamaModelInfo

// Singleton OllamaService that uses the new NetworkService  
class OllamaService {
    static let shared = OllamaService()
    
    func checkStatus() async -> OllamaStatus {
        let isRunning = await NetworkService.shared.checkOllamaStatus()
        return isRunning ? .running : .stopped
    }
    
    func start() async {
        // The Ollama Mac app should be started by the user
        // We can't start it programmatically due to sandboxing
    }
    
    func listModels() async -> [OllamaModel] {
        return await NetworkService.shared.listOllamaModels()
    }
    
    func pullModel(_ name: String) async {
        // This would need to be implemented with progress tracking
        print("Pulling model: \(name)")
    }
}