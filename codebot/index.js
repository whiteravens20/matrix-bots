import 'dotenv/config';
import { MatrixClient, SimpleFsStorageProvider } from "matrix-bot-sdk";
import axios from "axios";
import config from "./config/config.js";

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

// Ignoring invitations
client.on("room.invite", async (roomId, event) => {
  console.log(`Ignoring invitation to room ${roomId} from ${event.sender}`);
});

// DM-only with whitelist
client.on("room.message", async (roomId, event) => {
  try {
    if (!event.content || event.content.msgtype !== "m.text") return;
    if (event.sender === config.matrix.userId) return;

    // Check if this is a DM by verifying room has only 2 members
    let members;
    try {
      members = await client.getJoinedRoomMembers(roomId);
    } catch (memberError) {
      console.error(`Failed to get room members: ${memberError.message}`);
      return;
    }
    
    const isDM = members.length === 2;
    if (!isDM) return;

    if (!config.bot.allowedUsers.includes(event.sender)) {
      console.log(`Ignoring message from non-whitelisted user: ${event.sender}`);
      return;
    }

    console.log(`DM from ${event.sender}: ${event.content.body}`);

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
        body: `Hello ${event.sender}, I received your message: "${event.content.body}"`
      });
    } catch (sendError) {
      console.error(`Failed to send message to ${roomId}: ${sendError.message}`);
    }
  } catch (err) {
    console.error(err);
  }
});

await client.start();
console.log(`Bot ${config.matrix.userId} started`);