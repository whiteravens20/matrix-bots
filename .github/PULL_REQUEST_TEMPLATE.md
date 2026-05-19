## Description
A clear and concise description of the changes made.

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring
- [ ] Dependency update

## Related Issue
Closes #(issue number)
Relates to #(issue number)

## How Has This Been Tested?
Describe the verification you performed. The repo does not yet have an automated test suite, so manual verification is expected.

- [ ] Started bot locally against a test Matrix account
- [ ] Verified message routing through n8n webhook
- [ ] Verified whitelist / room enforcement (DM bot: 2-member rooms only; room bot: `TARGET_ROOM_ID` only)
- [ ] Built and ran via `docker-compose up -d`

## Checklist
Please review the [Contributing Guidelines](../CONTRIBUTING.md) before submitting.

- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code where the intent is non-obvious
- [ ] I have updated relevant documentation (`README.md`, `docs/`)
- [ ] My changes generate no new warnings
- [ ] `npm audit --omit=dev` shows no new high/critical findings in either bot
- [ ] I have updated `CHANGELOG.md` if user-visible behaviour changed
- [ ] Commits are signed and follow Conventional Commits

## Security Checklist

- [ ] No secrets, tokens, or `.env` values are committed
- [ ] No new unvalidated environment variable is introduced
- [ ] Webhook payload schema unchanged, or `docs/` and the n8n workflow are updated together
- [ ] Whitelist / room-ID checks are preserved on any handler change

## Additional Information
Anything that helps the reviewer (screenshots, log excerpts, links to the related n8n workflow).
