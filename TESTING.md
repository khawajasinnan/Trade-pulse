# Trade-Pulse Testing Documentation

## Overview

This document provides comprehensive information about the testing infrastructure, test suites, and testing procedures for the Trade-Pulse financial analytics platform.

## Test Infrastructure

### Backend Testing Stack

- **Jest**: Testing framework
- **ts-jest**: TypeScript preprocessor for Jest
- **Supertest**: HTTP assertion library for integration tests
- **jest-mock-extended**: Deep mocking for TypeScript

### Configuration Files

- `jest.config.js` - Jest configuration
- `src/__tests__/setupTests.ts` - Global test setup and environment
- `src/__tests__/helpers.ts` - Shared test utilities and mock factories

## Running Tests

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- auth.controller.test

#Run tests in watch mode
npm test -- --watch

# Run tests verbosely
npm test -- --verbose
```

### Test Organization

```
backend/src/__tests__/
├── setupTests.ts          # Global test configuration
├── helpers.ts             # Mock factories and utilities
├── controllers/           # Controller unit tests
│   ├── auth.controller.test.ts
│   └── dashboard.controller.test.ts
├── services/              # Service unit tests
│   └── forex.service.test.ts
├── middleware/            # Middleware unit tests
│   └── auth.middleware.test.ts
└── integration/           # Integration tests
    └── auth.integration.test.ts
```

## Test Suites

### Controller Tests

#### Auth Controller (`auth.controller.test.ts`)
Tests authentication functionality:
- User signup with validation
- User login with credential verification
- Logout functionality
- Get current user data
- Password change with validation

**Coverage**:
- Valid signup scenarios
- Duplicate email rejection
- Admin signup restrictions
- Login with valid/invalid credentials
- Banned user handling
- Password change validation

#### Dashboard Controller (`dashboard.controller.test.ts`)
Tests dashboard data aggregation:
- Dashboard data retrieval
- Market heatmap generation
- Market statistics calculation

**Coverage**:
- Successful data retrieval
- API error handling
- Service integration

### Service Tests

#### Forex Service (`forex.service.test.ts`)
Tests currency exchange functionality:
- Real-time rate fetching
- Caching mechanisms
- API fallback strategies
- Multiple rate batch fetching
- Historical data retrieval
- 24h change calculations

**Coverage**:
- Cache hit/miss scenarios
- API response handling
- Error recovery with fallbacks
- Currency pair normalization
- Historical data queries

### Middleware Tests

#### Auth Middleware (`auth.middleware.test.ts`)
Tests authentication and authorization:
- JWT token validation
- User authentication from cookies/headers
- Role-based access control (Trader, Admin)
- Banned user detection

**Coverage**:
- Valid/invalid token handling
- Missing token scenarios
- User not found cases
- Banned account rejection
- Role permission enforcement

### Integration Tests

#### Auth Integration (`auth.integration.test.ts`)
Tests complete authentication flows:
- Full signup flow
- Complete login/logout cycle
- Failed login attempt tracking

**Coverage**:
- End-to-end user registration  
- Session management
- Cross-endpoint authentication

## Mock Helpers

### Request/Response Mocks

```typescript
// Mock Express Request
const req = mockRequest({
  body: { email: 'test@example.com' },
  params: { id: '123' },
  query: { limit: '10' }
});

// Mock Express Response
const res = mockResponse();

// Mock Authenticated Request
const authReq = mockAuthRequest('user-id', 'Trader', {
  body: { amount: 100 }
});
```

### Data Factory Mocks

```typescript
// Create mock user
const user = createMockUser({
  email: 'custom@example.com',
  role: 'Admin'
});

// Create mock portfolio
const portfolio = createMockPortfolio({
  currency: 'EUR',
  amount: 1000
});

// Create mock alert
const alert = createMockAlert({
  currencyPair: 'EUR-USD',
  targetValue: 1.2
});

// Create mock historical data
const historicalData = createMockHistoricalData({
  currencyPair: 'GBP-USD',
  close: 1.25
});
```

## Writing New Tests

### Controller Test Template

```typescript
import { Request, Response } from 'express';
import * as controller from '../../controllers/your.controller';
import { mockRequest, mockResponse } from '../helpers';

jest.mock('@prisma/client');

describe('Your Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('yourFunction', () => {
    it('should handle success case', async () => {
      const req = mockRequest({ /* ... */ }) as Request;
      const res = mockResponse() as Response;

      // Setup mocks
      // Call controller
      // Assert expectations

      await controller.yourFunction(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });

    it('should handle error case', async () => {
      // Test error scenarios
    });
  });
});
```

### Service Test Template

```typescript
import * as service from '../../services/your.service';

jest.mock('dependencies');

describe('Your Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('yourFunction', () => {
    it('should process data correctly', async () => {
      // Setup
      // Execute
      const result = await service.yourFunction();

      // Assert
      expect(result).toBeDefined();
    });
  });
});
```

## Test Coverage Goals

- **Overall Coverage**: >70%
- **Critical Paths**: >90%
  - Authentication flows
  - Payment processing
  - Data validation
  - Security middleware

## Current Test Status

### Implemented Tests

✅ **Backend Unit Tests**:
- Auth Controller (13 test cases)
- Dashboard Controller (4 test cases)
- Forex Service (10 test cases)
- Auth Middleware (9 test cases)

✅ ** Backend Integration Tests**:
- Auth Integration (3 test flows)

### Test Results Summary

**Controllers**: Some tests require adjustments for Prisma mocking
**Services**: Forex service tests pass with proper mocking
**Middleware**: Auth middleware tests pass successfully
**Integration**: Authentication flow tests structured correctly

## Known Issues and Limitations

1. **Controller Tests**: Some controller tests fail because controllers instantiate their own PrismaClient. This should be refactored to use dependency injection for better testability.

2. **Prisma Mocking**: The current Prisma mocking strategy works for middleware but needs adjustment for controllers.

3. **External API Testing**: Forex API calls are mocked. For more comprehensive testing, consider using tools like `nock` for HTTP mocking.

## Best Practices

### 1. Test Isolation
- Each test should be independent
- Use `beforeEach` to reset mocks between tests
- Avoid shared state between tests

### 2. Descriptive Test Names
```typescript
// Good
it('should reject login with incorrect password')

// Bad
it('test login')
```

### 3. Arrange-Act-Assert Pattern
```typescript
it('should create user successfully', async () => {
  // Arrange: Setup mocks and data
  const mockData = { /* ... */ };

  // Act: Execute function
  const result = await createUser(mockData);

  // Assert: Verify expectations
  expect(result).toBeDefined();
});
```

### 4. Mock External Dependencies
- Always mock database calls
- Mock external APIs
- Mock file system operations
- Mock time-dependent functions

### 5. Test Error Paths
- Test both success and failure scenarios
- Verify error messages
- Check error status codes
- Test edge cases

## Continuous Integration

### GitHub Actions (Example)

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v2
```

## Debugging Tests

### Run Single Test
```bash
npm test -- -t "should login successfully"
```

### Enable Debug Output
```bash
DEBUG=* npm test
```

### Inspect Failed Assertions
```typescript
// Use console.log in tests (will be captured)
console.log('Response:', res.json.mock.calls);
```

## Future Enhancements

1. **Frontend Tests**: Add React Testing Library tests for components
2. **E2E Tests**: Add Playwright/Cypress tests
3. **Performance Tests**: Add load testing with k6
4. **Visual Regression**: Add visual testing with Percy
5. **API Contract Testing**: Add Pact tests
6. **Mutation Testing**: Add Stryker for mutation testing

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)
- [React Testing Library](https://testing-library.com/react)

## Support

For testing questions or issues:
1. Check existing test files for examples
2. Review this documentation
3. Consult Jest documentation
4. Create an issue in the repository
