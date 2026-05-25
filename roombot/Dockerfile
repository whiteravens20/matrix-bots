FROM node:22-alpine

# Refresh the bundled npm so transitive CVEs in npm's own deps (e.g. picomatch
# CVE-2026-33671) ship patched even before the base image is rebuilt.
RUN npm install -g npm@latest && npm cache clean --force

WORKDIR /app

# Copy shared code (used by both bots) first so it is cached across builds.
COPY shared/ ./shared/

# Copy package files
COPY roombot/package.json roombot/package-lock.json* ./roombot/

# Install dependencies
RUN npm install --production --prefix ./roombot

# Copy application files
COPY roombot/index.js ./roombot/index.js
COPY roombot/config ./roombot/config

WORKDIR /app/roombot

# config.js will be mounted from host
VOLUME [ "/app/roombot/config" ]

CMD ["node", "index.js"]
