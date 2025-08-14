# Use the official Hugging Face AI Sheets image as base
FROM huggingface/ai-sheets:latest

# Set working directory
WORKDIR /app

# Copy custom branding configuration
COPY branding.json /app/config/branding.json
COPY custom-styles.css /app/public/custom-styles.css
COPY about-content.html /app/about-content.html
COPY startup-script.sh /app/startup-script.sh

# Make startup script executable
RUN chmod +x /app/startup-script.sh

# Environment variables for Brain Cells branding
ENV APP_NAME="Brain Cells"
ENV APP_TAGLINE="Intelligent Spreadsheet Automation"
ENV APP_LOGO="🦉"
ENV APP_ATTRIBUTION="Built on the open source Hugging Face AI Sheets project"

# Expose port
EXPOSE 3000

# Run the customized startup
CMD ["/app/startup-script.sh"]