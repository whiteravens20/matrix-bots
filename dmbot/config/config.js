export default {
  matrix: {
    homeserverUrl: process.env.MATRIX_HOMESERVER,
    accessToken: process.env.MATRIX_ACCESS_TOKEN,
    userId: process.env.MATRIX_USER_ID
  },
  bot: {
    allowedUsers: (process.env.ALLOWED_USERS || "").split(",").filter(u => u.trim()),
    responsePrefix: process.env.BOT_RESPONSE_PREFIX || "[DM Bot]",
    prefixes: {
      general: process.env.BOT_GENERAL_PREFIX || "[Assistant]",
      code: process.env.BOT_CODE_PREFIX || "[Code Expert]",
      translate: process.env.BOT_TRANSLATE_PREFIX || "[Translator]",
      analyze: process.env.BOT_ANALYZE_PREFIX || "[Analyst]"
    },
    helpText: process.env.BOT_HELP_TEXT || 
      `🤖 DM Bot - Available Commands:\n\n` +
      `!help - Show this help message\n` +
      `!clear - Clear conversation memory\n` +
      `!code <question> - Ask code-related questions\n` +
      `!translate <text> - Translate text\n` +
      `!analyze <data> - Analyze data or text\n` +
      `\nGeneral messages (without !) are handled by default assistant.\n` +
      `\nMemory: Last 20 messages per user, auto-cleared after 30 minutes of inactivity.`
  },
  n8n: {
    webhookUrl: process.env.N8N_WEBHOOK_URL
  }
};
