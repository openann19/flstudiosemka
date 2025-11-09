# Pre-commit Hook Setup

This project uses Git hooks to ensure code quality before commits.

## What Gets Checked

Before each commit, the following checks run:

1. **Linting** - ESLint checks for code style issues
2. **Type Checking** - TypeScript validates types
3. **Formatting** - Prettier ensures consistent formatting
4. **Tests** - Jest runs all tests

## Manual Setup

If hooks aren't working automatically, run:

```bash
# Make hooks executable
chmod +x .git/hooks/pre-commit

# Or create manually
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh

echo "Running pre-commit checks..."

# Run linter
npm run lint:soft
if [ $? -ne 0 ]; then
  echo "❌ ESLint found issues. Fix them before committing."
  exit 1
fi

# Run type check
npm run type-check
if [ $? -ne 0 ]; then
  echo "❌ TypeScript errors found. Fix them before committing."
  exit 1
fi

# Run tests
npm test -- --passWithNoTests
if [ $? -ne 0 ]; then
  echo "❌ Tests failed. Fix them before committing."
  exit 1
fi

echo "✅ All pre-commit checks passed!"
exit 0
EOF

chmod +x .git/hooks/pre-commit
```

## Bypass Hooks (Not Recommended)

In emergency situations, you can bypass hooks:

```bash
git commit --no-verify -m "Emergency fix"
```

**Warning:** This skips all quality checks and should be avoided.

## CI/CD Integration

The same checks run automatically in CI/CD:

- On every push to main/develop
- On every pull request
- As part of the release process

## Troubleshooting

### Hooks not running

1. Check if `.git/hooks/pre-commit` exists
2. Verify file is executable: `ls -la .git/hooks/pre-commit`
3. Manually run: `.git/hooks/pre-commit`

### Checks too slow

You can modify the pre-commit hook to run only linting:

```bash
# Quick version (lint only)
npm run lint:soft
```

Or use lint-staged for only changed files (requires additional setup).

## Best Practices

1. **Fix issues before committing** - Don't bypass hooks
2. **Run checks locally** - Use `npm run prepush` before pushing
3. **Keep commits small** - Easier to fix issues
4. **Write good commit messages** - Follow conventional commits
