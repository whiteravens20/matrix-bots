import 'dotenv/config';
import { MatrixClient, SimpleFsStorageProvider } from "matrix-bot-sdk";
import axios from "axios";
import config from "./config/config.js";

// Command parser for multi-LLM routing
function parseCommand(message) {
  const trimmed = message.trim();
  
  // Check if message starts with !
  if (!trimmed.startsWith('!')) {
    return {
      command: 'general',
      input: message,
      isCommand: false
    };
  }
  
  // Extract command (lowercase only) and input
  const firstSpace = trimmed.indexOf(' ');
  if (firstSpace === -1) {
    // Command without arguments (e.g., "!help")
    return {
      command: trimmed.substring(1).toLowerCase(),
      input: '',
      isCommand: true
    };
  }
  
  const command = trimmed.substring(1, firstSpace).toLowerCase();
  const input = trimmed.substring(firstSpace + 1).trim();
  
  return {
    command: command,
    input: input,
    isCommand: true
  };
}

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

    // Parse command
    const parsed = parseCommand(event.content.body);
    
    // Handle !help command locally
    if (parsed.command === 'help') {
      try {
        await client.sendMessage(roomId, {
          msgtype: "m.text",
          body: config.bot.helpText
        });
      } catch (sendError) {
        console.error(`Failed to send help message: ${sendError.message}`);
      }
      return;
    }

    // Send to n8n with command routing and memory
    if (config.n8n.webhookUrl) {
      try {
        const response = await axios.post(config.n8n.webhookUrl, {
          sessionId: event.sender,
          chatInput: parsed.input || event.content.body,
          commandType: parsed.command,
          originalMessage: event.content.body,
          roomId: roomId,
          timestamp: new Date().toISOString(),
          botType: 'roombot'
        }, {
          timeout: 30000,
          headers: { 'Content-Type': 'application/json' }
        });
        
        console.log(`n8n workflow processed message from ${event.sender}`);
        
        // Send AI response from n8n with prefix
        if (response.data?.output) {
          let prefix = config.bot.responsePrefix;
          if (response.data.agentType && config.bot.prefixes?.[response.data.agentType]) {
            prefix = config.bot.prefixes[response.data.agentType];
          }
          
          const formattedResponse = prefix ? `${prefix} ${response.data.output}` : response.data.output;
          
          try {
            await client.sendMessage(roomId, {
              msgtype: "m.text",
              body: formattedResponse
            });
            return;
          } catch (sendError) {
            console.error(`Failed to send n8n response to ${roomId}: ${sendError.message}`);
          }
        }
      } catch (webhookError) {
        console.error(`Error with n8n workflow: ${webhookError.message}`);
      }
    }

    // Fallback response if n8n not configured or error occurred
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
