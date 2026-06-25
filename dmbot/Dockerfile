FROM node:22-alpine

WORKDIR /app

# Copy shared code (used by both bots) first so it is cached across builds.
COPY shared/lib ./shared/lib

# Copy package files
COPY dmbot/package.json dmbot/package-lock.json* ./dmbot/

# Install dependencies
RUN npm install --production --prefix ./dmbot

# Copy application files
COPY dmbot/index.js ./dmbot/index.js
COPY dmbot/config ./dmbot/config

# Create data directory
RUN mkdir -p /app/dmbot/data

# The bot runs `node`, never `npm`, at runtime. Drop the npm CLI and its cache
# so npm's vendored dependencies (undici, etc.) don't surface as unreachable
# HIGH/CRITICAL findings in image scans.
RUN rm -rf /usr/local/lib/node_modules/npm \
           /usr/local/bin/npm /usr/local/bin/npx \
           /root/.npm

WORKDIR /app/dmbot

# Run the bot
CMD ["node", "index.js"]
