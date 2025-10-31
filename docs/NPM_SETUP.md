# NPM Publishing Setup Guide

This guide walks you through setting up automated npm publishing for StellarJS.

## Prerequisites

1. **npm Account**

   - Create an account at [npmjs.com](https://www.npmjs.com/signup)
   - Verify your email address
   - Enable 2FA (Two-Factor Authentication) for security

2. **Package Name**
   - The package name `stellar-js` must be available on npm
   - Current package: https://www.npmjs.com/package/stellar-js

## Setup Steps

### 1. Generate NPM Token

1. Log in to [npmjs.com](https://www.npmjs.com)
2. Click on your profile icon → **Access Tokens**
3. Click **Generate New Token**
4. Select **Automation** token type (required for CI/CD)
5. Copy the generated token (you won't see it again!)

### 2. Add Token to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `NPM_TOKEN`
5. Value: Paste the token from step 1
6. Click **Add secret**

### 3. Verify Configuration

The repository is already configured with:

- **Package configuration** ([package.json](../package.json))

  ```json
  {
    "name": "stellar-js",
    "version": "1.0.0",
    "main": "dist/index.js",
    "types": "dist/index.d.ts",
    "bin": {
      "stellar": "./cli/index.js"
    },
    "files": ["dist", "cli", "templates", "LICENSE", "README.md"]
  }
  ```

- **Release workflow** ([.github/workflows/release.yml](../.github/workflows/release.yml))

  - Triggers on push to `main` branch
  - Runs tests and linting
  - Builds the project
  - Publishes to npm via semantic-release

- **Semantic release configuration** ([.releaserc.json](../.releaserc.json))
  - Analyzes commits for versioning
  - Generates changelog
  - Creates GitHub releases
  - Publishes to npm

### 4. Test the Setup

#### Local Test (Without Publishing)

```bash
# Build the project
npm run build

# Pack the package (creates a .tgz file)
npm pack

# Test installation from the tarball
npm install -g ./stellar-js-1.0.0.tgz

# Test the CLI
stellar --version
```

#### Dry Run Release

```bash
# Install semantic-release CLI globally
npm install -g semantic-release-cli

# Run semantic-release in dry-run mode (doesn't publish)
npx semantic-release --dry-run
```

This will show you:

- What version would be published
- What changes would be in the changelog
- Whether all configurations are correct

### 5. First Release

To trigger the first automated release:

1. **Ensure your code is ready**

   ```bash
   npm run validate  # Runs tests, lint, and type-check
   npm run build     # Build the project
   ```

2. **Commit with conventional format**

   ```bash
   git add .
   git commit -m "feat: initial release with automated publishing"
   ```

3. **Push to main branch**

   ```bash
   git push origin main
   ```

4. **Monitor the release**

   - Go to **Actions** tab in GitHub
   - Watch the "Release" workflow
   - Check for any errors

5. **Verify publication**
   - Visit https://www.npmjs.com/package/stellar-js
   - Check the version number
   - Verify files are correct

### 6. Post-Release Verification

After the first successful release:

```bash
# Install from npm
npm install -g stellar-js

# Verify installation
stellar --version

# Test creating a project
stellar create test-app
```

## Troubleshooting

### Token Issues

**Error**: `npm ERR! code E401` or `npm ERR! 401 Unauthorized`

**Solution**:

1. Verify NPM_TOKEN is correct in GitHub Secrets
2. Ensure token type is "Automation"
3. Check token hasn't expired
4. Regenerate token if needed

### Package Name Conflict

**Error**: `npm ERR! 403 Forbidden`

**Solution**:

1. The package name might be taken
2. Check https://www.npmjs.com/package/stellar-js
3. If taken, update `name` in package.json
4. Update all references to the package name

### Build Failures

**Error**: Tests or build fail in CI

**Solution**:

1. Run locally first: `npm run validate && npm run build`
2. Fix any errors
3. Commit and push again

### Semantic Release Issues

**Error**: `semantic-release` fails to determine version

**Solution**:

1. Ensure commits follow conventional format
2. Check `.releaserc.json` is valid
3. Verify `GITHUB_TOKEN` is available (auto-provided)

## Maintenance

### Updating NPM Token

If your token expires or is compromised:

1. Revoke old token on npmjs.com
2. Generate new automation token
3. Update GitHub secret `NPM_TOKEN`
4. Next release will use new token

### Monitoring Releases

Set up notifications for:

- **GitHub Actions**: Settings → Notifications
- **npm**: Enable email notifications for package updates
- **GitHub Releases**: Watch the repository

## Security Best Practices

1. **Use Automation Tokens**

   - Never use personal auth tokens
   - Automation tokens are designed for CI/CD

2. **Enable 2FA**

   - Protects your npm account
   - Required for publishing public packages

3. **Limit Token Access**

   - Use tokens with minimal required permissions
   - Revoke unused tokens

4. **Monitor Package**
   - Watch for unauthorized publishes
   - Enable npm's security features
   - Review audit logs regularly

## Manual Publishing (Emergency)

If automated publishing fails:

```bash
# Login to npm (interactive)
npm login

# Build the project
npm run build

# Publish manually
npm publish

# Or with specific tag
npm publish --tag beta
```

## Publishing to Private Registry

To publish to a private npm registry:

1. Update `.npmrc`:

   ```
   registry=https://your-registry.com/
   //your-registry.com/:_authToken=${NPM_TOKEN}
   ```

2. Update workflow to use custom registry:
   ```yaml
   - name: Setup Node.js
     uses: actions/setup-node@v4
     with:
       node-version: '20'
       registry-url: 'https://your-registry.com/'
   ```

## Beta/Alpha Releases

To publish pre-release versions:

1. Create a pre-release branch
2. Update `.releaserc.json` to include branch
3. Push commits to pre-release branch
4. Versions will be: `1.1.0-alpha.1`, `1.1.0-beta.1`, etc.

See [RELEASING.md](./RELEASING.md) for details.

## Support

For help with npm publishing:

- [npm Documentation](https://docs.npmjs.com/)
- [Semantic Release Docs](https://semantic-release.gitbook.io/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

For StellarJS-specific issues:

- Open an issue on GitHub
- Contact maintainers
- Join our Discord
