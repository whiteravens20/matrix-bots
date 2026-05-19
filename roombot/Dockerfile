FROM node:22-alpine

# Refresh the bundled npm so transitive CVEs in npm's own deps (e.g. picomatch
# CVE-2026-33671) ship patched even before the base image is rebuilt.
RUN npm install -g npm@latest && npm cache clean --force

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --production

COPY index.js ./index.js

# config.js will be mounted from host
VOLUME [ "/app/config" ]

CMD ["node", "index.js"]
