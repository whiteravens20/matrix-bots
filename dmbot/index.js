import 'dotenv/config';
import { MatrixClient, SimpleFsStorageProvider, MatrixAuth } from "matrix-bot-sdk";
import axios from "axios";
import config from "./config/config.js";
import { parseCommand } from "./lib/commands.js";

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
console.log(`✅ DM Bot started: ${botUserId}`);

// Ignoring invitations
client.on("room.invite", async (roomId, event) => {
  console.log(`Ignoring invitation to room ${roomId} from ${event.sender}`);
});

// DM-only with whitelist
client.on("room.message", async (roomId, event) => {
  try {
    if (!event.content || event.content.msgtype !== "m.text") return;
    if (event.sender === botUserId) return;

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
          botType: 'dmbot'
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
        body: `Hello ${event.sender}, I received your message: "${event.content.body}"`
      });
    } catch (sendError) {
      console.error(`Failed to send message to ${roomId}: ${sendError.message}`);
    }
  } catch (err) {
    console.error(err);
  }
});
