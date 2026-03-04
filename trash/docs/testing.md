# Testing Guide

This project uses Bun's built-in test runner for unit tests and Playwright for E2E tests.

## Running Tests

### Unit Tests

```bash
# Run all unit tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage

# Run specific test file
bun test src/utils/__tests__/manga.test.ts

# Run tests matching pattern
bun test --filter="manga"
```

### E2E Tests

```bash
# Install Playwright browsers (first time only)
bunx playwright install

# Run all E2E tests
bun test:e2e

# Run E2E tests with UI mode
bun test:e2e:ui

# Run specific E2E test
bunx playwright test e2e/homepage.spec.ts

# Run tests in headed mode (see browser)
bunx playwright test --headed

# Run tests in specific browser
bunx playwright test --project=chromium
```

## Writing Tests

### Unit Tests

Unit tests are written using Bun's test syntax with React Testing Library for component testing.

#### Testing a Utility Function

```typescript
// src/utils/__tests__/myUtil.test.ts
import { describe, test, expect } from 'bun:test'
import { myFunction } from '../myUtil'

describe('myFunction', () => {
  test('should return expected value', () => {
    expect(myFunction('input')).toBe('expected output')
  })
})
```

#### Testing a React Component

```typescript
// src/components/__tests__/MyComponent.test.tsx
import { describe, test, expect } from 'bun:test'
import { render, screen } from '@/test/utils/render'
import MyComponent from '../MyComponent'

describe('MyComponent', () => {
  test('renders correctly', () => {
    render(<MyComponent title="Test" />)

    expect(screen.getByText('Test')).toBeDefined()
  })
})
```

#### Testing a Custom Hook

```typescript
// src/hooks/__tests__/useCustomHook.test.ts
import { describe, test, expect } from 'bun:test'
import { renderHook } from '@/test/utils/render'
import { useCustomHook } from '../useCustomHook'

describe('useCustomHook', () => {
  test('returns expected values', () => {
    const { result } = renderHook(() => useCustomHook())

    expect(result.current.value).toBe('expected')
  })
})
```

### E2E Tests

E2E tests are written using Playwright's test syntax.

```typescript
// e2e/feature.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Feature', () => {
  test('user can complete action', async ({ page }) => {
    await page.goto('/path')

    // Interact with page
    await page.click('button[type="submit"]')

    // Assert results
    await expect(page.locator('.success')).toBeVisible()
  })
})
```

## Test Organization

```
src/
├── components/
│   ├── __tests__/
│   │   └── Component.test.tsx
│   └── Component.tsx
├── utils/
│   ├── __tests__/
│   │   └── util.test.ts
│   └── util.ts
├── test/
│   ├── setup.ts         # Test environment setup
│   └── utils/
│       └── render.tsx   # Custom render with providers
e2e/
├── homepage.spec.ts
└── auth.spec.ts
```

## Best Practices

1. **Collocate tests with source code** - Place test files in `__tests__` folders next to the code they test
2. **Use descriptive test names** - Test names should clearly describe what is being tested
3. **Follow AAA pattern** - Arrange, Act, Assert
4. **Test user behavior, not implementation** - Focus on what users see and do
5. **Keep tests independent** - Each test should be able to run in isolation
6. **Use data-testid sparingly** - Prefer accessible queries (role, label, text)
7. **Mock external dependencies** - Don't make real API calls in unit tests

## Mocking

### Mocking Modules

```typescript
import { mock } from 'bun:test'

// Mock a module
mock.module('./api', () => ({
  fetchData: () => Promise.resolve({ data: 'mocked' }),
}))
```

### Mocking Next.js Features

```typescript
// Mock useRouter
import { mock } from 'bun:test'

mock.module('next/navigation', () => ({
  useRouter: () => ({
    push: mock(),
    replace: mock(),
    prefetch: mock(),
  }),
  useSearchParams: () => new URLSearchParams(),
}))
```

## Coverage

Test coverage reports are generated in the `coverage/` directory:

- `coverage/index.html` - HTML report
- `coverage/lcov.info` - LCOV format for CI tools

## Debugging Tests

```bash
# Run tests with verbose output
bun test --verbose

# Run specific test by name
bun test -t "should handle error"

# Use console.log for debugging
# Bun will display console output during tests
```

## CI/CD Integration

Tests run automatically on:

- Pull requests
- Commits to main/stage branches
- Pre-push hooks (type checking)

To skip pre-push hooks temporarily:

```bash
git push --no-verify
```
