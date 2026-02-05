# Matrix Bots

A collection of Matrix bots built with Node.js and the Matrix Bot SDK. This repository contains three bots: a general chatbot for DMs, a codebot for code-related DMs, and a roombot for room-specific interactions, all with optional n8n workflow integration.

## Features

- **DM-Only Communication**: Chatbot and Codebot respond only to direct messages from whitelisted users.
- **Room-Specific Communication**: Roombot responds to messages in a specific configured room.
- **User Whitelisting**: Only messages from specified allowed users are processed (for DM bots).
- **n8n Integration**: Trigger n8n workflows on incoming messages to automate processes.
- **Docker Support**: Easy deployment using Docker and Docker Compose.
- **Environment-Based Configuration**: Secure configuration through environment variables.

## Bots

#### Chatbot (`chatbot/`)
A general-purpose bot that echoes back received DMs from allowed users and triggers n8n workflows.

#### Codebot (`codebot/`)
A specialized bot for code-related interactions that responds only to DMs from allowed users and supports n8n workflow integration for automation.

#### Roombot (`roombot/`)
A bot configured to listen for messages in a specific Matrix room and trigger n8n workflows on all room messages.

## Setup

### Prerequisites
- **Node.js 22+** (for local development) - Check with `node --version`
- **Docker and Docker Compose** (recommended for deployment)
- A Matrix homeserver account with access tokens for each bot

### ⚠️ Important: Node Version
This project requires **Node.js 22 or higher** due to the `@matrix-org/matrix-sdk-crypto-nodejs` dependency.
- Docker images use Node 22-alpine (compatible) ✅
- Local development requires Node 22+ ⚠️

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/whiteravens20/matrix-bots.git
   cd matrix-bots
   ```

2. Create data directories for each bot:
   ```bash
   mkdir -p chatbot/data codebot/data roombot/data n8n/data
   ```

3. Copy the environment example file:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` with your Matrix credentials:
   - `MATRIX_HOMESERVER`: Your Matrix homeserver URL
   - `GENERALBOT_USER_ID`: User ID for the chatbot
   - `GENERALBOT_ACCESS_TOKEN`: Access token for the chatbot
   - `GENERALBOT_ALLOWED_USERS`: Comma-separated list of allowed user IDs for chatbot (no trailing commas)
   - `CODEBOT_USER_ID`: User ID for the codebot
   - `CODEBOT_ACCESS_TOKEN`: Access token for the codebot
   - `CODEBOT_ALLOWED_USERS`: Comma-separated list of allowed user IDs for codebot (no trailing commas)
   - `ROOMBOT_USER_ID`: User ID for the roombot
   - `ROOMBOT_ACCESS_TOKEN`: Access token for the roombot
   - `TARGET_ROOM_ID`: Matrix room ID for roombot to listen to (format: `!roomHash:homeserver.com`) - **REQUIRED**
   - `N8N_WEBHOOK_URL` (optional): n8n webhook URL to trigger workflows on incoming messages
   - `N8N_BASIC_AUTH_ACTIVE` (optional): Enable n8n basic authentication (recommended: `true`)
   - `N8N_USER` (optional): n8n basic auth username
   - `N8N_PASSWORD` (optional): n8n basic auth password (use strong password!)

### Running Locally

For each bot directory:

```bash
cd chatbot
npm install
npm start
```

### Running with Docker

```bash
docker-compose up -d
```

## Configuration

Each bot has its own configuration file in `botname/config/config.js`:

**Chatbot and Codebot** (`config.js`):
- Matrix homeserver URL
- Access token
- User ID
- List of allowed users

**Roombot** (`config.js`):
- Matrix homeserver URL
- Access token
- User ID
- Target room ID (which room to listen to)

## Usage

### Chatbot and Codebot
Once running, these bots will:
1. Connect to the Matrix homeserver
2. Listen for room invitations (and ignore them)
3. **Verify messages are in DM rooms** (exactly 2 members: bot + user)
4. **Check sender is in whitelist** before responding
5. Respond to DMs from whitelisted users with a confirmation message
6. Trigger n8n workflows (if configured) for each incoming DM

### Roombot
Once running, the roombot will:
1. Connect to the Matrix homeserver
2. Verify `TARGET_ROOM_ID` is configured (fails if not set)
3. Listen for messages in the configured room (`TARGET_ROOM_ID`)
4. Respond to all messages in that room with a confirmation message
5. Trigger n8n workflows (if configured) for each message

## n8n Integration

### Setup

1. Create a workflow in your n8n instance that accepts webhook requests
2. Copy the webhook URL from the n8n workflow
3. Add the webhook URL to your `.env` file:
   ```bash
   N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-webhook-path
   ```

### Webhook Payload

When a DM is received, the bot sends the following JSON payload to the n8n webhook:

```json
{
  "sender": "@user:example.com",
  "message": "User's message content",
  "roomId": "!roomIdHash:example.com",
  "timestamp": "2024-01-29T12:34:56.789Z"
}
```

### Example n8n Workflow

In n8n, create a workflow with:
1. **Webhook Trigger** node - Listening for POST requests
2. Your automation steps (e.g., save to database, send notifications, call APIs)

This allows you to process Matrix messages through n8n workflows automatically whenever a DM is received by the bot.

## Development

- Code is written in ES6+ JavaScript
- Uses `matrix-bot-sdk` for Matrix integration
- Uses `axios` for HTTP requests to n8n webhooks
- Environment variables are loaded using `dotenv`

## Security

For DM verification via room member count (not metadata)
- ✅ User whitelist with empty value filtering
- ✅ Required TARGET_ROOM_ID validation for roombot
- ✅ HTTPS warning for n8n webhooks (except localhost)
- ✅ 5-second timeout for webhook requests
- ✅ No permanent data storage
- ✅ No arbitrary code execution
- ✅ Requires Node.js 22+ (enforced in package.json)
- ✅ Docker deployment recommended with health checks
- ✅ n8n basic authentication support
- ⚠️ Review SECURITY.md for known transitive dependency vulnerabilities

**Recent Security Fixes (2026-02-05):**
- Fixed critical DM detection bug (bots now properly restrict to DMs)
- Fixed whitelist configuration handling
- Added TARGET_ROOM_ID validation
- Fixed Docker volume mappings
- Added comprehensive error handling
- See [CHANGELOG.md](CHANGELOG.md) for complete detail
- ✅ Requires Node.js 22+ (enforced in package.json)
- ✅ Docker deployment recommended
- ⚠️ Review SECURITY.md for known transitive dependency vulnerabilities


## License

See LICENSE file for details.