// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "BrainCellsApp",
    platforms: [
        .macOS(.v14)
    ],
    products: [
        .executable(
            name: "BrainCellsApp",
            targets: ["BrainCellsApp"]
        )
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "BrainCellsApp",
            dependencies: [],
            path: "BrainCellsApp"
        )
    ]
)