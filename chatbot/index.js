import 'dotenv/config';
import { MatrixClient, SimpleFsStorageProvider } from "matrix-bot-sdk";
import config from "./config/config.js";

const storage = new SimpleFsStorageProvider("./bot.json");
const client = new MatrixClient(
  config.matrix.homeserverUrl,
  config.matrix.accessToken,
  storage
);

await client.start();
console.log(`Bot ${config.matrix.userId} started`);

// Ignoring invitations
client.on("room.invite", async (roomId, event) => {
  console.log(`Ignoring invitation to room ${roomId} from ${event.sender}`);
});

// DM-only with whitelist
client.on("room.message", async (roomId, event) => {
  try {
    if (!event.content || event.content.msgtype !== "m.text") return;
    if (event.sender === config.matrix.userId) return;

    const isDM = event.content?.["m.relates_to"]?.is_direct ?? false;
    if (!isDM) return;

    if (!config.bot.allowedUsers.includes(event.sender)) return;

    console.log(`DM from ${event.sender}: ${event.content.body}`);

    await client.sendMessage(roomId, {
      msgtype: "m.text",
      body: `Hello ${event.sender}, I received your message: "${event.content.body}"`
    });
  } catch (err) {
    console.error(err);
  }
});