## Description
A clear and concise description of the changes made.

## Type of Change
Please check the relevant options:
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring
- [ ] CI, build or tooling

## Related Issue
Closes #(issue number)
Relates to #(issue number)

## How Has This Been Tested?
Describe the tests you ran to verify your changes:
- [ ] Unit tests (`npm test` in `dmbot` and `roombot`, `npx vitest run --dir ../shared/tests` for the shared logic)
- [ ] A bot started against a test Matrix account
- [ ] A message sent through the n8n webhook and answered
- [ ] Built and started with `docker compose up -d`

The automated tests cover command parsing and the handlers. Signing in, joining rooms and the round trip through n8n need a real homeserver: say which of them you exercised.

## Checklist
Please review the [Contributing Guidelines](../CONTRIBUTING.md) before submitting.

- [ ] My code follows the style guidelines of this project
- [ ] Commits follow Conventional Commits, one topic per commit, and are signed
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation (`README.md`, `docs/`)
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes

## Security Checklist

- [ ] No secrets, tokens or `.env` values are committed
- [ ] No new unvalidated environment variable is introduced
- [ ] The allow-list check, the two-member check and the target-room check still run before any reply
- [ ] No address the bot connects to is taken from a message
- [ ] The webhook payload is unchanged, or `README.md`, `docs/` and the n8n guide change with it
- [ ] `node .github/scripts/audit-check.mjs --dir dmbot --omit=dev --audit-level moderate` and the same for `roombot` report nothing new

## Screenshots (if applicable)
Add screenshots or log excerpts showing the change in action. Remove tokens and message content you do not want public.

## Additional Information
Any additional information that may be helpful during review.
