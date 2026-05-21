import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMessageHandler } from '../lib/handler.js';

const BOT = '@dmbot:hs';
const ROOM = '!dm:hs';
const ALICE = '@alice:hs';

function makeClient({ members = [BOT, ALICE] } = {}) {
  return {
    sendMessage: vi.fn().mockResolvedValue('$event'),
    getJoinedRoomMembers: vi.fn().mockResolvedValue(members),
    sent: function () {
      return this.sendMessage.mock.calls.map(([, content]) => content.body);
    }
  };
}

function makeConfig(overrides = {}) {
  return {
    bot: {
      allowedUsers: [ALICE],
      responsePrefix: '[DM Bot]',
      prefixes: { code: '[Code Expert]' },
      helpText: 'HELP TEXT',
      ...overrides.bot
    },
    n8n: { webhookUrl: 'https://n8n.example/webhook', ...overrides.n8n }
  };
}

function textEvent(body, sender = ALICE) {
  return { sender, content: { msgtype: 'm.text', body } };
}

describe('dmbot message handler', () => {
  let client, axios;

  beforeEach(() => {
    client = makeClient();
    axios = { post: vi.fn().mockResolvedValue({ data: { output: 'n8n reply' } }) };
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('ignores non-text events', async () => {
    const handler = createMessageHandler({ client, config: makeConfig(), axios, botUserId: BOT });
    await handler(ROOM, { sender: ALICE, content: { msgtype: 'm.image' } });
    expect(client.sendMessage).not.toHaveBeenCalled();
  });

  it('ignores its own messages (self-message loop regression)', async () => {
    const handler = createMessageHandler({ client, config: makeConfig(), axios, botUserId: BOT });
    await handler(ROOM, textEvent('[DM Bot] something I said', BOT));
    expect(client.getJoinedRoomMembers).not.toHaveBeenCalled();
    expect(client.sendMessage).not.toHaveBeenCalled();
  });

  it('ignores rooms that are not 1:1 DMs', async () => {
    client = makeClient({ members: [BOT, ALICE, '@carol:hs'] });
    const handler = createMessageHandler({ client, config: makeConfig(), axios, botUserId: BOT });
    await handler(ROOM, textEvent('hello'));
    expect(client.sendMessage).not.toHaveBeenCalled();
  });

  it('ignores messages from non-whitelisted users', async () => {
    const handler = createMessageHandler({ client, config: makeConfig(), axios, botUserId: BOT });
    await handler(ROOM, textEvent('hello', '@stranger:hs'));
    expect(client.sendMessage).not.toHaveBeenCalled();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('returns quietly when room membership cannot be fetched', async () => {
    client.getJoinedRoomMembers.mockRejectedValue(new Error('forbidden'));
    const handler = createMessageHandler({ client, config: makeConfig(), axios, botUserId: BOT });
    await handler(ROOM, textEvent('hello'));
    expect(client.sendMessage).not.toHaveBeenCalled();
  });

  it('answers !help locally without calling n8n', async () => {
    const handler = createMessageHandler({ client, config: makeConfig(), axios, botUserId: BOT });
    await handler(ROOM, textEvent('!help'));
    expect(axios.post).not.toHaveBeenCalled();
    expect(client.sent()).toEqual(['HELP TEXT']);
  });

  it('routes a command to n8n with parsed input and prefixes the reply', async () => {
    const handler = createMessageHandler({ client, config: makeConfig(), axios, botUserId: BOT });
    await handler(ROOM, textEvent('!code reverse a string'));

    expect(axios.post.mock.calls[0][1]).toMatchObject({
      sessionId: ALICE,
      chatInput: 'reverse a string',
      commandType: 'code',
      botType: 'dmbot'
    });
    expect(client.sent()).toEqual(['[DM Bot] n8n reply']);
  });

  it('uses an agentType-specific prefix when n8n returns one', async () => {
    axios.post.mockResolvedValue({ data: { output: 'reply', agentType: 'code' } });
    const handler = createMessageHandler({ client, config: makeConfig(), axios, botUserId: BOT });
    await handler(ROOM, textEvent('!code hi'));
    expect(client.sent()).toEqual(['[Code Expert] reply']);
  });

  it('falls back to a local reply when n8n is not configured', async () => {
    const config = makeConfig({ n8n: { webhookUrl: undefined } });
    const handler = createMessageHandler({ client, config, axios, botUserId: BOT });
    await handler(ROOM, textEvent('hi there'));
    expect(axios.post).not.toHaveBeenCalled();
    expect(client.sent()[0]).toContain('I received your message');
  });

  it('falls back to a local reply when the n8n call throws', async () => {
    axios.post.mockRejectedValue(new Error('connection refused'));
    const handler = createMessageHandler({ client, config: makeConfig(), axios, botUserId: BOT });
    await handler(ROOM, textEvent('hi there'));
    expect(client.sent()[0]).toContain('I received your message');
  });

  it('does not throw when sending the reply fails', async () => {
    client.sendMessage.mockRejectedValue(new Error('matrix down'));
    const handler = createMessageHandler({ client, config: makeConfig(), axios, botUserId: BOT });
    await expect(handler(ROOM, textEvent('!help'))).resolves.toBeUndefined();
  });

  it('handles simultaneous messages independently (no cross-talk)', async () => {
    axios.post.mockImplementation(async (_url, payload) => {
      const delay = payload.chatInput === 'first' ? 30 : 1;
      await new Promise((r) => setTimeout(r, delay));
      return { data: { output: `echo:${payload.chatInput}` } };
    });
    const handler = createMessageHandler({ client, config: makeConfig(), axios, botUserId: BOT });

    await Promise.all([
      handler('!dm-a:hs', textEvent('first')),
      handler('!dm-b:hs', textEvent('second'))
    ]);

    const bodies = client.sent();
    expect(bodies).toHaveLength(2);
    expect(bodies).toContain('[DM Bot] echo:first');
    expect(bodies).toContain('[DM Bot] echo:second');
  });
});
