# Brain Cells - Intelligent Spreadsheet Automation
# Based on Node.js for the web interface

FROM node:18-alpine

# Install Python for any Python-based processing
RUN apk add --no-cache python3 py3-pip bash curl

# Set working directory
WORKDIR /app

# Create the Brain Cells application
# Since Hugging Face AI Sheets isn't available as a Docker image,
# we'll create a custom spreadsheet interface

# Copy package.json for the web app
COPY package.json /app/package.json 2>/dev/null || true

# Create a simple Brain Cells web interface
RUN mkdir -p /app/public /app/src /app/config

# Copy custom branding and configuration
COPY branding.json /app/config/branding.json
COPY custom-styles.css /app/public/custom-styles.css
COPY about-content.html /app/public/about.html
COPY startup-script.sh /app/startup-script.sh
COPY brain-cells-app.html /app/public/index.html

# Make startup script executable
RUN chmod +x /app/startup-script.sh

# Environment variables for Brain Cells branding
ENV APP_NAME="Brain Cells"
ENV APP_TAGLINE="Intelligent Spreadsheet Automation"
ENV APP_LOGO="🦉"
ENV APP_ATTRIBUTION="Inspired by Hugging Face AI Sheets"
ENV NODE_ENV=production
ENV PORT=3000

# Install a simple HTTP server
RUN npm install -g http-server

# Expose port
EXPOSE 3000

# Run the Brain Cells application
CMD ["http-server", "/app/public", "-p", "3000", "-c-1"]