import { parseCommand } from "./commands.js";

// Builds the room.message handler. Dependencies are injected so the handler
// can be unit-tested without a live Matrix client or n8n instance.
// Bot-specific behaviour is driven by config.bot.mode and related fields.
export function createMessageHandler({ client, config, axios, botUserId }) {
  const mode = config.bot.mode ?? (config.bot.allowedUsers ? 'dm' : config.bot.targetRoomId ? 'room' : 'dm');
  const botType = config.bot.botType ?? mode;
  const fallbackSuffix = config.bot.fallbackMessageSuffix ?? (mode === 'room' ? ' in this room' : '');

  return async (roomId, event) => {
    try {
      if (!event.content || event.content.msgtype !== "m.text") return;
      if (event.sender === botUserId) return;

      // Bot-specific gating
      if (mode === 'dm') {
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
      } else if (mode === 'room') {
        if (roomId !== config.bot.targetRoomId) return;
        console.log(`Message in room ${roomId} from ${event.sender}: ${event.content.body}`);
      }

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
            botType: botType
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
          body: `Hello ${event.sender}, I received your message${fallbackSuffix}: "${event.content.body}"`
        });
      } catch (sendError) {
        console.error(`Failed to send message to ${roomId}: ${sendError.message}`);
      }
    } catch (err) {
      console.error(err);
    }
  };
}
