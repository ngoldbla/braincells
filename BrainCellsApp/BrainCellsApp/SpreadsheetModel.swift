import Foundation
import SwiftUI

class SpreadsheetModel: ObservableObject {
    @Published var cells: [[CellData]] = []
    @Published var columns: [Column] = []
    @Published var selectedCell: CellPosition?
    @Published var isProcessing = false
    
    let rowCount = 100
    let columnCount = 26
    
    init() {
        setupSpreadsheet()
    }
    
    private func setupSpreadsheet() {
        columns = (0..<columnCount).map { index in
            Column(id: index, name: columnName(for: index))
        }
        
        cells = (0..<rowCount).map { row in
            (0..<columnCount).map { col in
                CellData(row: row, column: col)
            }
        }
    }
    
    private func columnName(for index: Int) -> String {
        let letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        if index < 26 {
            return String(letters[letters.index(letters.startIndex, offsetBy: index)])
        }
        return "A\(String(letters[letters.index(letters.startIndex, offsetBy: index - 26)]))"
    }
    
    func applyPrompt(_ prompt: String, to selection: CellSelection) async {
        isProcessing = true
        defer { isProcessing = false }
        
        let context = gatherContext(for: selection)
        let contextString = context.map { row in
            row.joined(separator: "\t")
        }.joined(separator: "\n")
        
        do {
            let result = try await NetworkService.shared.generateWithOllama(
                prompt: prompt,
                model: "llama3.2:latest",
                context: contextString
            )
            
            await MainActor.run {
                applyResults(result, to: selection)
            }
        } catch {
            print("Failed to process prompt: \(error)")
        }
    }
    
    private func gatherContext(for selection: CellSelection) -> [[String]] {
        switch selection {
        case .single(let position):
            return getNeighboringCells(around: position)
        case .range(let start, let end):
            return getCellsInRange(from: start, to: end)
        case .column(let columnIndex):
            return getColumnData(columnIndex)
        }
    }
    
    private func getNeighboringCells(around position: CellPosition) -> [[String]] {
        var context: [[String]] = []
        
        let startRow = max(0, position.row - 2)
        let endRow = min(rowCount - 1, position.row + 2)
        let startCol = max(0, position.column - 2)
        let endCol = min(columnCount - 1, position.column + 2)
        
        for row in startRow...endRow {
            var rowData: [String] = []
            for col in startCol...endCol {
                rowData.append(cells[row][col].value)
            }
            context.append(rowData)
        }
        
        return context
    }
    
    private func getCellsInRange(from start: CellPosition, to end: CellPosition) -> [[String]] {
        var context: [[String]] = []
        
        for row in start.row...end.row {
            var rowData: [String] = []
            for col in start.column...end.column {
                rowData.append(cells[row][col].value)
            }
            context.append(rowData)
        }
        
        return context
    }
    
    private func getColumnData(_ columnIndex: Int) -> [[String]] {
        return cells.map { row in
            [row[columnIndex].value]
        }
    }
    
    private func buildPrompt(_ userPrompt: String, context: [[String]]) -> String {
        let contextString = context.map { row in
            row.joined(separator: "\t")
        }.joined(separator: "\n")
        
        return """
        You are an AI assistant helping with spreadsheet data processing.
        
        Context data:
        \(contextString)
        
        User request: \(userPrompt)
        
        Please provide the result in a format suitable for spreadsheet cells.
        """
    }
    
    private func applyResults(_ result: String, to selection: CellSelection) {
        switch selection {
        case .single(let position):
            cells[position.row][position.column].value = result
        case .range(let start, let end):
            let lines = result.components(separatedBy: "\n")
            var lineIndex = 0
            
            for row in start.row...end.row {
                if lineIndex >= lines.count { break }
                let values = lines[lineIndex].components(separatedBy: "\t")
                var valueIndex = 0
                
                for col in start.column...end.column {
                    if valueIndex >= values.count { break }
                    cells[row][col].value = values[valueIndex]
                    valueIndex += 1
                }
                lineIndex += 1
            }
        case .column(let columnIndex):
            let values = result.components(separatedBy: "\n")
            for (index, value) in values.enumerated() {
                if index >= rowCount { break }
                cells[index][columnIndex].value = value
            }
        }
    }
    
    func importCSV(from url: URL) throws {
        let content = try String(contentsOf: url)
        let rows = content.components(separatedBy: "\n")
        
        for (rowIndex, row) in rows.enumerated() {
            if rowIndex >= rowCount { break }
            
            let values = parseCSVRow(row)
            for (colIndex, value) in values.enumerated() {
                if colIndex >= columnCount { break }
                cells[rowIndex][colIndex].value = value
            }
        }
    }
    
    private func parseCSVRow(_ row: String) -> [String] {
        var result: [String] = []
        var currentField = ""
        var inQuotes = false
        
        for char in row {
            if char == "\"" {
                inQuotes.toggle()
            } else if char == "," && !inQuotes {
                result.append(currentField)
                currentField = ""
            } else {
                currentField.append(char)
            }
        }
        
        if !currentField.isEmpty {
            result.append(currentField)
        }
        
        return result
    }
    
    func exportCSV() -> String {
        return cells.map { row in
            row.map { cell in
                let value = cell.value
                if value.contains(",") || value.contains("\"") || value.contains("\n") {
                    return "\"\(value.replacingOccurrences(of: "\"", with: "\"\""))\""
                }
                return value
            }.joined(separator: ",")
        }.joined(separator: "\n")
    }
}

struct CellData: Identifiable {
    let id = UUID()
    let row: Int
    let column: Int
    var value: String = ""
    var formula: String?
    var error: String?
}

struct Column: Identifiable {
    let id: Int
    let name: String
    var width: CGFloat = 100
    var isHidden = false
}

struct CellPosition: Equatable {
    let row: Int
    let column: Int
}

enum CellSelection {
    case single(CellPosition)
    case range(CellPosition, CellPosition)
    case column(Int)
}