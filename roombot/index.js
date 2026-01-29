import 'dotenv/config';
import { MatrixClient, SimpleFsStorageProvider } from "matrix-bot-sdk";
import axios from "axios";
import config from "./config/config.js";

const storage = new SimpleFsStorageProvider("./bot.json");
const client = new MatrixClient(
  config.matrix.homeserverUrl,
  config.matrix.accessToken,
  storage
);

await client.start();
console.log(`Room Bot ${config.matrix.userId} started`);

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
        });
        console.log(`n8n workflow triggered for message from ${event.sender}`);
      } catch (webhookError) {
        console.error(`Error triggering n8n workflow: ${webhookError.message}`);
      }
    }

    await client.sendMessage(roomId, {
      msgtype: "m.text",
      body: `Hello ${event.sender}, I received your message in this room: "${event.content.body}"`
    });
  } catch (err) {
    console.error(err);
  }
});
