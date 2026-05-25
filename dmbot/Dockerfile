FROM node:22-alpine

# Refresh the bundled npm so transitive CVEs in npm's own deps (e.g. picomatch
# CVE-2026-33671) ship patched even before the base image is rebuilt.
RUN npm install -g npm@latest && npm cache clean --force

WORKDIR /app

# Copy shared code (used by both bots) first so it is cached across builds.
COPY shared/ ./shared/

# Copy package files
COPY dmbot/package*.json ./dmbot/

# Install dependencies
RUN npm install --production --prefix ./dmbot

# Copy application files
COPY dmbot/ ./dmbot/

# Create data directory
RUN mkdir -p /app/dmbot/data

WORKDIR /app/dmbot

# Run the bot
CMD ["node", "index.js"]
