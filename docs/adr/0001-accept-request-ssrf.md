# ADR 0001 — Accept the `request` SSRF (GHSA-p8p7-x288-28g6)

- **Status:** Accepted
- **Date:** 2026-05-20
- **Advisory:** [GHSA-p8p7-x288-28g6](https://github.com/advisories/GHSA-p8p7-x288-28g6) — Server-Side Request Forgery in `request`
- **Severity:** Moderate
- **Affected workspaces:** `dmbot/`, `roombot/`

## Context

`matrix-bot-sdk@0.8.0` — the latest published release — transitively depends on
the deprecated `request` library (via `request-promise`). `request` is
unmaintained and no patched version exists for the SSRF advisory. The
vulnerability cannot be resolved by a dependency bump.

## Options considered

1. **Upgrade `matrix-bot-sdk`** — rejected: 0.8.0 is the latest release and
   still ships the `request` chain.
2. **Migrate to another Matrix SDK** (`matrix-js-sdk`) — rejected for now: a
   full SDK migration is disproportionate to the residual risk (see below) and
   is tracked separately as a potential future change.
3. **Accept the risk** — chosen.

## Decision

Accept the risk. The exposure is low for this application:

- The SSRF in `request` is reachable only when the bot makes an outbound HTTP
  request to an attacker-controlled URL. The bots issue outbound requests to a
  single operator-configured n8n webhook URL — never to a URL derived from
  Matrix message content.
- Bots run in Docker (`node:22-alpine`) and talk only to a trusted Matrix
  homeserver and the operator's n8n instance.

See [SECURITY.md](../../SECURITY.md) for the full risk assessment.

## Consequences

- The two Dependabot alerts for GHSA-p8p7-x288-28g6 are dismissed as
  `tolerable_risk`, referencing this ADR.
- `CVE-2023-28155` (the same advisory) is listed in `.trivyignore`.
- **Revisit when:** `matrix-bot-sdk` publishes a release that drops `request`,
  or if a feasible SDK migration path emerges. At that point this ADR should be
  superseded.
