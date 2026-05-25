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

function makeConfig(mode, overrides = {}) {
  const base = {
    bot: {}
  };

  if (mode === 'dm') {
    base.bot.mode = 'dm';
    base.bot.allowedUsers = [ALICE];
  } else if (mode === 'room') {
    base.bot.mode = 'room';
    base.bot.targetRoomId = TARGET_ROOM;
  }

  base.bot = { ...base.bot, ...overrides.bot };

  return base;
}

function inviteEvent(sender = ALICE) {
  return { sender };
}

describe('createInviteHandler', () => {
  let client;

  beforeEach(() => {
    client = makeClient();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('DM mode', () => {
    it('joins a room when invited by a whitelisted user', async () => {
      const handler = createInviteHandler({ client, config: makeConfig('dm') });
      await handler(ROOM, inviteEvent(ALICE));

      expect(client.joinRoom).toHaveBeenCalledOnce();
      expect(client.joinRoom).toHaveBeenCalledWith(ROOM);
      expect(client.leaveRoom).not.toHaveBeenCalled();
    });

    it('leaves a room when invited by a non-whitelisted user', async () => {
      const handler = createInviteHandler({ client, config: makeConfig('dm') });
      await handler(ROOM, inviteEvent(BOB));

      expect(client.leaveRoom).toHaveBeenCalledOnce();
      expect(client.leaveRoom).toHaveBeenCalledWith(ROOM);
      expect(client.joinRoom).not.toHaveBeenCalled();
    });

    it('logs an error when joining fails', async () => {
      client.joinRoom.mockRejectedValue(new Error('network error'));
      const handler = createInviteHandler({ client, config: makeConfig('dm') });
      await handler(ROOM, inviteEvent(ALICE));

      expect(client.joinRoom).toHaveBeenCalledWith(ROOM);
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Failed to join room'));
    });

    it('logs an error when leaving fails', async () => {
      client.leaveRoom.mockRejectedValue(new Error('network error'));
      const handler = createInviteHandler({ client, config: makeConfig('dm') });
      await handler(ROOM, inviteEvent(BOB));

      expect(client.leaveRoom).toHaveBeenCalledWith(ROOM);
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Failed to leave room'));
    });

    it('handles empty allowedUsers list by rejecting all invites', async () => {
      const handler = createInviteHandler({ client, config: makeConfig('dm', { bot: { allowedUsers: [] } }) });
      await handler(ROOM, inviteEvent(ALICE));

      expect(client.leaveRoom).toHaveBeenCalledWith(ROOM);
      expect(client.joinRoom).not.toHaveBeenCalled();
    });
  });

  describe('Room mode', () => {
    it('leaves an invited room that is not the target room', async () => {
      const handler = createInviteHandler({ client, config: makeConfig('room') });
      await handler(ROOM, inviteEvent(ALICE));

      expect(client.leaveRoom).toHaveBeenCalledOnce();
      expect(client.leaveRoom).toHaveBeenCalledWith(ROOM);
      expect(client.joinRoom).not.toHaveBeenCalled();
    });

    it('ignores invitation to the target room', async () => {
      const handler = createInviteHandler({ client, config: makeConfig('room') });
      await handler(TARGET_ROOM, inviteEvent(ALICE));

      expect(client.leaveRoom).not.toHaveBeenCalled();
      expect(client.joinRoom).not.toHaveBeenCalled();
    });

    it('logs an error when leaving fails', async () => {
      client.leaveRoom.mockRejectedValue(new Error('network error'));
      const handler = createInviteHandler({ client, config: makeConfig('room') });
      await handler(ROOM, inviteEvent(ALICE));

      expect(client.leaveRoom).toHaveBeenCalledWith(ROOM);
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Failed to leave room'));
    });

    it('works with different senders', async () => {
      const handler = createInviteHandler({ client, config: makeConfig('room') });
      await handler(ROOM, inviteEvent(BOB));

      expect(client.leaveRoom).toHaveBeenCalledWith(ROOM);
    });
  });

  describe('config validation', () => {
    it('throws on construction when mode is missing', () => {
      expect(() => createInviteHandler({ client: makeClient(), config: { bot: {} } }))
        .toThrow(/invalid config\.bot\.mode/);
    });

    it('throws on construction when mode is unknown', () => {
      expect(() => createInviteHandler({ client: makeClient(), config: { bot: { mode: 'broadcast' } } }))
        .toThrow(/invalid config\.bot\.mode "broadcast"/);
    });
  });
});
