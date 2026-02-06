export default {
  matrix: {
    homeserverUrl: process.env.MATRIX_HOMESERVER,
    accessToken: process.env.MATRIX_ACCESS_TOKEN,
    userId: process.env.MATRIX_USER_ID
  },
  bot: {
    targetRoomId: process.env.TARGET_ROOM_ID,
    responsePrefix: process.env.BOT_RESPONSE_PREFIX || "[RoomBot]",
    codePrefix: process.env.BOT_CODE_PREFIX || "[Moderator]",
    prefixes: {
      general: process.env.BOT_GENERAL_PREFIX || "[RoomBot]",
      moderate: process.env.BOT_MODERATE_PREFIX || "[Moderator]"
    },
    helpText: process.env.BOT_HELP_TEXT || 
      `🛡️ Available Commands:\n\n` +
      `!help - Show this help message\n` +
      `!clear - Clear conversation memory\n` +
      `!moderate <topic> - Moderation assistance\n` +
      `\nGeneral messages (without !) are handled by default room assistant.\n` +
      `\nMemory: Last 20 messages per user, auto-cleared after 30 minutes of inactivity.`
  },
  n8n: {
    webhookUrl: process.env.N8N_WEBHOOK_URL
  }
};
