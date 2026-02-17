# Getting Bot Credentials

This guide explains how to set up bot accounts and get credentials for Matrix bots.

## Quick Start (Recommended Method)

The easiest and most reliable way is to use **username/password authentication**:

### 1. Create Bot Account

Create a regular Matrix account for your bot on your homeserver:
- Username: `dmbot` (or any name you prefer)
- Password: Choose a strong password
- Complete registration

### 2. Configure Environment

In your `.env` file:
```bash
MATRIX_HOMESERVER=https://matrix.example.com
DMBOT_USERNAME=dmbot
DMBOT_PASSWORD=your_secure_password
```

### 3. Done!

The bot will automatically log in and get an access token on startup. No manual token generation needed!

---

## Alternative: Using Access Tokens

If you prefer to use static access tokens (not recommended due to token invalidation issues):

### Method 1: Using Element Web

1. Log into your bot account in Element Web
2. Go to Settings → Help & About
3. Scroll down to "Access Token"
4. Click to reveal and copy the token
5. ⚠️ **Warning**: This token will be invalidated if you log in again

### Method 2: Using curl

```bash
curl -X POST \
  "https://matrix.example.com/_matrix/client/r0/login" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "m.login.password",
    "identifier": {
      "type": "m.id.user",
      "user": "dmbot"
    },
    "password": "your_password"
  }'
```

Response will contain `access_token`.

### Method 3: Using Python

```python
import requests

response = requests.post(
    "https://matrix.example.com/_matrix/client/r0/login",
    json={
        "type": "m.login.password",
        "identifier": {
            "type": "m.id.user",
            "user": "dmbot"
        },
        "password": "your_password"
    }
)

data = response.json()
print(f"Access Token: {data['access_token']}")
print(f"User ID: {data['user_id']}")
```

---

## Troubleshooting

### "Invalid access token" Error

**Problem**: Your access token stopped working.

**Causes**:
- You logged into the bot account manually
- The token expired
- The homeserver invalidated the session

**Solution**: Switch to username/password authentication:
```bash
# In .env, replace:
DMBOT_ACCESS_TOKEN=syt_...

# With:
DMBOT_USERNAME=dmbot
DMBOT_PASSWORD=your_password
```

### Bot can't log in

**Check**:
1. Username is correct (without `@` or `:homeserver.com`)
2. Password is correct
3. Homeserver URL is correct and accessible
4. Account is not locked or banned

### "User not found" Error

Make sure you're using just the username:
- ✅ Correct: `DMBOT_USERNAME=dmbot`
- ❌ Wrong: `DMBOT_USERNAME=@dmbot:example.com`

---

## Security Best Practices

### For Production Deployments

1. **Use Username/Password**: More reliable than static tokens
2. **Strong Passwords**: Use passwords with 20+ random characters
3. **Dedicated Accounts**: Create separate accounts for each bot
4. **Environment Variables**: Never commit credentials to git
5. **Restricted Permissions**: Bot accounts should only have necessary permissions
6. **Monitor Activity**: Check bot logs regularly for suspicious activity

### Example Strong Password Generation

```bash
# Linux/macOS
openssl rand -base64 32

# Or use a password manager
```

---

## Minimum Account Requirements

Your bot accounts need:
- ✅ Ability to send messages in DMs (DM Bot) or rooms (Room Bot)
- ✅ Ability to read message history
- ✅ Ability to join rooms (if accepting invites)

Your bot accounts DO NOT need:
- ❌ Admin privileges
- ❌ Ability to create rooms
- ❌ Ability to invite users
- ❌ Elevated permissions

---

## Whitelisting Users (DM Bot)

After setting up the bot, configure which users can interact with it:

```bash
# Single user
DMBOT_ALLOWED_USERS=@alice:example.com

# Multiple users (comma-separated, no spaces)
DMBOT_ALLOWED_USERS=@alice:example.com,@bob:example.com,@charlie:example.com
```

**Important**: 
- Use full user IDs including homeserver
- No spaces between user IDs
- No trailing commas
