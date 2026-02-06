# n8n Workflow Setup Guide

## Multi-LLM Bot with Shared Memory

This guide shows how to set up an n8n workflow for Matrix bots with command-based routing and shared conversation memory.

---

## Architecture

```
Matrix Bot → n8n Webhook
              ↓
       Window Buffer Memory (20 messages per user)
              ↓
       Switch Node (route by commandType)
         ├─ general → General LLM
         ├─ code → Code Expert LLM
         ├─ clear → Clear Memory
         └─ default → Unknown command handler
              ↓
       Respond to Webhook
              ↓
Matrix Bot → User
```

---

## Step-by-Step Setup

### 1. Create Webhook Trigger

**Node Type:** `Webhook`

**Configuration:**
- HTTP Method: `POST`
- Path: `/webhook/chatbot` (or `/codebot`, `/roombot`)
- Response Mode: `Respond to Webhook`
- Authentication: None (or Basic Auth if configured)

**Test Payload:**
```json
{
  "sessionId": "@alice:matrix.org",
  "chatInput": "How do I reverse a string?",
  "commandType": "code",
  "originalMessage": "!code How do I reverse a string?",
  "roomId": "!abc123:matrix.org",
  "timestamp": "2026-02-06T14:30:00.000Z",
  "botType": "chatbot"
}
```

---

### 2. Add Window Buffer Memory

**Node Type:** `Window Buffer Memory`

**Configuration:**
- Session Key: `{{ $json.sessionId }}`
- Context Window Size: `20`

**Purpose:** Stores last 20 messages per user. Automatically shared across all command routes.

---

### 3. Create Command Router (Switch Node)

**Node Type:** `Switch`

**Mode:** Expression

**Rules:**
1. **Code Command**
   - Expression: `{{ $json.commandType === "code" }}`
   - Output: Route to Code LLM

2. **Clear Command**
   - Expression: `{{ $json.commandType === "clear" }}`
   - Output: Route to Memory Clear

3. **General (Default)**
   - Expression: `{{ true }}`
   - Output: Route to General LLM

**Add more routes as needed** (translate, review, moderate, etc.)

---

### 4. Set Up LLM Branches

#### 4a. General LLM Node

**Node Type:** `OpenAI Chat Model` (or `Anthropic Chat`)

**Configuration:**
- Model: `gpt-4o-mini` or `claude-3-5-sonnet-20241022`
- System Message:
  ```
  You are a helpful, friendly assistant. Provide clear and concise answers.
  ```
- User Message: `{{ $json.chatInput }}`
- Memory: **Connect to Window Buffer Memory node**
- Temperature: `0.7`

**Output Field:** `output`

---

#### 4b. Code Expert LLM Node

**Node Type:** `OpenAI Chat Model` (or `Anthropic Chat`)

**Configuration:**
- Model: `gpt-4o` or `claude-3-5-sonnet-20241022`
- System Message:
  ```
  You are an expert programmer. Help with code debugging, explanations, and best practices.
  Provide code examples when helpful. Be technical and precise.
  ```
- User Message: `{{ $json.chatInput }}`
- Memory: **Connect to Window Buffer Memory node**
- Temperature: `0.3`

**Output Field:** `output`

---

#### 4c. Clear Memory Branch

**Node Type:** `Code` (JavaScript)

**Code:**
```javascript
// Clear memory by returning empty context
// (Window Buffer Memory will handle clearing via sessionId management)

return {
  json: {
    output: "✅ Conversation memory cleared successfully.",
    agentType: "system",
    memoryCleared: true
  }
};
```

**Note:** For proper memory clearing, you may need to use n8n's API or custom Redis logic if persisting beyond session.

---

### 5. Add Response Formatter (Optional)

**Node Type:** `Code` (JavaScript)

**Purpose:** Add agentType metadata for bot to use correct prefix

**Code:**
```javascript
const items = $input.all();
const response = items[0].json;

// Determine which branch this came from
let agentType = "general";
if ($node["Code Expert LLM"].json) {
  agentType = "code";
} else if ($node["Clear Memory"].json) {
  agentType = "system";
}

return {
  json: {
    output: response.output || response.message || response.text,
    agentType: agentType
  }
};
```

---

### 6. Respond to Webhook

**Node Type:** `Respond to Webhook`

**Configuration:**
- Response Code: `200`
- Response Body:
  ```json
  {
    "output": "={{ $json.output }}",
    "agentType": "={{ $json.agentType }}"
  }
  ```

---

## Advanced: 30-Minute TTL (Auto-Clear Memory)

To implement 30-minute auto-expiration:

### Option A: Use Redis

Replace Window Buffer Memory with Redis nodes:

**Store Message:**
```javascript
// After LLM response, store in Redis
const sessionKey = `memory:${$json.sessionId}`;
const ttl = 1800; // 30 minutes in seconds

// RPUSH to list, then EXPIRE
await redis.rpush(sessionKey, JSON.stringify({
  role: "user",
  content: $json.chatInput,
  timestamp: Date.now()
}));
await redis.expire(sessionKey, ttl);
```

### Option B: Custom Timestamp Logic

Add timestamp check in Code node:

```javascript
const lastActivity = $json.lastActivityTimestamp;
const now = Date.now();
const thirtyMinutes = 30 * 60 * 1000;

if (now - lastActivity > thirtyMinutes) {
  // Clear memory and start fresh
  return {
    json: {
      ...$ json,
      memoryExpired: true,
      conversationHistory: []
    }
  };
}

// Continue with existing memory
return { json: $json };
```

---

## Testing Your Workflow

### 1. Test General Command

Send to bot:
```
Hello, what can you do?
```

Expected payload:
```json
{
  "commandType": "general",
  "chatInput": "Hello, what can you do?"
}
```

Expected response: Friendly introduction from General LLM

---

### 2. Test Code Command

Send to bot:
```
!code How to reverse a string in Python?
```

Expected payload:
```json
{
  "commandType": "code",
  "chatInput": "How to reverse a string in Python?"
}
```

Expected response: Technical code explanation from Code Expert LLM

---

### 3. Test Memory

Send sequence:
```
1. "My name is Alice"
2. "What's my name?"
```

Expected: Second response should reference "Alice" from memory

---

### 4. Test Clear

Send to bot:
```
!clear
```

Expected: Memory cleared confirmation, then asking name again should not remember

---

## Multiple Bots Setup

To run separate workflows for each bot:

1. **Create 3 workflows** (one per bot):
   - Chatbot Workflow: `/webhook/chatbot`
   - CodeBot Workflow: `/webhook/codebot`
   - RoomBot Workflow: `/webhook/roombot`

2. **Same Memory sessionId**: All use `{{ $json.sessionId }}` (user ID)
   - User can talk to ChatBot, then switch to CodeBot
   - CodeBot will see conversation history from ChatBot
   - Shared context across bots!

3. **Different System Prompts**:
   - ChatBot: "You are a helpful general assistant"
   - CodeBot: "You are an expert programmer"
   - RoomBot: "You are a room moderator"

4. **Configure .env** for each bot:
   ```bash
   # In docker-compose.yml
   CHATBOT: N8N_WEBHOOK_URL=http://n8n:5678/webhook/chatbot
   CODEBOT: N8N_WEBHOOK_URL=http://n8n:5678/webhook/codebot
   ROOMBOT: N8N_WEBHOOK_URL=http://n8n:5678/webhook/roombot
   ```

---

## Customization Tips

### Add More Commands

In Switch node, add new route:
- Expression: `{{ $json.commandType === "translate" }}`
- Connect to Translation LLM with system prompt: "You are a professional translator"

Update bot config help text to include `!translate`

### Change Memory Size

In Window Buffer Memory:
- Context Window Size: `10` (fewer messages)
- Context Window Size: `50` (more context, but higher token cost)

### Add Logging

Add Code node after webhook:
```javascript
console.log(`[${$json.botType}] ${$json.sessionId}: ${$json.commandType}`);
return { json: $json };
```

### Cost Optimization

- Use `gpt-4o-mini` instead of `gpt-4o` for general queries
- Use `claude-3-5-haiku` for simple code questions
- Cache system prompts (if API supports)

---

## Troubleshooting

### Bot doesn't respond
- Check n8n webhook URL is correct in `.env`
- Check n8n workflow is activated
- Check execution log in n8n for errors

### Memory doesn't persist
- Verify sessionId is consistent (user ID)
- Check Window Buffer Memory is connected to all LLM nodes
- Test with n8n execution panel to see memory state

### Wrong LLM responds
- Check commandType parsing in bot (lowercase)
- Verify Switch node expressions match command names
- Test payload directly in n8n webhook

### Timeout errors
- Bot timeout is 30s, ensure n8n responds within that
- For slow AI models, consider async processing
- Check n8n execution time in logs

---

## Example Complete Workflow Summary

**Nodes (7 total):**
1. Webhook Trigger
2. Window Buffer Memory
3. Switch (Command Router)
4. General LLM (OpenAI/Claude)
5. Code LLM (OpenAI/Claude)
6. Clear Memory (Code node)
7. Respond to Webhook

**Execution Flow:**
```
User sends "!code fix my bug"
  → Bot parses command: {commandType: "code", chatInput: "fix my bug"}
  → n8n receives webhook
  → Memory loads last 20 messages
  → Switch routes to Code LLM
  → Code LLM generates response with context
  → Response sent back: {output: "Here's how to fix...", agentType: "code"}
  → Bot adds prefix: "[Code Expert] Here's how to fix..."
  → User receives prefixed response
  → Memory stores user msg + AI response (now 21, oldest dropped)
```

---

## Next Steps

1. Import this workflow structure to n8n
2. Configure OpenAI/Anthropic API keys
3. Test each command type
4. Customize system prompts for your use case
5. Add more specialized LLMs as needed
6. Monitor token usage and costs

For questions or issues, refer to:
- [n8n Documentation](https://docs.n8n.io)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Matrix Bot SDK](https://github.com/turt2live/matrix-bot-sdk)
