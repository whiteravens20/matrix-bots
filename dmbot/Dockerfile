# ── Builder ───────────────────────────────────────────────────────────────────
# Debian (glibc) base so npm installs the correct `linux-x64-gnu` prebuild of
# @matrix-org/matrix-sdk-crypto-nodejs. Its `linux-x64-musl` prebuild is
# mislabeled (actually glibc-linked) and fails to load on Alpine/musl, which
# crashes matrix-bot-sdk at import time — hence a glibc base.
# Trixie matches the runtime stage below, so the prebuild is resolved against
# the same glibc it will run on.
FROM node:24-trixie-slim AS builder

WORKDIR /app

# Shared code used by both bots, copied first so it caches across builds.
COPY shared/lib ./shared/lib

# Install production dependencies (pulls the gnu crypto prebuild).
# `npm ci`, not `npm install`: the image must be built from package-lock.json
# exactly. `npm install` is free to resolve newer versions at build time, which
# would silently bypass the min-release-age quarantine the lockfile encodes.
COPY dmbot/package.json dmbot/package-lock.json ./dmbot/
RUN npm ci --omit=dev --prefix ./dmbot

# Application files.
COPY dmbot/index.js ./dmbot/index.js
COPY dmbot/config ./dmbot/config

# Runtime state lives here; create it up front so the bot can write
# bot-storage.json even when no volume is mounted over it.
RUN mkdir -p /app/dmbot/data

# ── Runtime ───────────────────────────────────────────────────────────────────
# Distroless: glibc, Node 24 LTS, no shell or npm — minimal attack/CVE surface.
# The bot runs `node`, not `npm`, so none of the build toolchain ships.
#
# debian13 (trixie), not debian12: bookworm ships libssl3 3.0.18-1~deb12u2,
# which carries one CRITICAL and five HIGH CVEs whose fixes are only published
# for 3.0.19/3.0.20 — so they had to be suppressed in .trivyignore. Trixie
# reports 0 HIGH/CRITICAL, so those findings are fixed rather than ignored.
#
# `:nonroot` runs as uid 65532 instead of root (SECURITY.md § Docker Security).
FROM gcr.io/distroless/nodejs24-debian13:nonroot

WORKDIR /app/dmbot
COPY --from=builder --chown=65532:65532 /app /app

# The distroless nodejs image's entrypoint is `node`; CMD is the script to run.
CMD ["index.js"]
