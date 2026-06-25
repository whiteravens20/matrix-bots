# CI/CD

## Workflows

| Workflow | Trigger | Purpose |
|---|---|---|
| `test.yml` | Push/PR to `main`, `dev` | `npm ci` and `npm test` in both `dmbot/` and `roombot/` on Node 24 |
| `security.yml` | Push/PR to `main`, `dev`; weekly | `npm audit` (production: moderate; dev: high), dependency review, `npm audit signatures`, Trivy filesystem scan |
| `codeql.yml` | Push/PR to `main`, `dev`; weekly | CodeQL static analysis for JavaScript |
| `release.yml` | Push tag `vX.Y.Z` from `main` | Builds the `dmbot` and `roombot` Docker images, pushes to GHCR, scans with Trivy, generates GitHub Release notes |
| `branch-protection-audit.yml` | Daily | Asserts that `main` branch protection still matches expectations |
| `dependabot-auto-merge.yml` | Dependabot PR open/sync | Auto-merges patch updates after CI; comments on minor; labels & warns on major |
| `quarantine-label.yml` | Dependabot PR open/sync; daily | Applies `min-release-age` label to Dependabot PRs containing packages younger than 7 days |

All PRs to `main` and `dev` should require `test.yml`, `codeql.yml`, and `security.yml` to be green.

## Branch Protection Rules

Configure at **Settings → Branches → Add rule** for `main` (and ideally repeat for `dev` with a slightly looser config):

| Setting | Value | Why |
|---|---|---|
| Require a pull request before merging | enabled | No direct pushes to main |
| Require approvals | 1 | At least one approving review |
| Require review from Code Owners | enabled | Enforces `.github/CODEOWNERS` sign-off |
| Require status checks to pass | `test`, `codeql`, `security` | Block merge on red CI |
| Require branches to be up to date | enabled | Prevents stale-branch merges that skip CI |
| Require signed commits | enabled | Every commit on main must be GPG/SSH-signed |
| Require linear history | enabled | No merge commits muddying audit trail |
| Do not allow bypassing the above rules | enabled | Admins cannot force-merge |
| Allow force pushes | disabled | |
| Allow deletions | disabled | |

## Signed Commits

```bash
# Generate a key (use the same email as your GitHub account)
gpg --full-generate-key

# Tell Git to use it
git config --global user.signingkey <KEY_ID>
git config --global commit.gpgsign true

# Export and upload the public key to GitHub → Settings → SSH and GPG keys
gpg --armor --export <KEY_ID>
```

Enable Vigilant Mode under GitHub → Settings → SSH and GPG keys for an additional visual audit trail on unverified commits.

## Releases

```bash
# From an up-to-date main:
git checkout main
git tag -s v2.1.1 -m "v2.1.1"
git push origin v2.1.1
```

`release.yml` ignores tags whose commit is not reachable from `main`.

## Required GitHub Repository Configuration

No additional repository variables are required for CI. The only secret in use is `GITHUB_TOKEN`, which GitHub provides automatically.

If you choose to enable the optional `BRANCH_PROTECTION_READ_TOKEN` for the branch-protection-audit workflow, provide a fine-grained PAT scoped to this repo only with `Administration: read`.
