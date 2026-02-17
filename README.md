# Matrix Bots

A collection of Matrix bots built with Node.js and the Matrix Bot SDK. This repository contains two specialized bots: a DM bot for private direct messages and a Room bot for group conversations, both with optional n8n workflow integration for AI-powered responses.

## Features

- **Two Specialized Bots**: DM Bot for private conversations and Room Bot for group interactions
- **DM-Only Communication**: DM Bot responds only to direct messages from whitelisted users
- **Room-Specific Communication**: Room Bot responds to messages in a specific configured room
- **User Whitelisting**: Only messages from specified allowed users are processed (for DM Bot)
- **Command-Based Routing**: Support for multi-LLM workflows with command prefixes (!code, !translate, etc.)
- **n8n Integration**: Trigger n8n workflows on incoming messages to automate AI responses
- **Conversation Memory**: Up to 20 messages per user with 30-minute TTL (configurable in n8n)
- **Docker Support**: Easy deployment using Docker and Docker Compose
- **Environment-Based Configuration**: Secure configuration through environment variables

## Bots

### DM Bot (`dmbot/`)
A versatile bot for private direct message conversations. It:
- Responds only to direct messages (verified by room member count)
- Enforces a whitelist of allowed users
- Supports command-based routing for specialized AI assistants (!code, !translate, !analyze)
- Maintains conversation memory per user
- Integrates with n8n workflows for AI-powered responses

**Use cases**: Personal AI assistant, code help, translations, data analysis

### Room Bot (`roombot/`)
A bot configured for group room interactions. It:
- Listens to messages in a specific Matrix room
- Responds to all room members (no whitelist)
- Supports command-based routing for moderation, announcements, etc.
- Maintains separate conversation memory per user (not shared room memory)
- Integrates with n8n workflows for AI-powered responses

**Use cases**: Room moderation, group Q&A, announcements, community assistant

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
   mkdir -p dmbot/data roombot/data n8n/data
   ```

3. Copy the environment example file:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` with your Matrix credentials:
   - `MATRIX_HOMESERVER`: Your Matrix homeserver URL
   - **DM Bot Configuration:**
     - `DMBOT_USER_ID`: User ID for the DM bot
     - `DMBOT_ACCESS_TOKEN`: Access token for the DM bot
     - `DMBOT_ALLOWED_USERS`: Comma-separated list of allowed user IDs (no trailing commas)
   - **Room Bot Configuration:**
     - `ROOMBOT_USER_ID`: User ID for the room bot
     - `ROOMBOT_ACCESS_TOKEN`: Access token for the room bot
     - `TARGET_ROOM_ID`: Matrix room ID for room bot to listen to (format: `!roomHash:homeserver.com`) - **REQUIRED**
   - **n8n Configuration (optional):**
     - `N8N_WEBHOOK_URL`: n8n webhook URL to trigger workflows on incoming messages
     - `N8N_BASIC_AUTH_ACTIVE`: Enable n8n basic authentication (recommended: `true`)
     - `N8N_USER`: n8n basic auth username
     - `N8N_PASSWORD`: n8n basic auth password (use strong password!)

### Running Locally

For each bot directory:

```bash
cd dmbot
npm install
npm start
```

Or for the room bot:

```bash
cd roombot
npm install
npm start
```

### Running with Docker

```bash
docker-compose up -d
```

This will start all services:
- `n8n` - Workflow automation (accessible at http://localhost:5678)
- `dmbot` - DM bot for private conversations
- `roombot` - Room bot for group conversations

## Configuration

Each bot has its own configuration file in `botname/config/config.js`:

**DM Bot** (`dmbot/config/config.js`):
- Matrix homeserver URL
- Access token
- User ID
- List of allowed users
- Response prefixes for different command types
- Help text

**Room Bot** (`roombot/config/config.js`):
- Matrix homeserver URL
- Access token
- User ID
- List of allowed users

**Roombot** (`config.js`):
- Matrix homeserver URL
- Access token
- Matrix homeserver URL
- Access token
- User ID
- Target room ID (which room to listen to)
- Response prefixes for different command types
- Help text

## Usage

### Commands

Both bots support command-based routing for multi-LLM workflows:

**DM Bot - Available Commands:**
- `!help` - Display available commands and bot capabilities
- `!clear` - Clear your conversation memory (handled in n8n workflow)
- `!code <question>` - Route to specialized code assistant LLM
- `!translate <text>` - Route to translation LLM
- `!analyze <data>` - Route to data analysis LLM

**Room Bot - Available Commands:**
- `!help` - Display available commands and bot capabilities
- `!clear` - Clear your conversation memory (handled in n8n workflow)
- `!moderate <topic>` - Route to moderation LLM
- `!announce <message>` - Route to announcement LLM

**Command Rules:**
- Commands must be lowercase (`!code`, not `!Code`)
- Commands without arguments (e.g., `!help`) execute immediately
- Messages without `!` prefix are handled by the default general LLM
- Each bot can have different specialized LLMs configured in n8n

**Memory System:**
- Each user has 20 messages stored (across all command types)
- Memory auto-expires after 30 minutes of inactivity
- Use `!clear` to manually reset conversation history
- Memory is shared across all LLMs in the same bot workflow

### DM Bot
Once running, the DM bot will:
1. Connect to the Matrix homeserver
2. Listen for room invitations (and ignore them)
3. **Verify messages are in DM rooms** (exactly 2 members: bot + user)
4. **Check sender is in whitelist** before responding
5. Parse commands (`!code`, `!help`, etc.) and route to appropriate LLM in n8n
6. Respond with AI-generated messages prefixed with agent name (e.g., `[Code Expert]`)
7. Maintain 20-message conversation history per user with 30-min TTL

### Room Bot
Once running, the room bot will:
1. Connect to the Matrix homeserver
2. Verify `TARGET_ROOM_ID` is configured (fails if not set)
3. Listen for messages in the configured room (`TARGET_ROOM_ID`)
4. Parse commands and route to appropriate LLM in n8n
5. Maintain separate 20-message history per user (not shared room memory)
6. Respond with prefixed messages indicating which LLM handled the request

## n8n Integration

### Setup

1. Create a workflow in your n8n instance that accepts webhook requests
2. Add **Window Buffer Memory Node** with:
   - Session Key: `{{$json.sessionId}}`
   - Context Window Size: 20
   - (Optional) Add custom TTL logic for 30-minute auto-clear
3. Add **Switch Node** to route by `{{$json.commandType}}`:
   - `general` → Default LLM
   - `code` → Code specialist LLM
   - `clear` → Memory clear action
   - Add more as needed
4. Connect all LLM branches to the same Memory node for shared context
5. Copy the webhook URL from the n8n workflow
6. Add the webhook URL to your `.env` file:
   ```bash
   N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-webhook-path
   ```

### Webhook Payload

When a message is received, the bot sends the following JSON payload to the n8n webhook:

```json
{
  "sessionId": "@user:example.com",
  "chatInput": "User's message or command input",
  "commandType": "general|code|clear|help|...",
  "originalMessage": "!code how to reverse string",
  "roomId": "!roomIdHash:example.com",
  "timestamp": "2026-02-06T12:34:56.789Z",
  "botType": "dmbot|roombot"
}
```

**Fields:**
- `sessionId` - Unique user ID for memory isolation (20 messages per user)
- `chatInput` - Extracted input after command prefix (or full message if no command)
- `commandType` - Parsed command for routing (`general` if no `!` prefix)
- `originalMessage` - Full original message including command prefix
- `botType` - Which bot sent the message (`dmbot` or `roombot`)

### n8n Workflow Response Format

Your n8n workflow should return a JSON response:

```json
{
  "output": "AI-generated response text",
  "agentType": "code|general|translate|..."
}
```

**Fields:**
- `output` - Required. The response text to send back to user
- `agentType` - Optional. Used to select response prefix (e.g., `[Code Expert]` vs `[Assistant]`)

### Example n8n Workflow Structure

```
1. Webhook Trigger (receives bot payload)
   ↓
2. Window Buffer Memory (sessionId: {{$json.sessionId}}, size: 20)
   ↓
3. Switch Node (route by {{$json.commandType}})
   ├─ "general" → OpenAI Chat (System: "You are a helpful assistant")
   ├─ "code" → OpenAI Chat (System: "You are a code expert")
   ├─ "clear" → Clear Memory Action
   └─ default → Error handler
   ↓
4. Respond to Webhook (return {output, agentType})
```

This allows you to:
- Process Matrix messages through AI models with conversation memory
- Route different commands to specialized LLMs
- Maintain context across 20 messages per user
- Auto-expire memory after 30 minutes of inactivity

## Development

- Code is written in ES6+ JavaScript
- Uses `matrix-bot-sdk` for Matrix integration
- Uses `axios` for HTTP requests to n8n webhooks
- Environment variables are loaded using `dotenv`

## Security

- ✅ DM verification via room member count (not metadata)
- ✅ User whitelist with empty value filtering (DM Bot)
- ✅ Required TARGET_ROOM_ID validation (Room Bot)
- ✅ HTTPS warning for n8n webhooks (except localhost)
- ✅ 30-second timeout for webhook requests
- ✅ No permanent data storage
- ✅ No arbitrary code execution
- ✅ Requires Node.js 22+ (enforced in package.json)
- ✅ Docker deployment recommended with health checks
- ✅ n8n basic authentication support
- ⚠️ Review SECURITY.md for known transitive dependency vulnerabilities

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Matrix Homeserver                    │
└─────────────────────────────────────────────────────────┘
                │                    │
                │                    │
        ┌───────▼────────┐   ┌──────▼────────┐
        │     DM Bot     │   │   Room Bot    │
        │  (Whitelisted  │   │  (Specific    │
        │      DMs)      │   │    Room)      │
        └───────┬────────┘   └──────┬────────┘
                │                    │
                └──────────┬─────────┘
                           │
                    ┌──────▼──────┐
                    │     n8n     │
                    │  Workflow   │
                    │  (AI/LLM)   │
                    └─────────────┘
```

## License

See LICENSE file for details.
