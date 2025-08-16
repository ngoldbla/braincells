import Foundation

class NetworkService {
    static let shared = NetworkService()
    
    private let session: URLSession = {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 120
        return URLSession(configuration: config)
    }()
    
    private init() {}
    
    // MARK: - Ollama Support
    
    func checkOllamaStatus() async -> Bool {
        // Try the root endpoint first (Ollama Mac app uses this)
        if let url = URL(string: "http://127.0.0.1:11434") {
            do {
                var request = URLRequest(url: url)
                request.httpMethod = "GET"
                request.timeoutInterval = 2.0
                
                let (_, response) = try await session.data(for: request)
                if let httpResponse = response as? HTTPURLResponse,
                   httpResponse.statusCode == 200 {
                    print("Ollama is running at http://127.0.0.1:11434")
                    return true
                }
            } catch {
                // Silent fail, try next method
            }
        }
        
        // Try the /api/version endpoint
        if let url = URL(string: "http://127.0.0.1:11434/api/version") {
            do {
                var request = URLRequest(url: url)
                request.httpMethod = "GET"
                request.timeoutInterval = 2.0
                
                let (data, response) = try await session.data(for: request)
                if let httpResponse = response as? HTTPURLResponse,
                   httpResponse.statusCode == 200 {
                    if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                        print("Ollama version: \(json["version"] ?? "unknown")")
                    }
                    return true
                }
            } catch {
                print("Ollama not detected: \(error.localizedDescription)")
            }
        }
        
        return false
    }
    
    func listOllamaModels() async -> [OllamaModelInfo] {
        guard let url = URL(string: "http://127.0.0.1:11434/api/tags") else { return [] }
        
        do {
            let (data, _) = try await session.data(from: url)
            let decoder = JSONDecoder()
            let response = try decoder.decode(OllamaTagsResponse.self, from: data)
            
            return response.models.map { model in
                OllamaModelInfo(
                    name: model.name,
                    modifiedAt: model.modified_at,
                    size: formatBytes(model.size),
                    digest: model.digest,
                    details: model.details
                )
            }
        } catch {
            print("Failed to fetch Ollama models: \(error)")
            return []
        }
    }
    
    func generateWithOllama(prompt: String, model: String, context: String? = nil) async throws -> String {
        guard let url = URL(string: "http://127.0.0.1:11434/api/generate") else {
            throw NetworkError.invalidURL
        }
        
        var fullPrompt = prompt
        if let context = context {
            fullPrompt = """
            Context:
            \(context)
            
            Task: \(prompt)
            
            Provide a concise response suitable for spreadsheet cells.
            """
        }
        
        let body: [String: Any] = [
            "model": model,
            "prompt": fullPrompt,
            "stream": false,
            "options": [
                "temperature": 0.7,
                "top_p": 0.9
            ]
        ]
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw NetworkError.serverError
        }
        
        if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
           let responseText = json["response"] as? String {
            return responseText.trimmingCharacters(in: .whitespacesAndNewlines)
        }
        
        throw NetworkError.invalidResponse
    }
    
    // MARK: - OpenAI Compatible Endpoints
    
    func generateWithOpenAICompatible(
        prompt: String,
        model: String,
        apiKey: String?,
        endpoint: String,
        context: String? = nil
    ) async throws -> String {
        guard let url = URL(string: "\(endpoint)/v1/chat/completions") else {
            throw NetworkError.invalidURL
        }
        
        var messages: [[String: String]] = []
        
        if let context = context {
            messages.append(["role": "system", "content": "You are a helpful assistant for spreadsheet data processing. Provide concise responses suitable for cells."])
            messages.append(["role": "user", "content": "Context:\n\(context)\n\nTask: \(prompt)"])
        } else {
            messages.append(["role": "user", "content": prompt])
        }
        
        let body: [String: Any] = [
            "model": model,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 500
        ]
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let apiKey = apiKey {
            request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        }
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw NetworkError.serverError
        }
        
        if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
           let choices = json["choices"] as? [[String: Any]],
           let firstChoice = choices.first,
           let message = firstChoice["message"] as? [String: Any],
           let content = message["content"] as? String {
            return content.trimmingCharacters(in: .whitespacesAndNewlines)
        }
        
        throw NetworkError.invalidResponse
    }
    
    // MARK: - Hugging Face Support
    
    func generateWithHuggingFace(
        prompt: String,
        model: String,
        token: String,
        context: String? = nil
    ) async throws -> String {
        guard let url = URL(string: "https://api-inference.huggingface.co/models/\(model)") else {
            throw NetworkError.invalidURL
        }
        
        var fullPrompt = prompt
        if let context = context {
            fullPrompt = "Context: \(context)\n\nTask: \(prompt)"
        }
        
        let body: [String: Any] = [
            "inputs": fullPrompt,
            "parameters": [
                "max_new_tokens": 200,
                "temperature": 0.7,
                "return_full_text": false
            ]
        ]
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.serverError
        }
        
        if httpResponse.statusCode == 503 {
            // Model is loading
            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let estimatedTime = json["estimated_time"] as? Double {
                throw NetworkError.modelLoading(estimatedTime: estimatedTime)
            }
        }
        
        guard httpResponse.statusCode == 200 else {
            throw NetworkError.serverError
        }
        
        // Response can be an array or a single object
        if let jsonArray = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]],
           let firstResult = jsonArray.first,
           let generatedText = firstResult["generated_text"] as? String {
            return generatedText.trimmingCharacters(in: .whitespacesAndNewlines)
        }
        
        if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
           let generatedText = json["generated_text"] as? String {
            return generatedText.trimmingCharacters(in: .whitespacesAndNewlines)
        }
        
        throw NetworkError.invalidResponse
    }
    
    // MARK: - Helper Functions
    
    private func formatBytes(_ bytes: Int) -> String {
        let formatter = ByteCountFormatter()
        formatter.allowedUnits = [.useGB, .useMB]
        formatter.countStyle = .file
        return formatter.string(fromByteCount: Int64(bytes))
    }
}

// MARK: - Data Models

struct OllamaTagsResponse: Codable {
    let models: [OllamaModelResponse]
}

struct OllamaModelResponse: Codable {
    let name: String
    let modified_at: String
    let size: Int
    let digest: String
    let details: OllamaModelDetails?
}

struct OllamaModelDetails: Codable {
    let format: String?
    let family: String?
    let parameter_size: String?
    let quantization_level: String?
}

struct OllamaModelInfo: Identifiable {
    let id = UUID()
    let name: String
    let modifiedAt: String
    let size: String
    let digest: String
    let details: OllamaModelDetails?
    let isDownloaded: Bool = true
}

enum NetworkError: LocalizedError {
    case invalidURL
    case invalidResponse
    case serverNotRunning
    case serverError
    case modelLoading(estimatedTime: Double)
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid response from server"
        case .serverNotRunning:
            return "Server is not running"
        case .serverError:
            return "Server error occurred"
        case .modelLoading(let time):
            return "Model is loading. Estimated time: \(Int(time))s"
        }
    }
}