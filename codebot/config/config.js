export default {
  matrix: {
    homeserverUrl: process.env.MATRIX_HOMESERVER,
    accessToken: process.env.MATRIX_ACCESS_TOKEN,
    userId: process.env.MATRIX_USER_ID
  },
  bot: {
    allowedUsers: (process.env.ALLOWED_USERS || "").split(",").filter(u => u.trim()),
    responsePrefix: process.env.BOT_RESPONSE_PREFIX || "[CodeBot]",
    codePrefix: process.env.BOT_CODE_PREFIX || "[Code Expert]",
    prefixes: {
      general: process.env.BOT_GENERAL_PREFIX || "[CodeBot]",
      code: process.env.BOT_CODE_PREFIX || "[Code Expert]",
      review: process.env.BOT_REVIEW_PREFIX || "[Code Reviewer]"
    },
    helpText: process.env.BOT_HELP_TEXT || 
      `💻 Available Commands:\n\n` +
      `!help - Show this help message\n` +
      `!clear - Clear conversation memory\n` +
      `!code <question> - Programming assistance\n` +
      `!review <code> - Code review\n` +
      `\nGeneral messages (without !) are handled by default code assistant.\n` +
      `\nMemory: Last 20 messages per user, auto-cleared after 30 minutes of inactivity.`
  },
  n8n: {
    webhookUrl: process.env.N8N_WEBHOOK_URL
  }
};
