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
console.log(`Bot ${config.matrix.userId} uruchomiony`);

// Ignorowanie zaproszeń
client.on("room.invite", async (roomId, event) => {
  console.log(`Ignoruję zaproszenie do pokoju ${roomId} od ${event.sender}`);
});

// DM-only z whitelistą
client.on("room.message", async (roomId, event) => {
  try {
    if (!event.content || event.content.msgtype !== "m.text") return;
    if (event.sender === config.matrix.userId) return;

    const isDM = event.content?.["m.relates_to"]?.is_direct ?? false;
    if (!isDM) return;

    if (!config.bot.allowedUsers.includes(event.sender)) return;

    console.log(`DM od ${event.sender}: ${event.content.body}`);

    await client.sendMessage(roomId, {
      msgtype: "m.text",
      body: `Cześć ${event.sender}, otrzymałem Twoją wiadomość: "${event.content.body}"`
    });
  } catch (err) {
    console.error(err);
  }
});