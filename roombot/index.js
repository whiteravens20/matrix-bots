import 'dotenv/config';
import { MatrixClient, SimpleFsStorageProvider, MatrixAuth } from "matrix-bot-sdk";
import axios from "axios";
import config from "./config/config.js";
import { createMessageHandler } from "./lib/handler.js";
import { createInviteHandler } from "./lib/invite-handler.js";

// Validate TARGET_ROOM_ID is set
if (!config.bot.targetRoomId) {
  throw new Error("TARGET_ROOM_ID must be set in environment variables");
}

// Initialize storage
const storage = new SimpleFsStorageProvider(`./data/bot-storage.json`);

// Initialize client with login
let client;
if (config.matrix.accessToken) {
  // Use provided access token (backward compatibility)
  console.log("Using provided access token");
  client = new MatrixClient(
    config.matrix.homeserverUrl,
    config.matrix.accessToken,
    storage
  );
} else if (config.matrix.username && config.matrix.password) {
  // Login with username/password to get fresh token
  console.log("Logging in with username and password...");
  const auth = new MatrixAuth(config.matrix.homeserverUrl);
  const clientData = await auth.passwordLogin(config.matrix.username, config.matrix.password);
  
  console.log(`✅ Login successful! User ID: ${clientData.userId}`);
  
  client = new MatrixClient(
    config.matrix.homeserverUrl,
    clientData.accessToken,
    storage
  );
} else {
  throw new Error("Either MATRIX_ACCESS_TOKEN or both MATRIX_USERNAME and MATRIX_PASSWORD must be provided");
}

// Validate n8n webhook URL security
if (config.n8n.webhookUrl && !config.n8n.webhookUrl.startsWith('https://') && !config.n8n.webhookUrl.includes('localhost') && !config.n8n.webhookUrl.includes('127.0.0.1')) {
  console.warn("⚠️  WARNING: n8n webhook URL should use HTTPS in production!");
}

// Start the client first
await client.start();

// Get bot's user ID
const botUserId = await client.getUserId();
console.log(`✅ Room Bot started: ${botUserId} - Listening in room: ${config.bot.targetRoomId}`);

// Reject invitations to non-target rooms
client.on("room.invite", createInviteHandler({ client, config }));

// Listen for messages in configured room only
client.on("room.message", createMessageHandler({ client, config, axios, botUserId }));
