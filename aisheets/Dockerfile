# Use Debian-based Node.js image as the base for building
FROM node:22-slim AS build

# Set the working directory
WORKDIR /usr/src/app

ENV NODE_OPTIONS="--max-old-space-size=4096"
# This environment variable is used to skip the postinstall script during the build stage
# See the package.json postinstall script for details
ENV SKIP_POSTINSTALL=1 

# Install dependencies and SQLite
RUN apt-get update && apt-get install -y --no-install-recommends \
    sqlite3 \
    libsqlite3-dev \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN npm install -g pnpm

# Verify installation
RUN pnpm --version

# Copy package.json and lock file
COPY ./package.json ./
COPY ./pnpm-lock.yaml ./

# Install dependencies with pnpm
RUN pnpm install --frozen-lockfile 

# Copy the rest of the source code
COPY ./ ./

# Build the project
RUN pnpm build

# Clean up unnecessary files to reduce layer size
RUN rm -rf src/ \
    && rm -rf .git/ \
    && rm -rf .github/ \
    && rm -rf .vscode/ \
    && rm -rf .husky/ \
    && rm -rf *.md

# Use a Debian-based Node.js image for production
FROM node:22-slim AS production

# Set the working directory
WORKDIR /usr/src/app

# Install only runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsqlite3-0 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy the built application from the build stage
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/server ./server
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/package.json ./package.json

ENV PLAYWRIGHT_BROWSERS_PATH=/home/node/ms-playwright

# Install playwright deps and chromium in a single layer, then clean up
RUN npm exec playwright install-deps \
    && npm exec playwright install chromium --only-shell \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /tmp/*

# Create a non-root user for security
RUN useradd -m -u 1001 appuser && chown -R appuser:appuser /usr/src/app

USER appuser

# Expose the application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start the application
CMD [ "node", "server/entry.express" ]