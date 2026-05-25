import { describe, it, expect } from 'vitest';
import config from '../config/config.js';

describe('dmbot wiring', () => {
  it('has dm mode configured', () => {
    expect(config.bot.mode).toBe('dm');
    expect(config.bot.botType).toBe('dmbot');
    expect(config.bot.allowedUsers).toBeDefined();
  });

  it('imports shared modules without error', async () => {
    const { createMessageHandler } = await import('../../shared/lib/handler.js');
    const { createInviteHandler } = await import('../../shared/lib/invite-handler.js');
    expect(typeof createMessageHandler).toBe('function');
    expect(typeof createInviteHandler).toBe('function');
  });
});
