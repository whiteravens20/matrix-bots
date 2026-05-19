# Private DM Bot Setup Guide

A step-by-step guide to running the DM Bot (`dmbot`) in a privacy-hardened, single-user (or small whitelist) configuration. This assumes your threat model is: **you do not want messages to leave your infrastructure, and you do not want unauthorized users to interact with the bot.**

---

## 1. Architecture Overview

The DM Bot is the privacy-oriented choice for two reasons built into the code:

| Feature | dmbot | roombot |
|---|---|---|
| DM verification | Checks room has exactly 2 members | None (listens to any room) |
| User whitelist | `ALLOWED_USERS` rejects everyone else | No whitelist |
| Room invites | Ignored automatically | Ignored automatically |
| Scope | Private 1:1 only | Group rooms, public by nature |

**Rule of thumb**: If you only need a private assistant for yourself or a few trusted people, use `dmbot` and do not run `roombot` at all.

---

## 2. Self-Hosted Homeserver

Using `matrix.org` or another public homeserver defeats the purpose. The server operator can read your (unencrypted) message metadata and, in many cases, content.

**Recommended**: Run [Synapse](https://github.com/element-hq/synapse) or [Dendrite](https://github.com/matrix-org/dendrite) on a VPS or home server you control.

Quick Synapse via Docker (separate from this project):

```bash
docker run -it --rm \
  -v $(pwd)/synapse-data:/data \
  -e SYNAPSE_SERVER_NAME=matrix.yourdomain.com \
  -e SYNAPSE_REPORT_STATS=no \
  matrixdotorg/synapse:latest generate

docker run -d --name synapse \
  -v $(pwd)/synapse-data:/data \
  -p 8008:8008 \
  matrixdotorg/synapse:latest
```

- Use your own domain.
- Disable federation (`federation_domain_whitelist: []`) if you do not need to talk to other servers.
- Place it behind a reverse proxy with TLS (see Section 5).

---

## 3. Bot Account Hardening

Create a **dedicated** Matrix account for the bot. Do not reuse a personal account.

1. Register the account on your homeserver.
2. Do not join any public rooms or spaces.
3. Keep the profile empty (no display name, no avatar) — reduces discoverability.
4. Set a strong password:
   ```bash
   openssl rand -base64 32
   ```
5. In `.env`, use **username/password** auth (fresh tokens on every start, no stale tokens lying around):
   ```bash
   MATRIX_HOMESERVER=https://matrix.yourdomain.com
   DMBOT_USERNAME=dmbot
   DMBOT_PASSWORD=<generated_password_above>
   ```

---

## 4. Whitelist & DM-Only Configuration

The bot **must** reject anyone not on the list.

In `.env`:

```bash
# Only these users can talk to the bot (full MXID, comma-separated, NO spaces)
DMBOT_ALLOWED_USERS=@you:yourdomain.com
```

**How the protection works** (in `dmbot/index.js`):

1. `room.message` fires.
2. Bot checks `members.length === 2` — if not, it is a group room and the message is dropped.
3. Bot checks `config.bot.allowedUsers.includes(event.sender)` — if not, the message is logged and dropped.
4. Only then is the payload sent to n8n.

**If you need to allow more users**, append them comma-separated with no spaces:

```bash
DMBOT_ALLOWED_USERS=@you:yourdomain.com,@partner:yourdomain.com
```

**Do not** use spaces or trailing commas — the split logic is strict.

---

## 5. Transport Security

All traffic between you, the homeserver, and the bot must be over TLS.

**Minimum checklist:**

- [ ] Homeserver serves HTTPS on 443 (not 8008/plain HTTP to the internet).
- [ ] Valid certificate (Let's Encrypt is fine).
- [ ] Reverse proxy (Caddy or Traefik) with modern TLS config.

**Example Caddyfile snippet:**

```caddy
matrix.yourdomain.com {
    reverse_proxy localhost:8008
    tls {
        protocols tls1.3
    }
}
```

- Block port 8008 from the public internet at the firewall level.
- Pin the homeserver URL to `https://` in `.env`.

---

## 6. Webhook & AI Privacy

By default, the bot POSTs every incoming message to `N8N_WEBHOOK_URL`. If that URL points to an external service, your messages leave your infrastructure.

### Option A: Keep n8n Internal (Default Docker Setup)

If you run n8n via the included `docker-compose.yml`, use the **internal Docker hostname** so traffic never leaves the bridge network:

```bash
N8N_WEBHOOK_URL=http://n8n:5678/webhook/matrix-bot
```

This resolves inside the Docker network. Do not expose n8n port `5678` to the host or internet unless you need remote access.

### Option B: Remove n8n Entirely & Use Local LLM Inference

If you do not need workflow automation, you can bypass n8n and call a local model directly (Ollama, LM Studio, or similar) from the bot code. This requires a small patch to `dmbot/index.js` — replace the `axios.post(config.n8n.webhookUrl, ...)` block with a call to your local API.

**Example local endpoint:**

```bash
OLLAMA_URL=http://localhost:11434/api/chat
```

This is the strongest privacy posture: messages never leave the machine.

---

## 7. Docker Network Isolation

The included `docker-compose.yml` spins up `n8n`, `dmbot`, and `roombot`. For a private-only deployment, remove `roombot` entirely and restrict networking.

**Recommended `docker-compose.yml` edits:**

```yaml
services:
  n8n:
    # ... keep existing n8n config, but remove ports: if not needed externally
    networks:
      - botnet

  dmbot:
    # ... existing config
    networks:
      - botnet
    # Optional: read-only root filesystem where the app allows it
    read_only: true
    tmpfs:
      - /tmp

networks:
  botnet:
    driver: bridge
```

**Removed:**
- `roombot` service (group rooms are out of scope for a private setup).
- Published n8n port `5678` unless you actively use it from outside Docker.

---

## 8. Data Retention & Logging

The bot stores almost nothing locally, but verify the following:

| Storage | Path | Contents | Action |
|---|---|---|---|
| Bot storage | `./dmbot/data/bot-storage.json` | Matrix sync tokens, room IDs | Review periodically; can be wiped on restart |
| n8n data | `./n8n/data` | Workflow executions, credentials | Limit retention in n8n settings |
| Docker logs | Container stdout/stderr | Message metadata and content | Rotate via `log-opt` or send to `/dev/null` |

**Add log options to `docker-compose.yml`:**

```yaml
  dmbot:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

**Sensitive note**: The bot logs the full message body to stdout in lines like `DM from @user: ...`. If you aggregate logs to a remote system, you are exporting message content. Keep logs local.

---

## 9. End-to-End Encryption (E2EE)

`matrix-bot-sdk` does **not** support E2EE out of the box. The bot sees messages in plain text because they are decrypted by the homeserver before being forwarded to the bot via the client-server API.

**What this means:**

- Messages are encrypted in transit between your client and homeserver (TLS).
- Messages are **not** encrypted at the homeserver itself when the bot reads them.
- Anyone with shell access to the homeserver machine can, in principle, read them.

**Mitigations:**

1. Run the homeserver and bot on the same trusted machine.
2. Do not grant third parties access to the server.
3. If E2EE is a hard requirement, you would need to switch to a different SDK (e.g., `matrix-js-sdk` with crypto bindings) — this is outside the current scope.

For most self-hosted, single-user threat models, running the server on hardware you control is sufficient.

---

## 10. Operational Checklist

Before considering the deployment "private," verify each item:

- [ ] `DMBOT_ALLOWED_USERS` contains **only** your MXID(s).
- [ ] `roombot` service is **not** running (removed from `docker-compose.yml`).
- [ ] `N8N_WEBHOOK_URL` uses `http://n8n:5678/...` (internal Docker hostname) or points to a **local** LLM endpoint.
- [ ] Homeserver is self-hosted and uses `https://`.
- [ ] Port 8008/5678 are **not** exposed to the internet.
- [ ] Bot account has **no** avatar, no display name, and is in **zero** public rooms.
- [ ] `.env` file is **not** in git (`git check-ignore .env` returns 0).
- [ ] Docker logs are rotated and kept local (not shipped to Datadog / Splunk / etc.).
- [ ] n8n workflow does **not** call external APIs (OpenAI, Anthropic) unless you are okay with data leaving.
- [ ] You have tested by sending a message from a **non-whitelisted** account — bot must ignore it.

---

## 11. Minimal Private `.env` Template

```bash
# Homeserver (self-hosted, HTTPS)
MATRIX_HOMESERVER=https://matrix.yourdomain.com

# Bot credentials (username/password recommended)
DMBOT_USERNAME=dmbot
DMBOT_PASSWORD=<strong_password_from_openssl>

# Whitelist: only YOU
DMBOT_ALLOWED_USERS=@you:yourdomain.com

# Internal n8n OR local LLM endpoint
N8N_WEBHOOK_URL=http://n8n:5678/webhook/private-bot
# N8N_WEBHOOK_URL=http://host.docker.internal:11434/api/chat  # if using Ollama

# Optional: customize prefixes (no functional impact)
BOT_RESPONSE_PREFIX="[Private Bot]"

# Not needed for private-only setups
# TARGET_ROOM_ID=...
# ROOMBOT_USERNAME=...
# ROOMBOT_PASSWORD=...
```

---

## 12. Troubleshooting

**Bot ignores my messages**

1. Check `DMBOT_ALLOWED_USERS` uses the **full** MXID (`@user:domain.com`), not just a localpart.
2. Verify the room has exactly 2 members (you + bot). If a third member joined, DM verification fails.
3. Check bot logs: `docker logs dmbot`.

**"Ignoring message from non-whitelisted user"**

This is expected behavior. If it is your own account, your MXID in `.env` does not match the sender MXID.

**n8n webhook timeout**

If using a local LLM (Ollama), increase the axios timeout in `dmbot/index.js` from `30000` to `120000` — local models on CPU are slow.

---

*This guide complements [BOT_CREDENTIALS_GUIDE.md](BOT_CREDENTIALS_GUIDE.md) and [N8N_WORKFLOW_GUIDE.md](N8N_WORKFLOW_GUIDE.md). Read those first for basic setup, then return here for hardening.*
