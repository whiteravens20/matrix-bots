---
name: Bug Report
about: Report a reproducible bug in matrix-bots
title: '[BUG] '
labels: bug
assignees: ''
---

> **Security vulnerability?** Do not open a public issue.
> Use [private vulnerability reporting](../../security/advisories/new) instead.

## Bug Description
A clear and concise description of what the bug is. Which bot is affected (`dmbot`, `roombot`, both)?

## Steps to Reproduce
1.
2.
3.

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happens. Include any error messages, stack traces, or unexpected output.

## Environment

| Field | Value |
|---|---|
| Bot affected | dmbot / roombot / both |
| Bot version (package.json) | e.g. 2.0.0 |
| Node.js version | e.g. 22.x |
| Operating System | e.g. Ubuntu 24.04 |
| Deployment method | Docker / direct Node.js |
| Matrix homeserver | e.g. matrix.org, synapse self-hosted |
| n8n integration in use | yes / no |
| Auth method | username/password / static access token |

## Logs
```
Paste relevant bot log fragments here (remove any tokens or passwords)
```

## n8n Webhook (if relevant)
- Webhook URL is over HTTPS: yes / no
- Workflow returns `{ output, agentType }` shape: yes / no

## Additional Context
Anything else that may help reproduce or diagnose the issue.
