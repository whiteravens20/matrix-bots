// Builds the room.invite handler. Dependencies are injected so the handler
// can be unit-tested without a live Matrix client.
// Bot-specific behaviour is driven by config.bot.mode.
export function createInviteHandler({ client, config }) {
  const { mode } = config.bot;

  if (mode !== 'dm' && mode !== 'room') {
    throw new Error(`createInviteHandler: invalid config.bot.mode "${mode}" (expected "dm" or "room")`);
  }

  return async (roomId, event) => {
    if (mode === 'dm') {
      const sender = event.sender;

      if (config.bot.allowedUsers.includes(sender)) {
        console.log(`Accepting DM invitation from whitelisted user ${sender} to room ${roomId}`);
        try {
          await client.joinRoom(roomId);
        } catch (err) {
          console.error(`Failed to join room ${roomId}: ${err.message}`);
        }
      } else {
        console.log(`Rejecting invitation to room ${roomId} from non-whitelisted user ${sender}`);
        try {
          await client.leaveRoom(roomId);
        } catch (err) {
          console.error(`Failed to leave room ${roomId}: ${err.message}`);
        }
      }
    } else {
      if (roomId === config.bot.targetRoomId) {
        console.log(`Ignoring invitation to target room ${roomId} from ${event.sender}`);
        return;
      }

      console.log(`Rejecting invitation to room ${roomId} from ${event.sender}`);
      try {
        await client.leaveRoom(roomId);
      } catch (err) {
        console.error(`Failed to leave room ${roomId}: ${err.message}`);
      }
    }
  };
}
