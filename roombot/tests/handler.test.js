import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMessageHandler } from '../lib/handler.js';

const BOT = '@roombot:hs';
const ROOM = '!room:hs';

function makeClient() {
  return {
    sendMessage: vi.fn().mockResolvedValue('$event'),
    sent: function () {
      return this.sendMessage.mock.calls.map(([, content]) => content.body);
    }
  };
}

function makeConfig(overrides = {}) {
  return {
    bot: {
      targetRoomId: ROOM,
      responsePrefix: '[Room Bot]',
      prefixes: { moderate: '[Moderator]' },
      helpText: 'HELP TEXT',
      ...overrides.bot
    },
    n8n: { webhookUrl: 'https://n8n.example/webhook', ...overrides.n8n }
  };
}

function textEvent(body, sender = '@alice:hs') {
  return { sender, content: { msgtype: 'm.text', body } };
}

describe('roombot message handler', () => {
  let client, axios;

  beforeEach(() => {
    client = makeClient();
    axios = { post: vi.fn().mockResolvedValue({ data: { output: 'n8n reply' } }) };
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('ignores non-text events', async () => {
    const handler = createMessageHandler({ client, config: makeConfig(), axios, botUserId: BOT });
    await handler(ROOM, { sender: '@alice:hs', content: { msgtype: 'm.image' } });
    expect(client.sendMessage).not.toHaveBeenCalled();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('ignores its own messages (self-message loop regression)', async () => {
    const handler = createMessageHandler({ client, config: makeConfig(), axios, botUserId: BOT });
    await handler(ROOM, textEvent('[Room Bot] something I said', BOT));
    expect(client.sendMessage).not.toHaveBeenCalled();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('ignores messages from other rooms', async () => {
    const handler = createMessageHandler({ client, config: makeConfig(), axios, botUserId: BOT });
    await handler('!other:hs', textEvent('hello'));
    expect(client.sendMessage).not.toHaveBeenCalled();
  });

  it('answers !help locally without calling n8n', async () => {
    const handler = createMessageHandler({ client, config: makeConfig(), axios, botUserId: BOT });
    await handler(ROOM, textEvent('!help'));
    expect(axios.post).not.toHaveBeenCalled();
    expect(client.sent()).toEqual(['HELP TEXT']);
  });

  it('routes a general message to n8n and prefixes the reply', async () => {
    const handler = createMessageHandler({ client, config: makeConfig(), axios, botUserId: BOT });
    await handler(ROOM, textEvent('how is the weather'));

    expect(axios.post).toHaveBeenCalledOnce();
    const [url, payload] = axios.post.mock.calls[0];
    expect(url).toBe('https://n8n.example/webhook');
    expect(payload).toMatchObject({
      sessionId: '@alice:hs',
      chatInput: 'how is the weather',
      commandType: 'general',
      botType: 'roombot',
      roomId: ROOM
    });
    expect(client.sent()).toEqual(['[Room Bot] n8n reply']);
  });

  it('forwards the parsed command and stripped input to n8n', async () => {
    const handler = createMessageHandler({ client, config: makeConfig(), axios, botUserId: BOT });
    await handler(ROOM, textEvent('!moderate off-topic chatter'));
    expect(axios.post.mock.calls[0][1]).toMatchObject({
      commandType: 'moderate',
      chatInput: 'off-topic chatter'
    });
  });

  it('uses an agentType-specific prefix when n8n returns one', async () => {
    axios.post.mockResolvedValue({ data: { output: 'reply', agentType: 'moderate' } });
    const handler = createMessageHandler({ client, config: makeConfig(), axios, botUserId: BOT });
    await handler(ROOM, textEvent('!moderate spam'));
    expect(client.sent()).toEqual(['[Moderator] reply']);
  });

  it('falls back to a local reply when n8n is not configured', async () => {
    const config = makeConfig({ n8n: { webhookUrl: undefined } });
    const handler = createMessageHandler({ client, config, axios, botUserId: BOT });
    await handler(ROOM, textEvent('hi there'));
    expect(axios.post).not.toHaveBeenCalled();
    expect(client.sent()[0]).toContain('I received your message in this room');
  });

  it('falls back to a local reply when the n8n call throws', async () => {
    axios.post.mockRejectedValue(new Error('connection refused'));
    const handler = createMessageHandler({ client, config: makeConfig(), axios, botUserId: BOT });
    await handler(ROOM, textEvent('hi there'));
    expect(client.sent()[0]).toContain('I received your message in this room');
  });

  it('falls back when n8n responds without an output field', async () => {
    axios.post.mockResolvedValue({ data: {} });
    const handler = createMessageHandler({ client, config: makeConfig(), axios, botUserId: BOT });
    await handler(ROOM, textEvent('hi there'));
    expect(client.sent()[0]).toContain('I received your message in this room');
  });

  it('does not throw when sending the reply fails', async () => {
    client.sendMessage.mockRejectedValue(new Error('matrix down'));
    const handler = createMessageHandler({ client, config: makeConfig(), axios, botUserId: BOT });
    await expect(handler(ROOM, textEvent('!help'))).resolves.toBeUndefined();
  });

  it('handles simultaneous messages independently (no cross-talk)', async () => {
    // n8n echoes the input back, with a delay that makes the two calls interleave.
    axios.post.mockImplementation(async (_url, payload) => {
      const delay = payload.chatInput === 'first' ? 30 : 1;
      await new Promise((r) => setTimeout(r, delay));
      return { data: { output: `echo:${payload.chatInput}` } };
    });
    const handler = createMessageHandler({ client, config: makeConfig(), axios, botUserId: BOT });

    await Promise.all([
      handler(ROOM, textEvent('first', '@alice:hs')),
      handler(ROOM, textEvent('second', '@bob:hs'))
    ]);

    const bodies = client.sent();
    expect(bodies).toHaveLength(2);
    expect(bodies).toContain('[Room Bot] echo:first');
    expect(bodies).toContain('[Room Bot] echo:second');
  });
});
