export default {
  matrix: {
    homeserverUrl: process.env.MATRIX_HOMESERVER,
    // Option 1: Use static access token (can become invalid if you login manually)
    accessToken: process.env.MATRIX_ACCESS_TOKEN,
    // Option 2: Use username/password for automatic login (recommended)
    username: process.env.MATRIX_USERNAME,
    password: process.env.MATRIX_PASSWORD
  },
  bot: {
    mode: 'room',
    botType: 'roombot',
    fallbackMessageSuffix: ' in this room',
    targetRoomId: process.env.TARGET_ROOM_ID,
    responsePrefix: process.env.BOT_RESPONSE_PREFIX || "[Room Bot]",
    prefixes: {
      general: process.env.BOT_GENERAL_PREFIX || "[Room Assistant]",
      moderate: process.env.BOT_MODERATE_PREFIX || "[Moderator]",
      announce: process.env.BOT_ANNOUNCE_PREFIX || "[Announcement]"
    },
    helpText: process.env.BOT_HELP_TEXT || 
      `🛡️ Room Bot - Available Commands:\n\n` +
      `!help - Show this help message\n` +
      `!clear - Clear conversation memory\n` +
      `!moderate <topic> - Moderation assistance\n` +
      `!announce <message> - Make an announcement\n` +
      `\nGeneral messages (without !) are handled by default room assistant.\n` +
      `\nMemory: Last 20 messages per user, auto-cleared after 30 minutes of inactivity.`
  },
  n8n: {
    webhookUrl: process.env.N8N_WEBHOOK_URL
  }
};
