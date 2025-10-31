# Contributing to StellarJS

Thank you for your interest in contributing to StellarJS! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## Getting Started

### Prerequisites

- Node.js >= 14.0.0
- npm >= 6.0.0
- Git

### Setup Development Environment

1. **Fork the repository**

   ```bash
   # Click the 'Fork' button on GitHub
   ```

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/StellarJS.git
   cd StellarJS
   ```

3. **Add upstream remote**

   ```bash
   git remote add upstream https://github.com/rahmanazhar/StellarJS.git
   ```

4. **Install dependencies**

   ```bash
   npm install
   ```

5. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Running Development Server

```bash
npm run dev
```

### Building the Project

```bash
npm run build
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:ci
```

### Linting and Formatting

```bash
# Run ESLint
npm run lint

# Fix ESLint issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting
npm run format:check

# TypeScript type checking
npm run type-check
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid using `any` whenever possible
- Use strict TypeScript configuration

### Code Style

- Follow the ESLint and Prettier configurations
- Use meaningful variable and function names
- Write self-documenting code
- Add comments for complex logic

### File Organization

```
src/
├── core/           # Core framework components
├── hooks/          # React hooks
├── server/         # Server utilities
├── services/       # Service classes
├── utils/          # Utility functions
└── types/          # TypeScript type definitions
```

### Naming Conventions

- **Files**: Use PascalCase for components, camelCase for utilities
- **Functions**: Use camelCase (e.g., `getUserData`)
- **Classes**: Use PascalCase (e.g., `StellarServer`)
- **Constants**: Use UPPER_SNAKE_CASE (e.g., `API_VERSION`)
- **Interfaces**: Use PascalCase with 'I' prefix optional (e.g., `User` or `IUser`)

## Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **build**: Build system changes
- **ci**: CI configuration changes
- **chore**: Other changes that don't modify src or test files

### Examples

```bash
feat(hooks): Add useDebounce hook

Add a new hook for debouncing values with customizable delay.

Closes #123
```

```bash
fix(server): Handle CORS preflight requests correctly

Fixed an issue where OPTIONS requests were not being handled properly.

Fixes #456
```

### Git Hooks

The project uses Husky to run automated checks:

- **pre-commit**: Runs lint-staged (ESLint + Prettier)
- **commit-msg**: Validates commit message format
- **pre-push**: Runs type-check and tests

## Pull Request Process

### Before Submitting

1. **Update your fork**

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run all checks**

   ```bash
   npm run validate
   ```

3. **Write/Update tests**

   - Add tests for new features
   - Update tests for bug fixes
   - Maintain code coverage above 70%

4. **Update documentation**
   - Update README if needed
   - Add JSDoc comments
   - Update API documentation

### Submitting a Pull Request

1. **Push your changes**

   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request**

   - Go to GitHub and create a new Pull Request
   - Use a clear and descriptive title
   - Reference related issues
   - Provide a detailed description

3. **PR Description Template**

   ```markdown
   ## Description

   Brief description of changes

   ## Type of Change

   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing

   - [ ] Tests pass locally
   - [ ] Added new tests
   - [ ] Updated existing tests

   ## Checklist

   - [ ] Code follows style guidelines
   - [ ] Self-reviewed the code
   - [ ] Commented complex code
   - [ ] Updated documentation
   - [ ] No new warnings
   - [ ] Added tests with good coverage
   - [ ] All tests pass

   ## Related Issues

   Closes #issue_number
   ```

### Review Process

- Maintainers will review your PR
- Address any requested changes
- Once approved, your PR will be merged

## Testing Guidelines

### Writing Tests

```typescript
describe('Component/Function Name', () => {
  it('should do something specific', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = functionUnderTest(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### Test Coverage

- Aim for 70%+ code coverage
- Test edge cases and error conditions
- Test both success and failure paths
- Mock external dependencies

### Test Structure

```
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
└── setup.ts        # Test setup and configuration
```

## Documentation

### JSDoc Comments

````typescript
/**
 * Brief description of the function
 *
 * @param {string} param1 - Description of param1
 * @param {number} param2 - Description of param2
 * @returns {boolean} Description of return value
 * @example
 * ```typescript
 * const result = myFunction('test', 42);
 * ```
 */
export function myFunction(param1: string, param2: number): boolean {
  // Implementation
}
````

### README Updates

- Keep README.md up to date
- Add examples for new features
- Update installation instructions if needed

## Questions or Issues?

- Create an issue for bugs or feature requests
- Join our discussions on GitHub
- Check existing issues and PRs first

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to StellarJS! 🚀**
