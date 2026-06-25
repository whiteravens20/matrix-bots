# ── Builder ───────────────────────────────────────────────────────────────────
# Debian (glibc) base so npm installs the correct `linux-x64-gnu` prebuild of
# @matrix-org/matrix-sdk-crypto-nodejs. Its `linux-x64-musl` prebuild is
# mislabeled (actually glibc-linked) and fails to load on Alpine/musl, which
# crashes matrix-bot-sdk at import time — hence a glibc base.
FROM node:24-slim AS builder

WORKDIR /app

# Shared code used by both bots, copied first so it caches across builds.
COPY shared/lib ./shared/lib

# Install production dependencies (pulls the gnu crypto prebuild).
COPY roombot/package.json roombot/package-lock.json* ./roombot/
RUN npm install --production --prefix ./roombot

# Application files.
COPY roombot/index.js ./roombot/index.js
COPY roombot/config ./roombot/config
RUN mkdir -p /app/roombot/data

# ── Runtime ───────────────────────────────────────────────────────────────────
# Distroless: glibc, Node 24 LTS, no shell or npm — minimal attack/CVE surface.
# The bot runs `node`, not `npm`, so none of the build toolchain ships.
FROM gcr.io/distroless/nodejs24-debian12

WORKDIR /app/roombot
COPY --from=builder /app /app

# The distroless nodejs image's entrypoint is `node`; CMD is the script to run.
CMD ["index.js"]
