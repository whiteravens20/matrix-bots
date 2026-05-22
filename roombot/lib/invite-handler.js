// Builds the room.invite handler. Dependencies are injected so the handler
// can be unit-tested without a live Matrix client.
export function createInviteHandler({ client, config }) {
  return async (roomId, event) => {
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
  };
}
