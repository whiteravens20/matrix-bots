# Matrix Bots

> Two small Matrix bots that pass a message to an n8n workflow and post its answer back: one for private chats with an allow list, one for a single room.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Test](https://github.com/whiteravens20/matrix-bots/actions/workflows/test.yml/badge.svg?branch=dev)](https://github.com/whiteravens20/matrix-bots/actions/workflows/test.yml)
[![CodeQL](https://github.com/whiteravens20/matrix-bots/actions/workflows/codeql.yml/badge.svg?branch=dev)](https://github.com/whiteravens20/matrix-bots/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/whiteravens20/matrix-bots/badge)](https://scorecard.dev/viewer/?uri=github.com/whiteravens20/matrix-bots)

> [!WARNING]
> **Early development — not production ready.** Matrix Bots is under active
> development. Configuration, the n8n webhook payload and deployment may change
> without notice. Run it to experiment, not for anything you depend on yet.

## Features

- **DM bot** (`dmbot/`). Answers only in direct chats, which it confirms by counting the room's members, and only to users on an allow list. It accepts an invitation from a user on the list and leaves any other room it is invited to.
- **Room bot** (`roombot/`). Answers every member of one configured room and nothing outside it. It leaves any other room it is invited to.
- **Commands.** A message that starts with `!` is split into a command and its text, and the command name travels to the workflow, which can route it to a different model or prompt. `!help` is answered by the bot itself.
- **n8n decides the answer.** Each message goes to one webhook. Whatever text the workflow returns is posted to the room, with a prefix the workflow can choose (`[Code Expert]`).
- **Works without n8n.** With no webhook configured, a bot answers with an echo of the message, which is enough to check the Matrix side.
- **Small containers.** Plain JavaScript on `matrix-bot-sdk`, in distroless images that run as a non-root user.

What the bots do not do:

- **No end-to-end encryption.** They cannot read messages in an encrypted room, so the rooms they work in have to be unencrypted.
- **No memory of their own.** Conversation history is the workflow's job; see the [n8n guide](docs/N8N_WORKFLOW_GUIDE.md).

## Install

You need Docker with Compose, a Matrix account for each bot you run ([how to create one](docs/BOT_CREDENTIALS_GUIDE.md)) and, for real answers, an n8n workflow. The Compose file starts an n8n of its own.

```bash
git clone https://github.com/whiteravens20/matrix-bots.git
cd matrix-bots
mkdir -p dmbot/data roombot/data n8n/data
cp .env.example .env
```

Then fill in `.env`:

| Variable | Bot | Meaning |
|---|---|---|
| `MATRIX_HOMESERVER` | both | Address of the homeserver, for example `https://matrix.example.com` |
| `DMBOT_USERNAME`, `DMBOT_PASSWORD` | DM bot | The account the bot signs in with on every start |
| `DMBOT_ACCESS_TOKEN` | DM bot | Instead of the two above: an access token you created yourself |
| `DMBOT_ALLOWED_USERS` | DM bot | Matrix IDs allowed to talk to it, separated by commas, without spaces. Empty means nobody |
| `ROOMBOT_USERNAME`, `ROOMBOT_PASSWORD` | Room bot | The account the bot signs in with on every start |
| `ROOMBOT_ACCESS_TOKEN` | Room bot | Instead of the two above: an access token you created yourself |
| `TARGET_ROOM_ID` | Room bot | The one room it answers in (`!roomid:example.com`). Required: the bot refuses to start without it |
| `N8N_WEBHOOK_URL` | both | Webhook that receives every allowed message. Optional |
| `DOCKER_UID`, `DOCKER_GID` | both | The user that owns `dmbot/data` and `roombot/data` on the host, so the containers can write there. Default `1000` |

Signing in with a username and password is the simpler choice: the bot gets a fresh access token on every start. A token you created yourself stops working when that session is signed out.

The room bot does not accept invitations. Join its account to the target room once yourself, for example by signing in as the bot in a Matrix client and accepting the invitation there.

To run only one of the bots, leave the other one's variables out and start only its service.

## Run

```bash
docker compose up -d                 # n8n, dmbot and roombot
docker compose up -d n8n dmbot       # the DM bot alone
```

Compose builds both bot images from this repository. n8n listens on port 5678; a container is reported healthy while its bot keeps receiving sync responses from the homeserver.

To run a bot without Docker you need Node.js 24:

```bash
cd dmbot          # or roombot
npm ci
npm rebuild @matrix-org/matrix-sdk-crypto-nodejs --ignore-scripts=false
npm start
```

The second command is needed because install scripts are switched off in `.npmrc`, and the Matrix SDK downloads a native library in one. A bot started this way reads `.env` from its own directory, with the names the code uses, not the prefixed ones Compose maps them from: `MATRIX_HOMESERVER`, `MATRIX_USERNAME` and `MATRIX_PASSWORD` (or `MATRIX_ACCESS_TOKEN`), `N8N_WEBHOOK_URL`, plus `ALLOWED_USERS` for the DM bot and `TARGET_ROOM_ID` for the room bot; the prefixes and the help text are `BOT_RESPONSE_PREFIX`, `BOT_HELP_TEXT` and so on, without the bot's name.

## Commands

| Message | What happens |
|---|---|
| `!help` | The bot answers with its help text, without calling n8n |
| `!code how do I reverse a string` | Sent to the workflow with `commandType` `code` and `chatInput` `how do I reverse a string` |
| `hello` | Sent to the workflow with `commandType` `general` |

A command is the first word after `!`, in any letter case. The bots attach no meaning to it: what `!code`, `!translate`, `!moderate` or `!clear` do is decided by the workflow. The default help texts list `!clear`, `!code`, `!translate` and `!analyze` for the DM bot and `!clear`, `!moderate` and `!announce` for the room bot; set `DMBOT_HELP_TEXT` or `ROOMBOT_HELP_TEXT` to describe the commands your workflow really handles.

The prefix in front of an answer is the bot's general one, or the one that matches the `agentType` the workflow returned. In `.env` each bot has its own set: `DMBOT_RESPONSE_PREFIX`, `DMBOT_GENERAL_PREFIX`, `DMBOT_CODE_PREFIX`, `DMBOT_TRANSLATE_PREFIX` and `DMBOT_ANALYZE_PREFIX` for the DM bot, `ROOMBOT_RESPONSE_PREFIX`, `ROOMBOT_GENERAL_PREFIX`, `ROOMBOT_MODERATE_PREFIX` and `ROOMBOT_ANNOUNCE_PREFIX` for the room bot. A line left out keeps its default.

## n8n integration

For every allowed message a bot sends this to the webhook, and waits up to 30 seconds:

```json
{
  "sessionId": "@user:example.com",
  "chatInput": "how do I reverse a string",
  "commandType": "code",
  "originalMessage": "!code how do I reverse a string",
  "roomId": "!roomid:example.com",
  "timestamp": "2026-02-06T12:34:56.789Z",
  "botType": "dmbot"
}
```

`sessionId` is the sender's Matrix ID, which a workflow can use as the key of its conversation memory. `botType` is `dmbot` or `roombot`.

The workflow answers with:

```json
{
  "output": "The text to post in the room",
  "agentType": "code"
}
```

`output` is required. `agentType` is optional and picks the prefix. When the workflow fails, takes longer than 30 seconds or returns no `output`, the bot posts its echo answer instead.

[docs/N8N_WORKFLOW_GUIDE.md](docs/N8N_WORKFLOW_GUIDE.md) builds such a workflow step by step, with a memory of the last 20 messages per sender and a branch per command. The bots send no credential with the request, so keep the webhook on a network only they can reach, as the Compose file does, or protect it on the n8n side. A bot prints a warning at start when the webhook address is plain HTTP and not `localhost`; with the bundled n8n, reached over the internal Compose network, that warning is expected.

## Architecture

Each bot is one Node.js process built on `matrix-bot-sdk`. It signs in to the homeserver, keeps a sync connection open and reacts to two kinds of events: invitations and text messages. The two bots share that logic, in `shared/lib/`, and differ only in configuration: the DM bot runs in `dm` mode and the room bot in `room` mode.

When a message arrives, the bot first decides whether it may answer at all. In `dm` mode the room must have exactly two joined members and the sender must be on the allow list. In `room` mode the room must be the configured one. Anything else is dropped without a reply. An allowed message is parsed for a command and, when a webhook is configured, posted to n8n with the sender's ID, the room's ID and the bot's type. The workflow decides what happens next, which model to call and what history to keep, and returns the text to send. The bot puts a prefix in front and posts it to the room.

What each part keeps matters more than how they connect. The homeserver keeps the rooms and their history, and because the bots do not support end-to-end encryption it can read every message in them. n8n sees every message it is sent and keeps whatever the workflow stores; in the guide's workflow that is the last 20 messages per sender. A bot keeps one small file, `data/bot-storage.json`, with its position in the sync stream and no messages. Its log names the sender and the room of each message it handles, never the text.

## Development

Shared logic lives in `shared/lib/` and is tested in `shared/tests/`. Each bot has a small wiring test that checks its configuration and that it loads the shared modules.

```bash
cd dmbot && npm ci
npm test                                  # the bot's wiring test
npx vitest run --dir ../shared/tests      # the shared logic
```

CI runs the same tests for both bots on every push and pull request. See [CONTRIBUTING.md](CONTRIBUTING.md) for the rest.

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request, and follow the [Code of Conduct](CODE_OF_CONDUCT.md). Work happens on the `dev` branch.

## Security

Do not report a vulnerability in a public issue. Use [private vulnerability reporting](https://github.com/whiteravens20/matrix-bots/security/advisories/new) instead. [SECURITY.md](SECURITY.md) lists what the code guarantees, what it deliberately does not protect against and the two dependency advisories whose risk was accepted.

## How the code is written and checked

Matrix Bots is built by one maintainer using AI coding tools. The tools write most of the code, tests and documentation; the maintainer decides what gets built and is responsible for everything that lands here. The project is in early development, and there is no second human reviewer.

**What a change goes through**

- Every push and pull request runs the tests of the shared logic and a wiring test for each bot, then builds both Docker images ([test.yml](.github/workflows/test.yml)).
- CodeQL, `npm audit`, package signature checks and Trivy scans of the repository and of both images run on every push and pull request, and again every week ([codeql.yml](.github/workflows/codeql.yml), [security.yml](.github/workflows/security.yml)).
- Commits are signed, and the [OpenSSF Scorecard](https://scorecard.dev/viewer/?uri=github.com/whiteravens20/matrix-bots) results are public.

**What the maintainer decided and read**

- Access is closed by default. The DM bot answers only users on an allow list, and only in rooms it has confirmed to be direct chats by counting their members. The room bot answers in the one room it is configured for.
- Two advisories in the Matrix SDK's dependencies have no fix. The maintainer weighed the options and accepted the risk in writing ([docs/adr](docs/adr)).
- Changes to `shared/lib/handler.js` and `shared/lib/invite-handler.js`, which decide whom the bots answer and which invitations they accept, are read line by line by the maintainer.

**Before a release**

- Releases are paused while the project is in early development: the release workflow is switched off until 1.0, so a tag publishes nothing. The last tagged version is v0.3.3; `package.json` already carries 1.0.0, the version the first stable release will have.
- Before a version is tagged, the maintainer runs both bots against a Matrix homeserver and an n8n workflow.

If something looks wrong, open an issue. For a vulnerability, use [private vulnerability reporting](https://github.com/whiteravens20/matrix-bots/security/advisories/new).

## License

Released under the [MIT License](LICENSE).
