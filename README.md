# Matrix Bots

A collection of Matrix bots built with Node.js and the Matrix Bot SDK. This repository contains two bots: a general chatbot and a codebot, both designed to handle direct messages (DMs) from whitelisted users.

## Features

- **DM-Only Communication**: Bots only respond to direct messages, ignoring room messages.
- **User Whitelisting**: Only messages from specified allowed users are processed.
- **Docker Support**: Easy deployment using Docker and Docker Compose.
- **Environment-Based Configuration**: Secure configuration through environment variables.

## Bots

### Chatbot (`chatbot/`)
A basic Matrix bot that echoes back received DMs from allowed users.

### Codebot (`codebot/`)
A specialized bot for code-related interactions (functionality can be extended).

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

## Development

- Code is written in ES6+ JavaScript
- Uses `matrix-bot-sdk` for Matrix integration
- Environment variables are loaded using `dotenv`

## License

See LICENSE file for details.