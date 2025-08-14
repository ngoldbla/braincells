#!/bin/bash

# Brain Cells Startup Script
# Customizes Hugging Face AI Sheets with Brain Cells branding

echo "🦉 Starting Brain Cells (Intelligent Spreadsheet Automation)..."
echo "Built on the open source Hugging Face AI Sheets project"
echo "----------------------------------------"

# Set environment variables for branding
export VITE_APP_NAME="Brain Cells"
export VITE_APP_TITLE="Brain Cells - Intelligent Spreadsheet Automation"
export VITE_APP_LOGO="🦉"
export REACT_APP_NAME="Brain Cells"
export NEXT_PUBLIC_APP_NAME="Brain Cells"

# Check if the base AI Sheets files exist
if [ -f /app/index.html ]; then
    echo "Applying Brain Cells branding to HTML..."
    # Replace "AI Sheets" with "Brain Cells" in HTML files
    find /app -name "*.html" -type f -exec sed -i 's/AI Sheets/Brain Cells/g' {} \;
    find /app -name "*.html" -type f -exec sed -i 's/ai-sheets/brain-cells/g' {} \;
    
    # Add custom styles
    if [ -f /app/public/custom-styles.css ]; then
        echo '<link rel="stylesheet" href="/custom-styles.css">' >> /app/index.html
    fi
    
    # Add footer attribution
    echo '<div style="position: fixed; bottom: 0; left: 0; right: 0; background: #231F20; color: #FDBB30; text-align: center; padding: 10px; font-size: 12px; z-index: 9999;">Brain Cells is a bundle created from the open source Hugging Face AI Sheets project • KSU Office of Research</div>' >> /app/index.html
fi

# Check for JavaScript/TypeScript files
if [ -d /app/src ] || [ -d /app/pages ] || [ -d /app/components ]; then
    echo "Applying Brain Cells branding to JavaScript/TypeScript..."
    # Replace "AI Sheets" with "Brain Cells" in JS/TS files
    find /app -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" 2>/dev/null | while read file; do
        sed -i 's/"AI Sheets"/"Brain Cells"/g' "$file" 2>/dev/null || true
        sed -i "s/'AI Sheets'/'Brain Cells'/g" "$file" 2>/dev/null || true
        sed -i 's/`AI Sheets`/`Brain Cells`/g' "$file" 2>/dev/null || true
        
        # Update feedback links to email ngoldbla@kennesaw.edu
        sed -i 's|drop a message here|email <a href="mailto:ngoldbla@kennesaw.edu?subject=Feedback%20on%20Brain%20Cells">ngoldbla@kennesaw.edu</a>|g' "$file" 2>/dev/null || true
        sed -i 's|For questions and feedback,.*\.|For questions and feedback, <a href="mailto:ngoldbla@kennesaw.edu?subject=Feedback%20on%20Brain%20Cells">email ngoldbla@kennesaw.edu</a>.|g' "$file" 2>/dev/null || true
        
        # Replace about content sections
        sed -i 's|Supercharge Brainstorming:|Brain Cells - Intelligent Automation:|g' "$file" 2>/dev/null || true
        sed -i 's|We made it for you|Built for KSU Researchers|g' "$file" 2>/dev/null || true
    done
fi

# Copy custom about content if it exists
if [ -f /app/about-content.html ] && [ -d /app/public ]; then
    echo "Injecting custom Brain Cells about content..."
    cp /app/about-content.html /app/public/about.html 2>/dev/null || true
fi

# Check for configuration files
if [ -f /app/package.json ]; then
    echo "Updating package.json with Brain Cells info..."
    sed -i 's/"name": "ai-sheets"/"name": "brain-cells"/g' /app/package.json 2>/dev/null || true
    sed -i 's/"displayName": "AI Sheets"/"displayName": "Brain Cells"/g' /app/package.json 2>/dev/null || true
fi

# Create a simple branded landing page if none exists
if [ ! -f /app/index.html ] && [ ! -f /app/public/index.html ]; then
    echo "Creating Brain Cells landing page..."
    cat > /app/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🦉 Brain Cells - Intelligent Spreadsheet Automation</title>
    <link rel="stylesheet" href="/custom-styles.css">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #F4F4F4 0%, #FFFFFF 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            background: #231F20;
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-bottom: 3px solid #FDBB30;
        }
        .header h1 {
            margin: 0;
            font-size: 2rem;
        }
        .header .tagline {
            color: #FDBB30;
            margin-top: 5px;
        }
        .logo {
            font-size: 3rem;
            margin-right: 15px;
            vertical-align: middle;
        }
        .main-content {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .attribution {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #231F20;
            color: #FDBB30;
            text-align: center;
            padding: 15px;
            font-size: 0.875rem;
            border-top: 2px solid #FDBB30;
        }
        .attribution a {
            color: #FDBB30;
            text-decoration: none;
        }
        .attribution a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1><span class="logo">🦉</span> Brain Cells</h1>
            <div class="tagline">Intelligent Spreadsheet Automation • Every Cell is a Brain Cell</div>
        </div>
        <div class="main-content">
            <h2>Welcome to Brain Cells</h2>
            <p><strong>Brain Cells</strong> is a comprehensive bundle that includes the open source Hugging Face AI Sheets application, enhanced with Ollama for local LLM processing and Crawl4AI for web data extraction.</p>
            <p>Transform your data with AI-powered spreadsheet automation. Each cell becomes intelligent, capable of understanding and transforming your data - all running locally for complete privacy.</p>
            <p>For questions and feedback: <a href="mailto:ngoldbla@kennesaw.edu?subject=Feedback%20on%20Brain%20Cells" style="color: #231F20;">ngoldbla@kennesaw.edu</a></p>
            <p style="margin-top: 2rem; font-style: italic;">Loading application...</p>
        </div>
    </div>
    <div class="attribution">
        Brain Cells is a bundle created from the open source 
        <a href="https://huggingface.co/spaces/HuggingFace/ai-sheets" target="_blank">Hugging Face AI Sheets</a> project 
        • Developed by Dylan Goldblatt at 
        <a href="https://research.kennesaw.edu" target="_blank">KSU Office of Research</a>
    </div>
</body>
</html>
EOF
fi

echo "----------------------------------------"
echo "Brain Cells branding applied successfully!"
echo "Starting the application..."

# Start the original AI Sheets application
# Try different possible startup commands
if [ -f /app/start.sh ]; then
    exec /app/start.sh
elif [ -f /app/package.json ]; then
    if grep -q '"start"' /app/package.json; then
        exec npm start
    elif grep -q '"dev"' /app/package.json; then
        exec npm run dev
    fi
elif [ -f /app/app.py ]; then
    exec python /app/app.py
elif [ -f /app/main.py ]; then
    exec python /app/main.py
else
    # Default: try to start a simple HTTP server
    echo "No specific startup script found, starting HTTP server..."
    exec python -m http.server 3000
fi