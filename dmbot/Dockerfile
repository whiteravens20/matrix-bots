FROM node:22-alpine

# Refresh the bundled npm so transitive CVEs in npm's own deps (e.g. picomatch
# CVE-2026-33671) ship patched even before the base image is rebuilt.
RUN npm install -g npm@latest && npm cache clean --force

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application files
COPY . .

# Create data directory
RUN mkdir -p /app/data

# Run the bot
CMD ["npm", "start"]
