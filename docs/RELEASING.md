# Release Documentation

This document explains the automated release process for StellarJS and how to work with it.

## Overview

StellarJS uses **semantic-release** for fully automated version management and package publishing. Releases are triggered automatically on every push to the `main` branch.

## Automated Release Workflow

### 1. Commit to Main Branch

When you push commits to `main` (usually via merged PR):

```bash
git push origin main
```

### 2. CI/CD Pipeline Triggers

The GitHub Actions workflow (`.github/workflows/release.yml`) runs:

1. **Build**: Compiles TypeScript to JavaScript
2. **Test**: Runs all tests with coverage
3. **Lint**: Validates code style
4. **Semantic Release**: Analyzes commits and performs release

### 3. Semantic Release Process

Semantic-release automatically:

1. **Analyzes commits** since the last release
2. **Determines version bump** based on commit types
3. **Generates/updates CHANGELOG.md**
4. **Updates package.json version**
5. **Creates a git tag**
6. **Creates a GitHub Release** with release notes
7. **Publishes to npm registry**
8. **Commits version changes back** to the repository

## Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types and Version Bumps

| Type       | Description      | Version Bump              | Example                            |
| ---------- | ---------------- | ------------------------- | ---------------------------------- |
| `feat`     | New feature      | **Minor** (1.0.0 → 1.1.0) | `feat(auth): add OAuth support`    |
| `fix`      | Bug fix          | **Patch** (1.0.0 → 1.0.1) | `fix(server): resolve memory leak` |
| `docs`     | Documentation    | **Patch** (1.0.0 → 1.0.1) | `docs: update API reference`       |
| `perf`     | Performance      | **Patch** (1.0.0 → 1.0.1) | `perf(db): optimize queries`       |
| `refactor` | Code refactoring | **Patch** (1.0.0 → 1.0.1) | `refactor(core): simplify logic`   |
| `test`     | Tests only       | **No release**            | `test: add unit tests`             |
| `chore`    | Maintenance      | **No release**            | `chore: update dependencies`       |
| `ci`       | CI changes       | **No release**            | `ci: update workflow`              |
| `style`    | Code style       | **No release**            | `style: format code`               |

### Breaking Changes

For **major** version bumps (1.0.0 → 2.0.0), include `BREAKING CHANGE:` in the commit footer:

```bash
feat(api): redesign authentication flow

This commit completely redesigns the authentication system to use
a more secure token-based approach.

BREAKING CHANGE: The authentication API has changed. All clients
must update their authentication logic. The old BasicAuth class
is removed in favor of JWTAuth.

Migration guide:
- Replace BasicAuth with JWTAuth
- Update token refresh logic
- Configure new JWT settings

Closes #123
```

### Commit Message Examples

#### Feature Addition (Minor Bump)

```bash
git commit -m "feat(hooks): add useQuery hook for data fetching"
```

#### Bug Fix (Patch Bump)

```bash
git commit -m "fix(router): prevent navigation to invalid routes"
```

#### Documentation Update (Patch Bump)

```bash
git commit -m "docs(security): add examples for rate limiting configuration"
```

#### Multiple Changes in One Commit

```bash
git commit -m "feat(server): add WebSocket support

This adds full WebSocket support with the following features:
- Real-time bidirectional communication
- Automatic reconnection handling
- Message queuing during disconnection
- Room-based messaging

Closes #234"
```

#### Breaking Change (Major Bump)

```bash
git commit -m "feat(core): migrate to ESM modules

BREAKING CHANGE: The package now uses ESM modules exclusively.
CommonJS require() is no longer supported. Update your imports:

Before: const stellar = require('stellar-js')
After: import stellar from 'stellar-js'
"
```

#### Revert (Patch Bump)

```bash
git commit -m "revert: feat(hooks): add useQuery hook

This reverts commit a1b2c3d4. The implementation had
performance issues that need to be addressed."
```

## Release Configuration

### .releaserc.json

The semantic-release configuration file defines:

- **Branches**: Which branches trigger releases (currently `main`)
- **Plugins**: Tools used in the release process
- **Release Rules**: How commits map to version bumps
- **Changelog Format**: How release notes are generated

### GitHub Actions Workflow

Located at `.github/workflows/release.yml`, this workflow:

- Runs on every push to `main`
- Skips if commit message contains `[skip ci]`
- Requires `GITHUB_TOKEN` and `NPM_TOKEN` secrets
- Publishes to npm registry

## NPM Publishing

### What Gets Published

Files included in the npm package (defined in `package.json` `files` field):

- `dist/` - Compiled JavaScript and TypeScript definitions
- `cli/` - CLI tool files
- `templates/` - Project scaffolding templates
- `README.md` - Package documentation
- `CHANGELOG.md` - Version history
- `LICENSE` - MIT license

### What's Excluded

The `.npmignore` file excludes:

- Source TypeScript files (`src/`)
- Tests and test configuration
- Development configuration files
- Documentation (except README and CHANGELOG)
- CI/CD files
- IDE configurations

## Setup Requirements

### GitHub Secrets

The following secrets must be configured in GitHub repository settings:

1. **GITHUB_TOKEN**: Automatically provided by GitHub Actions
2. **NPM_TOKEN**: Required for publishing to npm
   - Generate at https://www.npmjs.com/settings/YOUR_USERNAME/tokens
   - Select "Automation" token type
   - Add to GitHub: Settings → Secrets → Actions → New repository secret

### NPM Account Setup

1. Create an npm account at https://www.npmjs.com
2. Verify your email
3. Enable 2FA for security
4. Generate an automation token
5. Add token to GitHub secrets

## Manual Release (Emergency)

If automated release fails, you can release manually:

```bash
# Ensure you're on main with latest changes
git checkout main
git pull origin main

# Ensure dependencies are installed
npm ci

# Run tests and build
npm run validate
npm run build

# Run semantic-release
npm run semantic-release
```

**Note**: You'll need `NPM_TOKEN` and `GITHUB_TOKEN` environment variables set.

## Pre-release Versions

To create pre-release versions (alpha, beta, rc):

1. Create a pre-release branch:

   ```bash
   git checkout -b alpha
   # or
   git checkout -b beta
   ```

2. Update `.releaserc.json` to include the branch:

   ```json
   {
     "branches": [
       "main",
       { "name": "alpha", "prerelease": true },
       { "name": "beta", "prerelease": true }
     ]
   }
   ```

3. Push commits to the pre-release branch:

   ```bash
   git commit -m "feat(api): experimental feature"
   git push origin alpha
   ```

   This will create versions like: `1.1.0-alpha.1`, `1.1.0-alpha.2`, etc.

## Changelog

The CHANGELOG.md is automatically generated and includes:

- Version number and release date
- Categorized changes (Features, Bug Fixes, etc.)
- Commit messages and authors
- Links to commits and PRs
- Migration guides for breaking changes

## Version Strategy

StellarJS follows [Semantic Versioning (SemVer)](https://semver.org/):

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features (backward compatible)
- **PATCH** (1.0.0 → 1.0.1): Bug fixes (backward compatible)

### Version 1.x Stability

We're committed to stability for 1.x versions:

- No breaking changes in 1.x releases
- New features added as minor versions
- Bug fixes as patch versions
- Deprecation warnings before removing features

## Troubleshooting

### Release Failed

1. Check GitHub Actions logs
2. Verify npm token is valid
3. Ensure tests pass locally
4. Check for npm registry issues

### Wrong Version Published

Semantic-release determines version automatically. To fix:

1. Check commit messages followed convention
2. Use `revert:` commits to undo changes
3. Contact maintainers if manual intervention needed

### Changelog Not Updated

1. Ensure commits follow convention
2. Check `.releaserc.json` configuration
3. Verify semantic-release ran successfully

## Best Practices

### For Contributors

1. **One logical change per commit**
2. **Clear, descriptive commit messages**
3. **Follow the commit convention strictly**
4. **Reference issues in commit messages**
5. **Test changes before committing**

### For Maintainers

1. **Review commits in PRs** for proper format
2. **Use squash merge** to clean up commit history
3. **Ensure CI passes** before merging
4. **Monitor npm publish** after release
5. **Check GitHub releases** are created correctly

## Monitoring Releases

### After Release

1. **Check npm**: Visit https://www.npmjs.com/package/stellar-js
2. **Verify version**: `npm info stellar-js version`
3. **Test installation**: `npm install stellar-js@latest`
4. **Check GitHub Release**: Verify release notes
5. **Monitor issues**: Watch for user reports

### Release Notification

Releases are announced via:

- GitHub Releases page
- npm package page
- Twitter (@StellarJSdev)
- Discord server

## Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Semantic Release Docs](https://semantic-release.gitbook.io/)
- [Keep a Changelog](https://keepachangelog.com/)

## Questions?

For release-related questions:

- Open an issue with the `release` label
- Ask in Discord #maintainers channel
- Contact the core team
