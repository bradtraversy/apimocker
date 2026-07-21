# API Testing Guide

This document provides comprehensive information about testing the ApiMocker routes and components.

## 🧪 Testing Overview

The testing suite includes:

- **Integration Tests**: Full API endpoint testing with real database operations
- **Unit Tests**: Individual component testing with mocked dependencies
- **Environment Tests**: Isolated route testing with mocked persistence
- **Test Utilities**: Reusable testing helpers and data generators
- **Test Database**: Isolated test database for consistent testing

## 📁 Test Structure

```
tests/
├── setup.ts                    # Global test configuration
├── utils/
│   └── testHelpers.ts         # Test utilities and helpers
├── integration/
│   ├── users.test.ts          # User routes integration tests
│   ├── posts.test.ts          # Post routes integration tests
│   └── todos.test.ts          # Todo routes integration tests
├── unit/
│   └── genericController.test.ts  # Controller unit tests
└── README.md                  # This file
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Test Environment

Create a `.env.test` file in the root directory:

```env
# Test Environment Variables
NODE_ENV=test
PORT=3001

# Test Database (must be separate from development and production)
TEST_DATABASE_URL="postgresql://test:test@localhost:5432/apimocker_test"
# For a disposable schema, append ?schema=apimocker_test to this URL

# Rate Limiting (lower limits for testing)
RATE_LIMIT_WINDOW_MS=60000 # 1 minute for testing
RATE_LIMIT_MAX_WRITES=100 # Matches the integration test expectation

# Logging
LOG_LEVEL=error # Only log errors during tests
```

### 3. Set Up Test Database

```bash
# Create test database
createdb apimocker_test

# Generate Prisma client
npm run db:generate

# Push schema with both Prisma URLs pinned to the test database
TEST_DATABASE_URL="postgresql://test:test@localhost:5432/apimocker_test"
DATABASE_URL="$TEST_DATABASE_URL" DIRECT_URL="$TEST_DATABASE_URL" npm run db:push
```

### 4. Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run only integration tests
npm run test:integration

# Run only unit tests
npm run test:unit

# Run isolated environment tests without a database
npm run test:environment -- --runInBand
```

## 🧪 Test Types

### Integration Tests

Integration tests test the full API endpoints with real database operations. They verify:

- **CRUD Operations**: Create, Read, Update, Delete for all resources
- **Pagination**: Page-based navigation with proper metadata
- **Filtering**: Query-based filtering (userId, completed status, etc.)
- **Validation**: Input validation and error responses
- **Rate Limiting**: Rate limit enforcement
- **Relationships**: Related data retrieval (user posts, user todos)
- **Error Handling**: Proper error responses for various scenarios

#### Example Integration Test

```typescript
describe('GET /users', () => {
  it('should return all users with pagination', async () => {
    // Create test data
    const user1 = await db.createUser(sampleUsers[0]);
    const user2 = await db.createUser(sampleUsers[1]);

    // Make API request
    const response = await apiTester.testGetAll('/users');

    // Verify response
    expect(response.body.data).toHaveLength(2);
    expect(response.body.pagination.total).toBe(2);
  });
});
```

### Unit Tests

Unit tests test individual components in isolation with mocked dependencies. They verify:

- **Controller Logic**: Business logic in the GenericController
- **Error Handling**: Proper error responses
- **Data Transformation**: Correct data formatting
- **Edge Cases**: Boundary conditions and error scenarios

#### Example Unit Test

```typescript
describe('GenericController', () => {
  it('should return a user by ID', async () => {
    const mockUser = { id: 1, name: 'John Doe' };
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    await controller.getById(mockRequest, mockResponse, mockNext);

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
    });
    expect(mockResponse.json).toHaveBeenCalledWith(mockUser);
  });
});
```

## 🛠 Test Utilities

### TestDatabase Class

Manages test database operations:

```typescript
const db = new TestDatabase();

// Create test data
const user = await db.createUser(sampleUsers[0]);
const post = await db.createPost({ title: 'Test', userId: user.id });

// Clean up
await db.cleanup();
```

### ApiTester Class

Provides common API testing methods:

```typescript
const apiTester = new ApiTester(app);

// Test common operations
await apiTester.testGetAll('/users');
await apiTester.testGetById('/users', 1);
await apiTester.testCreate('/users', userData);
await apiTester.testUpdate('/users', 1, updateData);
await apiTester.testDelete('/users', 1);
await apiTester.testPagination('/users', 1, 5);
await apiTester.testValidationError('/users', 'post', invalidData);
```

### Sample Data

Pre-defined test data for consistent testing:

```typescript
import { sampleUsers, samplePosts, sampleTodos } from '../utils/testHelpers';

// Use sample data in tests
const user = await db.createUser(sampleUsers[0]);
```

## 📊 Test Coverage

The test suite covers:

### Users API (`/users`)

- ✅ GET /users (with pagination and filtering)
- ✅ GET /users/:id
- ✅ POST /users (with validation)
- ✅ PUT /users/:id
- ✅ DELETE /users/:id
- ✅ GET /users/:id/posts
- ✅ GET /users/:id/todos

### Posts API (`/posts`)

- ✅ GET /posts (with pagination and userId filtering)
- ✅ GET /posts/:id
- ✅ POST /posts (with validation)
- ✅ PUT /posts/:id
- ✅ DELETE /posts/:id

### Todos API (`/todos`)

- ✅ GET /todos (with pagination, userId, and completed filtering)
- ✅ GET /todos/:id
- ✅ POST /todos (with validation)
- ✅ PUT /todos/:id
- ✅ DELETE /todos/:id

### Generic Controller

- ✅ getAll method (pagination, filtering, error handling)
- ✅ getById method (success, 404, invalid ID)
- ✅ create method (success, validation errors)
- ✅ update method (success, 404, validation errors)
- ✅ delete method (success, 404, invalid ID)
- ✅ getRelated method (related data retrieval)

### Cross-Cutting Concerns

- ✅ Rate limiting enforcement
- ✅ Input validation
- ✅ Error handling
- ✅ Database relationships
- ✅ Pagination metadata

## 🔧 Test Configuration

### Jest Configuration

The Jest configuration (`jest.config.js`) includes:

- **TypeScript Support**: ts-jest preset for TypeScript files
- **Test Environment**: Node.js environment
- **Coverage**: HTML, text, and LCOV coverage reports
- **Setup**: Global test setup file
- **Timeout**: 10 seconds for test timeout
- **Module Mapping**: Path aliases for clean imports

### Test Setup

The test setup (`tests/setup.ts`) handles:

- **Environment Variables**: Requires `TEST_DATABASE_URL` and uses its optional `?schema=` value for every test client
- **Database Cleanup**: Cleans database before and after all tests
- **Global Configuration**: Sets up test environment
- **Timeout Configuration**: Increases timeout for database operations

## 🐛 Debugging Tests

### Running Individual Tests

```bash
# Run specific test file
npm test -- users.test.ts

# Run specific test suite
npm test -- --testNamePattern="should return all users"

# Run tests with verbose output
npm test -- --verbose
```

### Debug Mode

```bash
# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Database Debugging

```bash
# Connect to test database
psql postgresql://test:test@localhost:5432/apimocker_test

# Check test data
SELECT * FROM "User";
SELECT * FROM "Post";
SELECT * FROM "Todo";
```

## 📈 Continuous Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    env:
      TEST_DATABASE_URL: postgresql://postgres:test@localhost:5432/apimocker_test
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: apimocker_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '22'
      - run: npm ci
      - run: npm run db:generate
      - run: npm run db:push
        env:
          DATABASE_URL: ${{ env.TEST_DATABASE_URL }}
          DIRECT_URL: ${{ env.TEST_DATABASE_URL }}
      - run: npm test
      - run: npm run test:coverage
```

## 🎯 Best Practices

### Test Organization

1. **Arrange**: Set up test data and conditions
2. **Act**: Execute the operation being tested
3. **Assert**: Verify the expected outcomes

### Test Data Management

- Use isolated test database
- Never point `TEST_DATABASE_URL` at development or production data
- Clean up data between tests
- Use consistent sample data
- Avoid test interdependencies

### Error Testing

- Test both success and failure scenarios
- Verify proper error status codes
- Check error message content
- Test edge cases and boundary conditions

### Performance

- Use efficient database operations
- Avoid unnecessary API calls
- Clean up resources properly
- Use appropriate timeouts

## 🚨 Common Issues

### Database Connection Issues

```bash
# Check database connection
psql postgresql://test:test@localhost:5432/apimocker_test

# Reset test database
dropdb apimocker_test
createdb apimocker_test
```

### Test Timeout Issues

```bash
# Increase timeout for slow tests
jest.setTimeout(30000);

# Run tests with longer timeout
npm test -- --testTimeout=30000
```

### Environment Variable Issues

```bash
# Confirm the dedicated test URL is configured without printing it
test -n "$TEST_DATABASE_URL" && echo "TEST_DATABASE_URL is configured"

# Set test environment explicitly
NODE_ENV=test npm test
```

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
- [Express Testing Best Practices](https://expressjs.com/en/advanced/best-practices-performance.html#testing)

---

**Happy Testing! 🎉**
