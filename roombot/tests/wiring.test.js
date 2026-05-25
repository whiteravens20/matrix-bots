import { describe, it, expect } from 'vitest';
import config from '../config/config.js';

describe('roombot wiring', () => {
  it('has room mode configured', () => {
    expect(config.bot.mode).toBe('room');
    expect(config.bot.botType).toBe('roombot');
    expect('targetRoomId' in config.bot).toBe(true);
  });

  it('imports shared modules without error', async () => {
    const { createMessageHandler } = await import('../../shared/lib/handler.js');
    const { createInviteHandler } = await import('../../shared/lib/invite-handler.js');
    expect(typeof createMessageHandler).toBe('function');
    expect(typeof createInviteHandler).toBe('function');
  });
});
