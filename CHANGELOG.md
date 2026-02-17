# Changelog

## [2.0.0] - 2026-02-17

### 🔄 Major Restructuring - Two Bot Architecture

#### Breaking Changes
- **Consolidated Bots**: Merged `chatbot` and `codebot` into a single `dmbot` (DM Bot)
- **New Structure**: Project now contains only two bots:
  - **DM Bot** (`dmbot/`) - Handles all private direct messages with command-based routing
  - **Room Bot** (`roombot/`) - Handles group room conversations
- **Environment Variables Changed**:
  - Renamed: `GENERALBOT_*` → `DMBOT_*`
  - Renamed: `GENERALBOT_ALLOWED_USERS` → `DMBOT_ALLOWED_USERS`
  - Removed: `CODEBOT_*` variables (functionality merged into dmbot)

#### DM Bot Features
- Unified bot for all private conversations
- Supports multiple command types: `!code`, `!translate`, `!analyze`, etc.
- Command-based routing to specialized LLMs in n8n
- Maintains single conversation history per user across all command types
- Whitelist-based access control

#### Room Bot Features
- Dedicated bot for group conversations
- Supports room-specific commands: `!moderate`, `!announce`, etc.
- No whitelist (responds to all room members)
- Per-user conversation memory (not shared room memory)

#### Configuration Updates
- Simplified docker-compose.yml with two bot services
- Updated `.env.example` with new variable names
- Consolidated configuration files
- Unified response prefix system

#### Documentation
- Completely rewritten README.md with two-bot architecture
- Updated N8N_WORKFLOW_GUIDE.md with examples for both bots
- New architecture diagrams
- Clearer setup instructions

### Migration from 1.x

1. **Update Environment Variables**:
   ```bash
   # In your .env file, rename:
   GENERALBOT_USER_ID → DMBOT_USER_ID
   GENERALBOT_ACCESS_TOKEN → DMBOT_ACCESS_TOKEN
   GENERALBOT_ALLOWED_USERS → DMBOT_ALLOWED_USERS
   
   # Remove (no longer needed):
   CODEBOT_USER_ID
   CODEBOT_ACCESS_TOKEN
   CODEBOT_ALLOWED_USERS
   ```

2. **Recreate Data Directories**:
   ```bash
   mkdir -p dmbot/data roombot/data
   ```

3. **Update Docker**:
   ```bash
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

4. **Update n8n Workflow**:
   - Change `botType` checks from `chatbot|codebot` to `dmbot|roombot`
   - Consolidate any separate chatbot/codebot workflows into single dmbot workflow

---

## [1.0.0] - 2026-02-05

### 🔴 Critical Security & Bug Fixes

#### DM Verification (CRITICAL)
- **Fixed**: Incorrect DM detection in chatbot and codebot
  - Previous code checked non-existent `m.relates_to.is_direct` field
  - Now properly verifies DMs by checking room member count (must be exactly 2 members)
  - Impact: Bots were not actually restricting to DMs before this fix

#### User Whitelist (CRITICAL)
- **Fixed**: Empty whitelist configuration handling
  - Now filters out empty strings from `ALLOWED_USERS` environment variable
  - Prevents accepting messages from unauthorized users when whitelist is misconfigured

#### TARGET_ROOM_ID Validation (CRITICAL)
- **Added**: Required validation for roombot `TARGET_ROOM_ID`
  - Bot now throws error on startup if `TARGET_ROOM_ID` is not set
  - Prevents silent failure where roombot would never respond to any messages

#### Docker Volumes (CRITICAL)
- **Fixed**: Incorrect volume mappings in docker-compose.yml
  - Changed from `./chatbot/data:/app` to `./chatbot/data:/app/data`
  - Previous mapping overwrote entire `/app` directory including node_modules and index.js
  - Now properly mounts only the data directory

### 🟡 Security Improvements

#### HTTPS Enforcement
- **Added**: Warning for non-HTTPS n8n webhook URLs in production
  - Logs warning if webhook URL uses HTTP (except localhost/127.0.0.1)
  - Helps prevent credential leakage over unencrypted connections

#### n8n Authentication
- **Added**: Basic authentication support for n8n
  - New environment variables: `N8N_BASIC_AUTH_ACTIVE`, `N8N_USER`, `N8N_PASSWORD`
  - Protects webhook endpoints from unauthorized access

#### HTTP Timeout
- **Added**: 30-second timeout for all n8n webhook requests
  - Prevents bots from hanging indefinitely if n8n is unresponsive
  - Improves overall bot stability

### 🟢 Stability & Reliability

#### Race Condition Fix
- **Fixed**: Event handlers now registered before `client.start()`
  - Prevents missing messages sent immediately after bot connects
  - Ensures all events are captured from the moment bot is online

#### Error Handling
- **Added**: Comprehensive error handling for message sending
  - Bot now logs errors instead of crashing when unable to send messages
  - Handles cases where bot is banned, lacks permissions, or room is unavailable

#### Storage Path Conflicts
- **Fixed**: Each bot now uses unique storage file
  - Changed from `./bot.json` to `./bot-{userId}.json`
  - Prevents file conflicts when multiple bots share same volume

#### Non-whitelisted User Logging
- **Added**: Log messages from non-whitelisted users
  - Helps debugging and monitoring unauthorized access attempts

### 📁 Infrastructure

#### .dockerignore
- **Added**: New `.dockerignore` file
  - Reduces Docker image size by excluding unnecessary files
  - Improves build performance and security

#### .gitignore
- **Updated**: Added bot storage and data directories
  - `bot.json`, `bot-*.json` now ignored
  - `*/data/` and `n8n/data/` directories excluded

#### Health Checks
- **Added**: Docker health checks for all services
  - n8n: Checks `/healthz` endpoint every 30 seconds
  - Bots: Validates Node.js process is running
  - Enables proper service dependency management with `condition: service_healthy`

### 📚 Documentation

#### .env.example
- **Updated**: Added n8n authentication variables with defaults
  - `N8N_BASIC_AUTH_ACTIVE=false`
  - `N8N_USER=admin`
  - `N8N_PASSWORD=changeme`

## Testing Recommendations

After updating:

1. **Test DM Detection**: Send DMs from whitelisted users to verify proper response
2. **Test Group Messages**: Send messages in group rooms to verify they are ignored (dmbot)
3. **Test Whitelist**: Try sending messages from non-whitelisted users (should be ignored with log entry)
4. **Test n8n Integration**: Verify webhooks are triggered and authenticated properly
5. **Test Roombot**: Verify it only responds in the configured TARGET_ROOM_ID

## Security Notes

- All bots now properly enforce DM-only communication (dmbot) or room-specific communication (roombot)
- Storage files are now properly isolated per bot to prevent data corruption
- n8n webhook authentication can now be enabled to prevent unauthorized webhook triggers
- HTTPS warnings help identify potential security misconfigurations

## Known Limitations

- Matrix-bot-sdk transitive dependency vulnerabilities still exist (documented in SECURITY.md)
- Risk assessment: LOW impact for this use case (whitelist + controlled environment)
- Monitor matrix-bot-sdk updates for security patches
