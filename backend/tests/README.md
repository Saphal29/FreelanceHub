# FreelanceHub - Unit Testing Guide

## Overview

This directory contains comprehensive unit tests for the FreelanceHub backend services. The tests are organized by service module and follow a consistent naming convention for easy navigation and maintenance.

## Test Structure

```
tests/
├── setup.js                          # Global test configuration
├── services/
│   ├── authService.test.js          # Authentication tests (UT-01 to UT-10)
│   ├── projectService.test.js       # Project management tests (UT-11 to UT-20)
│   ├── proposalService.test.js      # Proposal tests (UT-21 to UT-30)
│   ├── contractService.test.js      # Contract tests (UT-31 to UT-40)
│   ├── milestoneService.test.js     # Milestone tests (UT-41 to UT-50)
│   └── paymentService.test.js       # Payment & escrow tests (UT-51 to UT-60)
└── README.md                         # This file
```

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Ensure test database is configured
# Update .env with test database credentials
```

### Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- authService.test.js

# Run tests matching a pattern
npm test -- --testNamePattern="UT-01"

# Run tests for a specific service
npm test -- services/projectService.test.js
```

## Test Coverage

To generate and view coverage reports:

```bash
# Generate coverage report
npm run test:coverage

# Coverage report will be in coverage/ directory
# Open coverage/lcov-report/index.html in browser
```

### Coverage Targets

- Statements: 70%
- Branches: 70%
- Functions: 70%
- Lines: 70%

## Test Naming Convention

Each test follows this structure:

```javascript
/**
 * ============================================
 * {SERVICE NAME} - UNIT TESTS
 * ============================================
 * Tests for {service description}
 * Covers: {features covered}
 */

describe('{Service} Service - Unit Tests', () => {
  
  // ============================================
  // UT-{ID}: {Test Description}
  // ============================================
  describe('UT-{ID}: {Test Description}', () => {
    it('should {expected behavior}', async () => {
      // Test implementation
    });
  });
});
```

## Test IDs Reference

### Authentication Service (UT-01 to UT-10)
- UT-01: Register with valid data
- UT-02: Register with existing email
- UT-03: Login with correct credentials
- UT-04: Login with wrong password
- UT-05: OTP verification with expired OTP
- UT-06: OTP verification with valid OTP
- UT-07: Login with unverified account
- UT-08: Login with suspended account
- UT-09: Resend OTP for valid email
- UT-10: Request password reset

### Project Service (UT-11 to UT-20)
- UT-11: Create project with valid data
- UT-12: Create project with missing title
- UT-13: Update project details
- UT-14: Delete project
- UT-15: Search projects by keyword
- UT-16: Filter projects by category
- UT-17: Filter projects by budget range
- UT-18: Get project by ID
- UT-19: Get project with non-existent ID
- UT-20: Update project by non-owner

### Proposal Service (UT-21 to UT-30)
- UT-21: Submit proposal with valid data
- UT-22: Submit duplicate proposal
- UT-23: Accept proposal
- UT-24: Reject proposal
- UT-25: Get freelancer proposals
- UT-26: Get project proposals
- UT-27: Update proposal before acceptance
- UT-28: Update accepted proposal
- UT-29: Withdraw proposal
- UT-30: Accept proposal by non-owner

### Contract Service (UT-31 to UT-40)
- UT-31: Create contract from accepted proposal
- UT-32: Create contract from non-accepted proposal
- UT-33: Sign contract by client
- UT-34: Sign contract by freelancer
- UT-35: Activate contract when both parties sign
- UT-36: Prevent duplicate signature
- UT-37: Get user contracts
- UT-38: Filter contracts by status
- UT-39: Get contract by ID
- UT-40: Unauthorized contract access

### Milestone Service (UT-41 to UT-50)
- UT-41: Create milestone with valid data
- UT-42: Submit milestone for review
- UT-43: Approve milestone submission
- UT-44: Reject milestone submission
- UT-45: Request revision on milestone
- UT-46: Get project milestones
- UT-47: Update milestone details
- UT-48: Delete milestone
- UT-49: Submit milestone without deliverables
- UT-50: Review milestone with invalid action

### Payment Service (UT-51 to UT-60)
- UT-51: Initiate eSewa payment with valid data
- UT-52: Calculate platform fees correctly
- UT-53: Verify eSewa payment
- UT-54: Release escrow to freelancer
- UT-55: Refund escrow to client
- UT-56: Get contract payments
- UT-57: Prevent unauthorized escrow release
- UT-58: Prevent release of already released escrow
- UT-59: Generate unique order ID
- UT-60: Get contract escrow records

## Mocking Strategy

### Database Queries
All database queries are mocked using Jest:

```javascript
jest.mock('../../src/utils/dbQueries');
const { query } = require('../../src/utils/dbQueries');

// Mock query response
query.mockResolvedValueOnce({
  rows: [{ id: 'test-id', name: 'Test' }]
});
```

### External Services
External services (email, payment gateways) are mocked:

```javascript
jest.mock('../../src/services/emailService');
const emailService = require('../../src/services/emailService');

emailService.sendOTPEmail.mockResolvedValue(true);
```

## Writing New Tests

When adding new tests:

1. **Create test file** in appropriate directory
2. **Follow naming convention**: `{service}.test.js`
3. **Assign test ID**: Continue from last ID (UT-61, UT-62, etc.)
4. **Add comments**: Include test ID and description
5. **Mock dependencies**: Mock all external dependencies
6. **Test both paths**: Test success and failure scenarios
7. **Update documentation**: Add test to TESTING_DOCUMENTATION.md

### Example Test Template

```javascript
/**
 * ============================================
 * {SERVICE} SERVICE - UNIT TESTS
 * ============================================
 * Tests for {service} service functions
 * Covers: {features}
 */

const service = require('../../src/services/{service}');

jest.mock('../../src/utils/dbQueries');
const { query } = require('../../src/utils/dbQueries');

describe('{Service} Service - Unit Tests', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // UT-{ID}: {Description}
  // ============================================
  describe('UT-{ID}: {Description}', () => {
    it('should {expected behavior}', async () => {
      // Arrange
      const input = { /* test data */ };
      query.mockResolvedValueOnce({ rows: [/* mock data */] });

      // Act
      const result = await service.method(input);

      // Assert
      expect(result).toHaveProperty('expectedProperty');
      expect(query).toHaveBeenCalled();
    });
  });
});
```

## Debugging Tests

### Run specific test with verbose output
```bash
npm test -- --verbose authService.test.js
```

### Debug in VS Code
Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### View console logs
```bash
npm test -- --silent=false
```

## Continuous Integration

Tests are automatically run in CI/CD pipeline:

1. **On Pull Request**: All tests must pass
2. **On Push to Main**: Full test suite + coverage check
3. **Nightly**: Full test suite + integration tests

## Troubleshooting

### Tests failing locally but passing in CI
- Clear Jest cache: `npm test -- --clearCache`
- Check Node version matches CI
- Ensure all dependencies installed

### Database connection errors
- Verify test database is running
- Check DATABASE_URL in .env
- Ensure test database has correct schema

### Timeout errors
- Increase timeout in jest.config.js
- Check for unresolved promises
- Verify mocks are properly configured

## Best Practices

1. **Keep tests isolated**: Each test should be independent
2. **Mock external dependencies**: Don't make real API calls
3. **Test edge cases**: Include boundary conditions
4. **Use descriptive names**: Test names should explain what they test
5. **Clean up**: Use beforeEach/afterEach for setup/teardown
6. **Avoid test interdependence**: Tests should run in any order
7. **Keep tests fast**: Unit tests should complete in milliseconds

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://testingjavascript.com/)
- [FreelanceHub Testing Documentation](../../TESTING_DOCUMENTATION.md)

## Support

For questions or issues with tests:
- Check existing test files for examples
- Review TESTING_DOCUMENTATION.md
- Contact development team

---

**Last Updated:** April 2026  
**Test Framework:** Jest v29.7.0  
**Total Tests:** 60 unit tests  
**Coverage:** 78% (target: 70%)
