# CI/CD

## Workflows

| Workflow | Trigger | Purpose |
|---|---|---|
| `test.yml` | Push/PR to `main`, `dev` | Tests of the shared logic, a wiring test and a syntax check for each bot, Docker build validation for both images |
| `security.yml` | Push/PR to `main`, `dev`; weekly | `npm audit` with an allowlist, registry signatures, dependency review, Trivy scans of the repository and of both images, pinned-action checks |
| `codeql.yml` | Push/PR to `main`, `dev`; weekly | CodeQL static analysis |
| `scorecard.yml` | Push to `dev`; weekly | OpenSSF Scorecard, published for the README badge |
| `release.yml` | Switched off until 1.0; then: push tag `vX.Y.Z` from `main` | Builds both images, pushes them to GHCR with a build provenance, scans them with Trivy and creates the GitHub Release |
| `branch-protection-audit.yml` | Daily | Checks that the protection of `main` still matches what is described below |
| `dependabot-auto-merge.yml` | Dependabot PR opened or updated | Queues patch updates to merge once the required checks pass; labels major updates |

## Branch Protection Rules

Both branches are protected. `branch-protection-audit.yml` checks `main` every day: the first four rows are hard requirements there, and it warns when a required check is missing.

| Setting | Value | Why |
|---|---|---|
| Require signed commits | enabled | Every commit carries a verified signature |
| Allow force pushes | disabled | History is never rewritten |
| Allow deletions | disabled | |
| Require review from Code Owners | disabled | One maintainer cannot approve their own pull request; `CODEOWNERS` only requests the review |
| Required approvals | 0 | The merge gate is CI, not a second person |
| Require status checks to pass, on `dev` | `Test (dmbot, Node 24)`, `Test (roombot, Node 24)`, `Test (shared, Node 24)` | A pull request merges on green tests |
| Require status checks to pass, on `main` | The three test checks, `Analyze (javascript-typescript)`, `npm audit (dmbot)`, `npm audit (roombot)`, `Trivy filesystem scan`, `Trivy Docker image scan (dmbot)`, `Trivy Docker image scan (roombot)` | Nothing is promoted on a red test or scan |
| Require branches to be up to date | enabled | Checks ran on what will be merged |

Planned for 1.0: the rules bind administrators too.

## Signed Commits

```bash
# Generate a key (use the same email as your GitHub account)
gpg --full-generate-key

# Tell Git to use it
git config --global user.signingkey <KEY_ID>
git config --global commit.gpgsign true

# Export the public key and add it on GitHub under Settings, SSH and GPG keys
gpg --armor --export <KEY_ID>
```

An SSH key works as well: set `gpg.format` to `ssh` and `user.signingkey` to the public key file, and add the key on GitHub as a signing key.

## Creating a Release

The release workflow is switched off while the project is in early development, so that a tag cannot publish images by accident. `gh workflow enable release.yml` turns it back on at 1.0. This is what it does then:

```bash
# From an up-to-date main:
git checkout main
git tag -s v0.4.0 -m "v0.4.0"
git push origin v0.4.0
```

`release.yml` ignores a tag whose commit is not reachable from `main`. For a tag on `main` it:

1. Builds the `dmbot` and `roombot` images and pushes them to `ghcr.io/whiteravens20/matrix-bots-dmbot` and `ghcr.io/whiteravens20/matrix-bots-roombot`.
2. Attaches an SBOM and a Sigstore-signed build provenance to each image, which `gh attestation verify` checks.
3. Scans each pushed image with Trivy.
4. Creates the GitHub Release with notes generated from pull request titles.

## Required GitHub Repository Configuration

No repository variables are needed. The only secret the workflows use is `GITHUB_TOKEN`, which GitHub provides automatically.

`branch-protection-audit.yml` reads the protection rules with `BRANCH_PROTECTION_READ_TOKEN` when that secret is set: a fine-grained token for this repository alone, with read access to Administration.

## Supply-Chain Hardening

The 7-day release-age policy is enforced in three layers, each covering what the one before it cannot.

### 1. Dependabot cooldown: the primary control

`.github/dependabot.yml` sets `cooldown: default-days: 7` on every ecosystem. Dependabot does not propose a version until it has been public for a week, so a version that is too fresh never becomes a pull request and cannot be merged early, by a person or by `dependabot-auto-merge.yml`.

Cooldown covers version updates only. Dependabot security updates are exempt by design and open the moment an advisory lands.

### 2. `.npmrc`: the client-side backstop

Each bot has an `.npmrc` with two settings:

| Setting | Value | Effect |
|---|---|---|
| `ignore-scripts` | `true` | Dependencies' install scripts do not run, so a package cannot execute code at install time |
| `min-release-age` | `7` | A version published less than seven days ago is not resolved |

`min-release-age` applies when npm resolves versions, `npm install` and `npm update`, which in practice means a person adding or bumping a package by hand. It does not apply to `npm ci`, which installs exactly what the lockfile pins.

One dependency needs its install script: `@matrix-org/matrix-sdk-crypto-nodejs` downloads its native library there, and `matrix-bot-sdk` does not load without it. After `npm ci`, run that script alone:

```bash
npm rebuild @matrix-org/matrix-sdk-crypto-nodejs --ignore-scripts=false
```

The workflows install with `npm ci --ignore-scripts`; the tests do not need the library. The Docker build does not read `.npmrc`, so its `npm ci` runs the script, and the build then imports `matrix-bot-sdk` once: an image without the library fails to build.

### 3. CI verification: what actually shipped

`security.yml` installs each bot's dependencies and runs `npm audit signatures`, which verifies every installed package against its registry signature.

The same workflow runs `audit-check.mjs`: `npm audit` for production dependencies from `moderate` and for all dependencies from `high`, minus the advisories listed in `.github/scripts/audit-allowlist.json`. Each entry there has a reason and an expiry date, and an expired entry fails the job. Dependency review, Trivy over the repository and over both built images, and CodeQL run beside it.

Every action is pinned to a commit SHA with its version in a comment. `Pinned actions` checks each SHA against the tag it names, and `Actions audit` asks GitHub's advisory database about every pinned version, because Dependabot raises no alert for an action pinned by SHA.
