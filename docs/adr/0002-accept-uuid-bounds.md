# ADR 0002 — Accept the `uuid` v3/v5/v6 bounds check gap (GHSA-w5hq-g745-h8pq)

- **Status:** Accepted
- **Date:** 2026-05-25
- **Advisory:** [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) — `uuid`: missing buffer bounds check in `v3()`/`v5()`/`v6()` when `buf` is provided
- **CVE:** CVE-2026-41907
- **Severity:** Moderate
- **Affected workspaces:** `dmbot/`, `roombot/`

## Context

`matrix-bot-sdk@0.8.0` transitively depends on `uuid@3.4.0` through the chain
`matrix-bot-sdk → request-promise → request → uuid@^3.3.2`. The advisory is
fixed in `uuid@11.1.1+`, but `request@2.88.2` (the final published release of
the deprecated, unmaintained `request` package) hard-pins `uuid@^3.3.2`. There
is no patch path short of replacing `matrix-bot-sdk` or its `request` chain —
see [ADR 0001](0001-accept-request-ssrf.md).

The vulnerable code path is the optional `buf` argument of `v3()`/`v5()`/`v6()`,
which allows out-of-bounds writes when the caller supplies a too-small buffer or
too-large offset.

## Options considered

1. **Bump `uuid`** — rejected: hard-pinned by `request@2.88.2`; an `overrides`
   block could force it, but `request` exclusively calls `uuid()` (v4 path), so
   forcing the override only adds risk of breaking `request` without security
   benefit.
2. **Replace `matrix-bot-sdk`** — same disposition as ADR 0001; out of scope.
3. **Accept the risk** — chosen.

## Decision

Accept the risk. The vulnerable code path is unreachable from our usage:

- `request` (the only caller of `uuid` in our dependency graph) invokes
  `uuid()` with no arguments — i.e., the `v4()` no-`buf` path, which is not
  affected by this advisory.
- Neither bot codebase nor any of our direct dependencies calls
  `uuid.v3()`/`v5()`/`v6()` with a caller-supplied `buf`.
- Even if reachable, the impact is "silent partial write into a caller-owned
  buffer" — a robustness/integrity issue, not an RCE or information disclosure
  primitive.

See [SECURITY.md](../../SECURITY.md) for the full risk model.

## Consequences

- The two Dependabot alerts for GHSA-w5hq-g745-h8pq (one per workspace) are
  dismissed as `tolerable_risk`, referencing this ADR.
- `CVE-2026-41907` is listed in `.trivyignore` for both filesystem and image
  scans.
- **Revisit when:** `matrix-bot-sdk` publishes a release that drops the
  `request` chain (which would also resolve ADR 0001), or if `uuid.v3/v5/v6`
  with a caller-supplied `buf` becomes reachable through new code. At that
  point this ADR should be superseded.
