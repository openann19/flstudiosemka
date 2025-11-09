# Contributing to FL Studio Web DAW

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Code of Conduct

Be respectful, inclusive, and professional in all interactions.

## Getting Started

1. **Fork the repository**
2. **Clone your fork**: `git clone https://github.com/YOUR-USERNAME/flstudiosemka.git`
3. **Install dependencies**: `npm install --legacy-peer-deps`
4. **Create a branch**: `git checkout -b feature/your-feature-name`

## Development Workflow

### Before Making Changes

1. Run tests to ensure everything works: `npm test`
2. Run type check: `npm run type-check`
3. Run linter: `npm run lint:soft`

### Making Changes

1. Write clean, well-documented code
2. Follow the existing code style
3. Add tests for new features
4. Update documentation as needed
5. Keep commits atomic and well-described

### Code Style

- Use TypeScript for all new files
- Follow ESLint and Prettier configurations
- Use functional components and hooks for React
- Avoid console.log statements (use proper logging)
- Write meaningful variable and function names

### Testing

- Write unit tests for utilities and services
- Write integration tests for complex workflows
- Aim for 80%+ code coverage
- Run tests before committing: `npm test`

### Type Safety

- Ensure all TypeScript files pass type checking
- Use strict TypeScript settings
- Avoid using `any` type
- Run `npm run type-check` before committing

## Submitting Changes

1. **Commit your changes**: Use clear, descriptive commit messages
   ```
   git commit -m "feat: Add MIDI export functionality"
   ```

2. **Push to your fork**:
   ```
   git push origin feature/your-feature-name
   ```

3. **Create a Pull Request**:
   - Provide a clear title and description
   - Reference any related issues
   - Ensure CI passes
   - Wait for code review

## Pull Request Guidelines

- Keep PRs focused on a single feature or fix
- Update tests and documentation
- Ensure all CI checks pass
- Respond to review feedback promptly
- Squash commits if requested

## Commit Message Format

Use conventional commits format:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Example: `feat: Add reverb effect to mixer`

## Reporting Bugs

When reporting bugs, include:

1. Clear description of the issue
2. Steps to reproduce
3. Expected behavior
4. Actual behavior
5. Browser/OS information
6. Screenshots if applicable

## Suggesting Features

When suggesting features:

1. Check if the feature already exists or is planned
2. Provide clear use case and benefits
3. Consider implementation complexity
4. Be open to discussion and alternatives

## Questions?

- Open an issue for questions
- Check existing documentation
- Review closed issues for similar questions

Thank you for contributing! 🎵
