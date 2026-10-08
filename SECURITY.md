# Security — Matrix Bots

## Reporting a vulnerability

Report vulnerabilities privately through GitHub's [private vulnerability reporting](https://github.com/whiteravens20/matrix-bots/security/advisories/new). Please do not open a public issue, discussion or pull request for a security bug.

Include the version or commit you tested, the steps that reproduce the problem and the impact you expect. You will get a first reply within a week. A confirmed issue is fixed on `dev`, and the advisory credits you unless you ask otherwise.

## Supported versions

Matrix Bots is in early development. Fixes land on the `dev` branch; the tagged versions get no backports.

## Security checklist

What the code guarantees today, and what it deliberately does not protect against.

### Who the bots answer

- [x] Only text messages are handled, and a bot never answers its own
- [x] DM bot: the room must have exactly two joined members, checked against the homeserver's member list for every message
- [x] DM bot: the sender must be in `ALLOWED_USERS`; an empty list means nobody
- [x] DM bot: joins a room only when invited by a user on that list and leaves any other room it is invited to
- [x] Room bot: answers in the room named by `TARGET_ROOM_ID` only and refuses to start without it
- [x] Room bot: leaves any other room it is invited to
- [x] These rules live in `shared/lib/handler.js` and `shared/lib/invite-handler.js` and are covered by the tests in `shared/tests/`

### What leaves a bot

- [x] Besides the homeserver, a bot talks to one address: the webhook in `N8N_WEBHOOK_URL`, set by the operator
- [x] No address is ever taken from the content of a message
- [x] A webhook call is given up after 30 seconds
- [x] A warning at start when the webhook is plain HTTP and not `localhost`

### What a bot stores

- [x] No message is written to disk: `data/bot-storage.json` holds the position in the sync stream
- [x] Credentials come from environment variables only and are not logged
- [x] The log names the sender and the room of each handled message, never its text

### Container

- [x] Distroless runtime image: no shell and no package manager
- [x] Runs as a non-root user; the Compose file drops all capabilities and sets `no-new-privileges`
- [x] The Compose file passes each bot its own variables only, so a bot's container never holds the other bot's credentials
- [x] Base images pinned by digest
- [x] Health check on the freshness of the sync state, so a stalled bot is reported

### Supply chain

- [x] Images are built from the lockfile with `npm ci`, and the build fails when the Matrix SDK's native library is missing
- [x] `npm audit` on every push and pull request and once a week: production dependencies from `moderate`, everything from `high`
- [x] Every exception to that audit is listed in `.github/scripts/audit-allowlist.json` with its reason and an expiry date
- [x] Registry signatures of all packages verified (`npm audit signatures`)
- [x] Trivy scans of the repository and of both images, and CodeQL
- [x] Actions pinned to commit SHAs, checked against their tags and against the advisory database
- [x] Dependabot proposes a version only after it has been public for seven days

### Accepted risks

Two advisories in the dependencies of `matrix-bot-sdk` have no fix that can be installed. Each was weighed and accepted in writing:

- `request`, server-side request forgery (GHSA-p8p7-x288-28g6): [docs/adr/0001-accept-request-ssrf.md](docs/adr/0001-accept-request-ssrf.md)
- `uuid`, missing bounds check (GHSA-w5hq-g745-h8pq): [docs/adr/0002-accept-uuid-bounds.md](docs/adr/0002-accept-uuid-bounds.md)

### What this does not protect against

- **No end-to-end encryption.** The bots cannot read an encrypted room, so the rooms they work in are unencrypted and whoever runs the homeserver can read them.
- **Who wrote, and when.** The log still names the sender and the room of every handled message. Keep logs on the machine and rotate them; [docs/PRIVATE_DM_BOT_GUIDE.md](docs/PRIVATE_DM_BOT_GUIDE.md) shows how.
- **Everything sent to the workflow.** n8n sees each message it receives, and so does any model or service the workflow calls.
- **An open webhook.** The bots send no credential with their request. Keep the webhook on a network only they can reach, or protect it on the n8n side.
- **Room members.** The room bot has no allow list: every member of the target room can use it.
- **The `.env` file.** A password or an access token in it is as safe as the file and the machine it is on.
