# Security Policy

## Known Vulnerabilities

### Transitive Dependencies (matrix-bot-sdk)

The matrix-bot-sdk package depends on the deprecated `request` chain, which
carries two unfixable moderate advisories. These are the only vulnerabilities
`npm audit` reports for either workspace:

- **request** (deprecated) — SSRF, GHSA-p8p7-x288-28g6 (accepted, ADR 0001)
- **request-promise** / **request-promise-core** (deprecated) — wrappers around `request`, same chain
- **matrix-bot-sdk** — flagged transitively for depending on the above
- **uuid** (3.4.0, via `request`) — bounds-check gap, GHSA-w5hq-g745-h8pq / CVE-2026-41907 (accepted, ADR 0002)

**Severity Breakdown (current `npm audit`, both workspaces):**
- 0 Critical / 0 High
- 5 Moderate — all from the `request` chain + `uuid` above, all risk-accepted

> Previously reported findings in `form-data`, `qs`, and `tough-cookie` have
> been resolved via the `overrides` block in each workspace's `package.json`
> (form-data ≥ 4.0.5, qs ≥ 6.15.2, tough-cookie ≥ 4.1.4) and no longer appear.

### Root Cause
These vulnerabilities exist in transitive dependencies of `matrix-bot-sdk` (^0.8.0), which is the latest available release (npm `latest` = 0.8.0). It still hard-depends on `request@^2.88.2` and `request-promise@^4.2.6`, so no dependency bump resolves them.

The `request` SSRF (GHSA-p8p7-x288-28g6) has no upstream fix; the risk-accept decision is recorded in [docs/adr/0001-accept-request-ssrf.md](docs/adr/0001-accept-request-ssrf.md).

The `uuid` bounds-check gap (GHSA-w5hq-g745-h8pq / CVE-2026-41907) is unreachable from our dependency graph because `request` calls `uuid()` only on the unaffected `v4()` path; the risk-accept decision is recorded in [docs/adr/0002-accept-uuid-bounds.md](docs/adr/0002-accept-uuid-bounds.md).

### Impact Assessment

**Risk Level: LOW** for this application because:

1. **No Direct Network Input**: DMs and room messages are not directly parsed for code execution
2. **Bots Use DMs Only**: Communication is restricted to whitelisted users (chatbot/codebot) or specific rooms (roombot)
3. **Simple Message Processing**: Messages are echoed/forwarded without complex parsing
4. **HTTP Requests Only**: Vulnerabilities would require malicious input through HTTP request headers (form-data, qs) which are only used internally for n8n webhook requests
5. **Controlled Environment**: Docker deployment with Node 22-alpine isolates the application

### Mitigation Strategies

1. **Use Docker**: Always deploy using Docker Compose with Node 22-alpine image (recommended)
   - Provides OS-level isolation
   - Pins Node version
   - Reduces attack surface

2. **Network Isolation**: Run bots on private/secure Matrix homeservers
   - Restrict to whitelisted users only
   - Monitor for suspicious messages

3. **Dependency Monitoring**: 
   - Watch for matrix-bot-sdk updates
   - Run `npm audit` before each deployment
   - Check GitHub advisories regularly

4. **Keep Updated**:
   - Ensure Node >= 22.0.0 (specified in package.json)
   - Docker images use Node 22-alpine (latest LTS)

### Recommendations

**For Production Deployment:**

1. ✅ Use Docker Compose deployment (not local npm)
2. ✅ Restrict bot access to specific whitelisted users
3. ✅ Monitor bot logs for unusual activity
4. ✅ Set up alerts for Matrix server security events
5. ✅ Review incoming messages for malicious patterns
6. ⚠️ Consider monitoring matrix-bot-sdk GitHub for security updates

**For Development:**

1. Use Node 22+ locally (currently you have Node 20)
2. Run `npm audit` after `npm install`
3. Keep dependencies updated with `npm update`

### Alternative Solutions

If these vulnerabilities become a critical concern:

1. **Switch to @matrix-js-sdk** - Official SDK (but higher complexity)
2. **Use matrix-client-js** - Alternative implementation
3. **Upgrade when matrix-bot-sdk releases new versions** - Monitor releases

## Security Best Practices

### Environment Variables
- Never commit `.env` file - use `.env.example` only
- Rotate access tokens regularly
- Use different tokens for different bots
- Store tokens in secure secret management system (for production)

### Docker Security
- Use latest Node 22-alpine image
- Keep Docker and docker-compose updated
- Use non-root user (already set in Dockerfile)
- Use read-only root filesystem if possible

### Matrix Homeserver
- Require TLS/HTTPS for all connections
- Keep homeserver software updated
- Enable authentication and rate limiting
- Monitor bot activity logs

### n8n Webhook
- Use HTTPS URLs only for n8n webhooks
- Validate webhook source if possible
- Implement rate limiting on n8n side
- Monitor webhook logs for failures

## Reporting Security Issues

If you discover a security vulnerability in this project:

1. **Do NOT open a public GitHub issue**
2. Email security details privately to the maintainer
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

## Security Version Release

When security updates are released:
- Patch version (x.x.Y) = Non-critical security fixes
- Minor version (x.Y.0) = Important security fixes
- Major version (X.0.0) = Critical security fixes or breaking changes

Always review CHANGELOG.md for security-related updates.

## Compliance

This application:
- ✅ Does NOT store user data permanently
- ✅ Does NOT process personal information
- ✅ Does NOT make external API calls except n8n webhooks (optional)
- ✅ Does NOT expose credentials in logs
- ✅ Does NOT accept arbitrary code execution
- ✅ Isolates messages per room/user

## Last Updated

**7 June 2026**

Next security review recommended: **29 July 2026**
