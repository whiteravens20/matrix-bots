import 'dotenv/config';
import { MatrixClient, SimpleFsStorageProvider } from "matrix-bot-sdk";
import axios from "axios";
import config from "./config/config.js";

// Validate TARGET_ROOM_ID is set
if (!config.bot.targetRoomId) {
  throw new Error("TARGET_ROOM_ID must be set in environment variables");
}

const storage = new SimpleFsStorageProvider(`./bot-${config.matrix.userId.replace(/[^a-z0-9]/gi, '_')}.json`);
const client = new MatrixClient(
  config.matrix.homeserverUrl,
  config.matrix.accessToken,
  storage
);

// Validate n8n webhook URL security
if (config.n8n.webhookUrl && !config.n8n.webhookUrl.startsWith('https://') && !config.n8n.webhookUrl.includes('localhost') && !config.n8n.webhookUrl.includes('127.0.0.1')) {
  console.warn("⚠️  WARNING: n8n webhook URL should use HTTPS in production!");
}

// Ignore invitations
client.on("room.invite", async (roomId, event) => {
  console.log(`Ignoring invitation to room ${roomId} from ${event.sender}`);
});

// Listen for messages in configured room only
client.on("room.message", async (roomId, event) => {
  try {
    if (!event.content || event.content.msgtype !== "m.text") return;
    if (event.sender === config.matrix.userId) return;

    // Only respond to messages in the configured room
    if (roomId !== config.bot.targetRoomId) return;

    console.log(`Message in room ${roomId} from ${event.sender}: ${event.content.body}`);

    // Trigger n8n workflow if webhook URL is configured
    if (config.n8n.webhookUrl) {
      try {
        await axios.post(config.n8n.webhookUrl, {
          sender: event.sender,
          message: event.content.body,
          roomId: roomId,
          timestamp: new Date().toISOString()
        }, {
          timeout: 5000,
          headers: { 'Content-Type': 'application/json' }
        });
        console.log(`n8n workflow triggered for message from ${event.sender}`);
      } catch (webhookError) {
        console.error(`Error triggering n8n workflow: ${webhookError.message}`);
      }
    }

    try {
      await client.sendMessage(roomId, {
        msgtype: "m.text",
        body: `Hello ${event.sender}, I received your message in this room: "${event.content.body}"`
      });
    } catch (sendError) {
      console.error(`Failed to send message to ${roomId}: ${sendError.message}`);
    }
  } catch (err) {
    console.error(err);
  }
});

await client.start();
console.log(`Room Bot ${config.matrix.userId} started in room ${config.bot.targetRoomId}`);
