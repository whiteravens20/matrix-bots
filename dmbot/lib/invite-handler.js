// Builds the room.invite handler. Dependencies are injected so the handler
// can be unit-tested without a live Matrix client.
export function createInviteHandler({ client, config }) {
  return async (roomId, event) => {
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
  };
}
