export default {
  matrix: {
    homeserverUrl: process.env.MATRIX_HOMESERVER,
    accessToken: process.env.MATRIX_ACCESS_TOKEN,
    userId: process.env.MATRIX_USER_ID
  },
  bot: {
    allowedUsers: (process.env.ALLOWED_USERS || "").split(",")
  }
};
