export default {
  matrix: {
    homeserverUrl: process.env.MATRIX_HOMESERVER,
    accessToken: process.env.MATRIX_ACCESS_TOKEN,
    userId: process.env.MATRIX_USER_ID
  },
  bot: {
    targetRoomId: process.env.TARGET_ROOM_ID
  },
  n8n: {
    webhookUrl: process.env.N8N_WEBHOOK_URL
  }
};
