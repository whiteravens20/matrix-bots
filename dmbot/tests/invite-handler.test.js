import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createInviteHandler } from '../lib/invite-handler.js';

const ROOM = '!dm:hs';
const ALICE = '@alice:hs';
const BOB = '@bob:hs';

function makeClient() {
  return {
    leaveRoom: vi.fn().mockResolvedValue(undefined),
    joinRoom: vi.fn().mockResolvedValue(undefined)
  };
}

function makeConfig(overrides = {}) {
  return {
    bot: {
      allowedUsers: [ALICE],
      ...overrides.bot
    }
  };
}

function inviteEvent(sender = ALICE) {
  return { sender };
}

describe('dmbot invite handler', () => {
  let client;

  beforeEach(() => {
    client = makeClient();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('joins a room when invited by a whitelisted user', async () => {
    const handler = createInviteHandler({ client, config: makeConfig() });
    await handler(ROOM, inviteEvent(ALICE));

    expect(client.joinRoom).toHaveBeenCalledOnce();
    expect(client.joinRoom).toHaveBeenCalledWith(ROOM);
    expect(client.leaveRoom).not.toHaveBeenCalled();
  });

  it('leaves a room when invited by a non-whitelisted user', async () => {
    const handler = createInviteHandler({ client, config: makeConfig() });
    await handler(ROOM, inviteEvent(BOB));

    expect(client.leaveRoom).toHaveBeenCalledOnce();
    expect(client.leaveRoom).toHaveBeenCalledWith(ROOM);
    expect(client.joinRoom).not.toHaveBeenCalled();
  });

  it('logs an error when joining fails', async () => {
    client.joinRoom.mockRejectedValue(new Error('network error'));
    const handler = createInviteHandler({ client, config: makeConfig() });
    await handler(ROOM, inviteEvent(ALICE));

    expect(client.joinRoom).toHaveBeenCalledWith(ROOM);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Failed to join room'));
  });

  it('logs an error when leaving fails', async () => {
    client.leaveRoom.mockRejectedValue(new Error('network error'));
    const handler = createInviteHandler({ client, config: makeConfig() });
    await handler(ROOM, inviteEvent(BOB));

    expect(client.leaveRoom).toHaveBeenCalledWith(ROOM);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Failed to leave room'));
  });

  it('handles empty allowedUsers list by rejecting all invites', async () => {
    const handler = createInviteHandler({ client, config: makeConfig({ bot: { allowedUsers: [] } }) });
    await handler(ROOM, inviteEvent(ALICE));

    expect(client.leaveRoom).toHaveBeenCalledWith(ROOM);
    expect(client.joinRoom).not.toHaveBeenCalled();
  });
});
