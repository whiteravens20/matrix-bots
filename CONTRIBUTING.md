# Contributing to Matrix Bots

Thank you for considering a contribution. This repository hosts two small Matrix bots (`dmbot/` and `roombot/`) that route messages through an optional n8n workflow. Please read this guide before opening a pull request.

---

## Before You Start

- Check the [open issues](../../issues) and [pull requests](../../pulls) to avoid duplicating work.
- For larger changes (new commands, new auth method, schema changes to the n8n webhook payload), open an issue first to discuss the approach.
- By contributing, you agree to the project [License](LICENSE) and [Code of Conduct](CODE_OF_CONDUCT.md).

## Scope of Contributions

In scope:

- Bug fixes in the bots' message handling.
- New `!command` handlers and corresponding documentation.
- Hardening (input validation, whitelist enforcement, webhook timeout / retry behaviour).
- Docker / docker-compose improvements.
- Documentation, including the `docs/` guides.

Out of scope (or coordinate first):

- Switching the SDK away from `matrix-bot-sdk`.
- Persisting plaintext messages or storing user data beyond the in-memory window.
- Adding analytics, telemetry, or any phone-home behaviour.

## Development Setup

### Requirements

- Node.js 22 or newer (`matrix-bot-sdk` crypto requires it).
- Docker + Docker Compose (for the full local stack with n8n).
- A test Matrix homeserver account for each bot, or shared test accounts.

### Local start

Each bot is an independent ESM package.

```bash
cd dmbot   # or roombot
npm ci
cp ../.env.example ../.env   # fill in credentials
npm start
```

### Environment variables

See `.env.example` at the repo root. **Never commit a populated `.env`.** Use unique credentials per bot, even in development.

## Coding Guidelines

### General

- ES modules (`"type": "module"`). No CommonJS in new files.
- Keep individual files small and focused; both bots already split `index.js`, `config/`, and `handlers/`.
- No dead code. Delete what isn't used.

### Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add !summarize command to roombot
fix(dmbot): reject DM rooms with > 2 members
chore: bump matrix-bot-sdk to 0.9.0
docs: clarify webhook payload schema
build: update axios and add dependency overrides
```

Sign your commits (`git commit -S`). The `main` branch requires signed commits.

### Dependencies

- Pin minor versions in `package.json`; lockfiles must be committed.
- Run `npm audit --omit=dev` before adding a new runtime dependency. Production audit level is `moderate`; dev is `high`.
- If `matrix-bot-sdk` pulls in something deprecated, add an entry in `SECURITY.md` rather than silently overriding.

## Testing

Each bot has a [Vitest](https://vitest.dev/) suite. Run it from the bot directory:

```bash
cd dmbot && npm test     # or: cd roombot && npm test
```

The `test.yml` workflow runs `npm test` for both bots on every push and PR. When adding tests:

- Place them in `dmbot/tests/` and `roombot/tests/` as `*.test.js`.
- Keep logic testable by injecting dependencies — see `lib/handler.js` (`createMessageHandler`) and `lib/commands.js`, which are pure modules with no Matrix client at import time.

Automated tests cover command parsing and the message-handling flow. Live behaviour (Matrix login, room joins, the end-to-end n8n round-trip) still needs manual verification against a real homeserver — document what you exercised in the PR description.

## Submitting Changes

1. Fork or create a topic branch from `dev`.
2. Make your changes following the guidelines above.
3. Open a draft PR against `dev` with a clear description and (if relevant) screenshots / log excerpts.
4. Mark the PR ready once CI is green.

PRs to `main` should come only from `dev` and only via maintainer release branches.

## Reporting Security Vulnerabilities

Do not open a public issue. Use [private vulnerability reporting](../../security/advisories/new) on GitHub. See `SECURITY.md` for the disclosure policy and the running list of known transitive vulnerabilities.
