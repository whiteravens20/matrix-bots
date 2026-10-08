# Contributing to Matrix Bots

Thank you for considering a contribution. This repository holds two small Matrix bots (`dmbot/` and `roombot/`) that pass messages to an optional n8n workflow. Please read this guide before opening a pull request.

## Before You Start

- Check the [open issues](../../issues) and [pull requests](../../pulls) to avoid duplicating work.
- For a larger change (a new sign-in method, a change to the webhook payload, a new mode), open an issue first to discuss the approach.
- By contributing, you agree to the project [License](LICENSE) and [Code of Conduct](CODE_OF_CONDUCT.md).

## Scope of Contributions

In scope:

- Bug fixes in how the bots handle messages and invitations.
- Hardening: input validation, the allow-list and room checks, how the webhook call fails.
- Improvements to the Dockerfiles and the Compose file.
- Documentation, including the guides in `docs/`.

Out of scope, or to be agreed first:

- Replacing `matrix-bot-sdk`.
- Storing messages or anything else about users in the bots.
- Analytics, telemetry or any other call home.

## Development Setup

### Requirements

- Node.js 24 or newer.
- Docker with Compose, for the full stack with n8n.
- A test account on a Matrix homeserver for each bot you run.

### Local start

Each bot is an ES module package of its own.

```bash
cd dmbot          # or roombot
npm ci
npm rebuild @matrix-org/matrix-sdk-crypto-nodejs --ignore-scripts=false
npm start
```

Install scripts are switched off in each bot's `.npmrc`. The `npm rebuild` line runs the one script the bots need: the Matrix SDK downloads its native library there, and does not load without it.

### Environment variables

A bot started with `npm start` reads `.env` from its own directory, with the names the code uses: `MATRIX_HOMESERVER`, `MATRIX_USERNAME` and `MATRIX_PASSWORD` (or `MATRIX_ACCESS_TOKEN`), `N8N_WEBHOOK_URL`, plus `ALLOWED_USERS` for the DM bot and `TARGET_ROOM_ID` for the room bot. The prefixes and the help text are read as `BOT_RESPONSE_PREFIX`, `BOT_HELP_TEXT` and so on. The `.env.example` at the root is for Compose, which maps its `DMBOT_` and `ROOMBOT_` names onto these.

Never commit a filled-in `.env`. Use separate credentials for each bot, in development too.

## Coding Guidelines

### General

- ES modules (`"type": "module"`). No CommonJS in new files.
- Each bot is an entry point (`index.js`) and a `config/`. Everything the two share belongs in `shared/lib/`, written so that it can be tested without a Matrix client: dependencies are passed in, as in `createMessageHandler`.
- No dead code. Delete what is not used.

### Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add a summarize command to the room bot
fix(dmbot): ignore rooms with more than two members
docs: describe the webhook payload
```

Sign your commits (`git commit -S`). Both branches accept signed commits only.

### Dependencies

- Dependencies are installed from the committed lockfiles with `npm ci`. A change to `package.json` comes with its lockfile.
- A version has to be at least seven days old before it is added: `.npmrc` refuses a newer one.
- Before adding a runtime dependency, run the audit the way CI does: `node .github/scripts/audit-check.mjs --dir dmbot --omit=dev --audit-level moderate`, and the same for `roombot`.
- An advisory in a dependency of `matrix-bot-sdk` that has no fix is not silenced by lowering the threshold. The decision goes into `docs/adr/`, and the advisory into `.github/scripts/audit-allowlist.json` with its reason and an expiry date.

### AI-assisted code

Most of this project is written with AI coding tools, as the [README](README.md#how-the-code-is-written-and-checked) describes, and contributions may be too. Do not submit AI output that you cannot explain and defend in review: read it, test it and take responsibility for it.

## Testing

The shared logic is tested in `shared/tests/`. Each bot has a small wiring test in its own `tests/`.

```bash
cd dmbot && npm ci
npm test                                  # the bot's wiring test
npx vitest run --dir ../shared/tests      # the shared logic
```

The `test.yml` workflow runs these for both bots on every push and pull request. When you add tests:

- Put tests of shared logic in `shared/tests/` as `*.test.js`.
- Put a bot's own tests in `dmbot/tests/` or `roombot/tests/`.

The automated tests cover command parsing and the two handlers. Signing in, joining rooms and the round trip through n8n need a real homeserver: say in the pull request what you exercised.

## Submitting Changes

1. Fork the repository and create a branch from `dev`.
2. Make your change, following this guide.
3. Open a pull request against `dev` and fill in the template.
4. CI has to be green before the pull request is merged.

`main` receives changes only from `dev`.

## Reporting Security Vulnerabilities

Do not open a public issue. Use [private vulnerability reporting](../../security/advisories/new) on GitHub. [SECURITY.md](SECURITY.md) says what to include and lists what the code guarantees and the risks that were accepted.
