import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createInviteHandler } from '../lib/invite-handler.js';

const ROOM = '!room:hs';
const TARGET_ROOM = '!target:hs';
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
      targetRoomId: TARGET_ROOM,
      ...overrides.bot
    }
  };
}

function inviteEvent(sender = ALICE) {
  return { sender };
}

describe('roombot invite handler', () => {
  let client;

  beforeEach(() => {
    client = makeClient();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('leaves an invited room that is not the target room', async () => {
    const handler = createInviteHandler({ client, config: makeConfig() });
    await handler(ROOM, inviteEvent(ALICE));

    expect(client.leaveRoom).toHaveBeenCalledOnce();
    expect(client.leaveRoom).toHaveBeenCalledWith(ROOM);
    expect(client.joinRoom).not.toHaveBeenCalled();
  });

  it('ignores invitation to the target room', async () => {
    const handler = createInviteHandler({ client, config: makeConfig() });
    await handler(TARGET_ROOM, inviteEvent(ALICE));

    expect(client.leaveRoom).not.toHaveBeenCalled();
    expect(client.joinRoom).not.toHaveBeenCalled();
  });

  it('logs an error when leaving fails', async () => {
    client.leaveRoom.mockRejectedValue(new Error('network error'));
    const handler = createInviteHandler({ client, config: makeConfig() });
    await handler(ROOM, inviteEvent(ALICE));

    expect(client.leaveRoom).toHaveBeenCalledWith(ROOM);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Failed to leave room'));
  });

  it('works with different senders', async () => {
    const handler = createInviteHandler({ client, config: makeConfig() });
    await handler(ROOM, inviteEvent(BOB));

    expect(client.leaveRoom).toHaveBeenCalledWith(ROOM);
  });
});
