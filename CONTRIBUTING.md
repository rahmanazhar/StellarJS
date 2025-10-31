# Contributing to StellarJS

First off, thank you for considering contributing to StellarJS! It's people like you that make StellarJS such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- Use a clear and descriptive title
- Describe the exact steps which reproduce the problem
- Provide specific examples to demonstrate the steps
- Describe the behavior you observed after following the steps
- Explain which behavior you expected to see instead and why
- Include screenshots if possible

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- Use a clear and descriptive title
- Provide a step-by-step description of the suggested enhancement
- Provide specific examples to demonstrate the steps
- Describe the current behavior and explain which behavior you expected to see instead
- Explain why this enhancement would be useful

### Pull Requests

- Fork the repo and create your branch from `main`
- If you've added code that should be tested, add tests
- If you've changed APIs, update the documentation
- Ensure the test suite passes
- Make sure your code lints
- Issue that pull request!

## Development Setup

1. Fork and clone the repo
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a branch for your changes:
   ```bash
   git checkout -b feature/amazing-feature
   ```

### Project Structure

```
stellar-js/
├── src/              # Source code
├── docs/             # Documentation
├── cli/              # CLI tools
├── tests/            # Test files
└── examples/         # Example projects
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test path/to/test

# Run tests in watch mode
npm test -- --watch
```

### Coding Style

- Use TypeScript
- Follow the existing code style
- Use meaningful variable names
- Add comments for complex logic
- Keep functions small and focused

## Documentation

- Update documentation for any changed functionality
- Add JSDoc comments for all public APIs
- Update examples if necessary
- Add inline comments for complex logic

## Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

### Commit Message Format

Each commit message consists of a header, a body and a footer. The header has a special format that includes a type and a subject:

```
<type>: <subject>

[optional body]

[optional footer]
```

Types:

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools

Example:

```
feat: add user authentication service

Implement JWT-based authentication with the following features:
- Login endpoint
- Registration endpoint
- Token verification middleware
- Role-based authorization

Closes #123
```

## Release Process

StellarJS uses **automated semantic versioning and releases**. Releases are triggered automatically when changes are pushed to the `main` branch.

### How It Works

1. **Commit Convention**: All commits must follow [Conventional Commits](https://www.conventionalcommits.org/)
2. **Automatic Version Bump**: Version is determined by commit types:
   - `feat:` commits → **minor** version bump (1.0.0 → 1.1.0)
   - `fix:`, `docs:`, `perf:`, `refactor:` → **patch** version bump (1.0.0 → 1.0.1)
   - Commits with `BREAKING CHANGE:` → **major** version bump (1.0.0 → 2.0.0)
3. **Automatic Changelog**: CHANGELOG.md is updated automatically
4. **GitHub Release**: A GitHub release is created with release notes
5. **NPM Publishing**: Package is automatically published to npm

### For Contributors

You don't need to worry about versioning! Just follow the commit convention:

```bash
# Feature (will bump minor version)
git commit -m "feat(auth): add OAuth2 support"

# Bug fix (will bump patch version)
git commit -m "fix(server): resolve CORS issue"

# Breaking change (will bump major version)
git commit -m "feat(api): redesign authentication

BREAKING CHANGE: Old auth tokens will no longer work."
```

### For Maintainers

To trigger a release:

1. Merge PRs to `main` branch
2. GitHub Actions will automatically handle the rest

Manual release (if needed):

```bash
npm run semantic-release
```

## Questions?

Feel free to open an issue with the tag `question` if you have any questions about contributing.

## License

By contributing, you agree that your contributions will be licensed under its MIT License.
