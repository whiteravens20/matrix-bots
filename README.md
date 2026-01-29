# Matrix Bots

A collection of Matrix bots built with Node.js and the Matrix Bot SDK. This repository contains two bots: a general chatbot and a codebot, both designed to handle direct messages (DMs) from whitelisted users with optional n8n workflow integration.

## Features

- **DM-Only Communication**: Bots only respond to direct messages, ignoring room messages.
- **User Whitelisting**: Only messages from specified allowed users are processed.
- **n8n Integration**: Trigger n8n workflows on incoming DMs to automate processes.
- **Docker Support**: Easy deployment using Docker and Docker Compose.
- **Environment-Based Configuration**: Secure configuration through environment variables.

### Bots

#### Chatbot (`chatbot/`)
A basic Matrix bot that echoes back received DMs from allowed users and triggers n8n workflows.

#### Codebot (`codebot/`)
A specialized bot for code-related interactions that also supports n8n workflow integration for automation.

## Setup

### Prerequisites
- Node.js (for local development)
- Docker and Docker Compose (for containerized deployment)
- A Matrix homeserver account with access tokens for each bot

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/whiteravens20/matrix-bots.git
   cd matrix-bots
   ```

2. Copy the environment example file:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` with your Matrix credentials:
   - `MATRIX_HOMESERVER`: Your Matrix homeserver URL
   - `GENERALBOT_USER_ID`: User ID for the chatbot
   - `GENERALBOT_ACCESS_TOKEN`: Access token for the chatbot
   - `GENERALBOT_ALLOWED_USERS`: Comma-separated list of allowed user IDs
   - `CODEBOT_USER_ID`: User ID for the codebot
   - `CODEBOT_ACCESS_TOKEN`: Access token for the codebot
   - `CODEBOT_ALLOWED_USERS`: Comma-separated list of allowed user IDs for codebot
   - `N8N_WEBHOOK_URL` (optional): n8n webhook URL to trigger workflows on incoming DMs

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

Each bot has its own configuration file in `botname/config/config.js`. The configuration includes:
- Matrix homeserver URL
- Access token
- User ID
- List of allowed users

## Usage

Once running, the bots will:
1. Connect to the Matrix homeserver
2. Listen for room invitations (and ignore them)
3. Respond to DMs from whitelisted users with a confirmation message
4. Trigger n8n workflows (if configured) to automate downstream processes

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

## License

See LICENSE file for details.