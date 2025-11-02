# GitLab CI/CD Setup Guide

This document explains how to set up and use the GitLab CI/CD pipeline for StellarJS.

## Overview

The GitLab CI/CD pipeline includes:

- **Linting**: ESLint, Prettier formatting check, and TypeScript type checking
- **Testing**: Running tests on Node.js versions 16, 18, and 20
- **Building**: Compiling TypeScript to JavaScript
- **Auto-versioning and Releases**: Automatic semantic versioning and release creation
- **Publishing**: Automated npm package publishing

## Pipeline Stages

### 1. Lint Stage

- `lint:eslint` - Runs ESLint to check code quality
- `lint:format` - Checks code formatting with Prettier
- `lint:typecheck` - Performs TypeScript type checking

### 2. Test Stage

- `test:node-16` - Runs tests on Node.js 16
- `test:node-18` - Runs tests on Node.js 18
- `test:node-20` - Runs tests on Node.js 20

All test jobs generate coverage reports that are available as artifacts.

### 3. Build Stage

- `build` - Compiles TypeScript and creates the `dist/` directory

### 4. Release Stage

- `release` - Automatically versions the package and creates releases using semantic-release
- `publish:npm` - Publishes the package to npm (manual trigger for tagged releases)

## Auto-Versioning and Tagging

The pipeline uses **semantic-release** to automatically:

- Analyze commit messages
- Determine the next version number
- Generate a changelog
- Create a Git tag
- Create a GitLab release
- Publish to npm

### Commit Message Format

To trigger automatic versioning, use conventional commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types that trigger releases:**

- `feat:` - New feature (minor version bump)
- `fix:` - Bug fix (patch version bump)
- `perf:` - Performance improvement (patch version bump)
- `docs:` - Documentation changes (patch version bump)
- `refactor:` - Code refactoring (patch version bump)
- `revert:` - Revert previous commit (patch version bump)
- `BREAKING CHANGE:` in footer - Major version bump

**Types that don't trigger releases:**

- `style:` - Code style changes
- `test:` - Test changes
- `build:` - Build system changes
- `ci:` - CI configuration changes
- `chore:` - Other maintenance tasks

### Examples

```bash
# Patch release (1.1.0 -> 1.1.1)
fix: Resolve issue with user authentication

# Minor release (1.1.0 -> 1.2.0)
feat: Add new data export functionality

# Major release (1.1.0 -> 2.0.0)
feat: Redesign API endpoints

BREAKING CHANGE: API endpoints have been restructured
```

## Required GitLab CI/CD Variables

To use the full pipeline, configure these variables in GitLab (Settings > CI/CD > Variables):

### For npm Publishing

- `NPM_TOKEN` - Your npm authentication token
  - Get from: https://www.npmjs.com/settings/[username]/tokens
  - Type: Access token (Automation)
  - Protected: Yes
  - Masked: Yes

### For GitLab Releases

The pipeline uses the built-in `CI_JOB_TOKEN` which is automatically available.

### Optional Variables

- `GL_TOKEN` or `GITLAB_TOKEN` - Personal access token for enhanced GitLab API access
  - Scopes: `api`, `write_repository`
  - Only needed if `CI_JOB_TOKEN` doesn't have sufficient permissions

## Setup Steps

### 1. Install Dependencies

First, install the new GitLab semantic-release plugin:

```bash
npm install --save-dev @semantic-release/gitlab
```

### 2. Configure GitLab Project

1. Go to your GitLab project
2. Navigate to Settings > CI/CD > Variables
3. Add the `NPM_TOKEN` variable (see above)

### 3. Push to GitLab

The pipeline will automatically run when you:

- Push to `main` or `develop` branches
- Create a merge request

### 4. Triggering a Release

Simply push commits to the `main` branch using conventional commit messages:

```bash
git add .
git commit -m "feat: Add new feature"
git push origin main
```

Semantic-release will automatically:

1. Analyze your commits
2. Determine the version bump
3. Update `package.json` and `package-lock.json`
4. Generate/update `CHANGELOG.md`
5. Create a Git tag
6. Create a GitLab release
7. Publish to npm

## Skipping CI

To skip the CI pipeline, add `[skip ci]` to your commit message:

```bash
git commit -m "docs: Update README [skip ci]"
```

## Pipeline Triggers

The pipeline runs on:

- Pushes to `main` branch
- Pushes to `develop` branch
- Merge requests to `main` or `develop`

The release job **only** runs on the `main` branch.

## Artifacts

The pipeline produces these artifacts:

- **Test coverage reports** (1 week retention)
- **Build output** (`dist/` directory, 1 week retention)
- **Release artifacts** (30 days retention):
  - Compiled distribution
  - npm package tarball
  - Updated CHANGELOG.md

## Configuration Files

- `.gitlab-ci.yml` - Main GitLab CI configuration
- `.releaserc.gitlab.json` - Semantic-release configuration for GitLab
- `commitlint.config.js` - Commit message validation (no length limits)

## Commit Message Length

The commit message length limit has been **removed**. You can now write commit messages of any length without restrictions.

## Migration from GitHub Actions

If you're migrating from GitHub Actions:

1. The GitLab CI pipeline mirrors the GitHub Actions workflow
2. Both use semantic-release for versioning
3. GitHub uses `.releaserc.json`, GitLab uses `.releaserc.gitlab.json`
4. The only difference is the platform-specific plugins (`@semantic-release/github` vs `@semantic-release/gitlab`)

## Troubleshooting

### Release fails with "permission denied"

- Check that CI/CD variables are set correctly
- Ensure `NPM_TOKEN` has publish permissions
- Verify that the token hasn't expired

### No release is created

- Check that your commit messages follow the conventional format
- Ensure you're pushing to the `main` branch
- Verify that the commit type triggers a release (see above)

### Tests fail

- Check the test coverage reports in the job artifacts
- Review the test output in the pipeline logs
- Run tests locally with `npm run test:ci`

## Support

For issues or questions:

- Check the [GitLab CI/CD documentation](https://docs.gitlab.com/ee/ci/)
- Review [semantic-release documentation](https://semantic-release.gitbook.io/)
- Open an issue in the project repository
