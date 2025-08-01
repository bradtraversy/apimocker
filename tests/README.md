# API Testing Guide

This document provides comprehensive information about testing the ApiMocker routes and components.

## 🧪 Testing Overview

The testing suite includes:

- **Integration Tests**: Full API endpoint testing with real database operations
- **Unit Tests**: Individual component testing with mocked dependencies
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

# Test Database (use a separate test database)
DATABASE_URL="postgresql://test:test@localhost:5432/apimocker_test"

# Rate Limiting (lower limits for testing)
RATE_LIMIT_WINDOW_MS=60000 # 1 minute for testing
RATE_LIMIT_MAX_WRITES=10 # 10 writes per minute for testing

# Logging
LOG_LEVEL=error # Only log errors during tests
```

### 3. Set Up Test Database

```bash
# Create test database
createdb apimocker_test

# Generate Prisma client
npm run db:generate

# Push schema to test database
DATABASE_URL="postgresql://test:test@localhost:5432/apimocker_test" npm run db:push
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
describe('GET /api/users', () => {
  it('should return all users with pagination', async () => {
    // Create test data
    const user1 = await db.createUser(sampleUsers[0]);
    const user2 = await db.createUser(sampleUsers[1]);

    // Make API request
    const response = await apiTester.testGetAll('/api/users');

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
await apiTester.testGetAll('/api/users');
await apiTester.testGetById('/api/users', 1);
await apiTester.testCreate('/api/users', userData);
await apiTester.testUpdate('/api/users', 1, updateData);
await apiTester.testDelete('/api/users', 1);
await apiTester.testPagination('/api/users', 1, 5);
await apiTester.testValidationError('/api/users', 'post', invalidData);
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

### Users API (`/api/users`)

- ✅ GET /api/users (with pagination and filtering)
- ✅ GET /api/users/:id
- ✅ POST /api/users (with validation)
- ✅ PUT /api/users/:id
- ✅ DELETE /api/users/:id
- ✅ GET /api/users/:id/posts
- ✅ GET /api/users/:id/todos

### Posts API (`/api/posts`)

- ✅ GET /api/posts (with pagination and userId filtering)
- ✅ GET /api/posts/:id
- ✅ POST /api/posts (with validation)
- ✅ PUT /api/posts/:id
- ✅ DELETE /api/posts/:id

### Todos API (`/api/todos`)

- ✅ GET /api/todos (with pagination, userId, and completed filtering)
- ✅ GET /api/todos/:id
- ✅ POST /api/todos (with validation)
- ✅ PUT /api/todos/:id
- ✅ DELETE /api/todos/:id

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

- **Environment Variables**: Loads test-specific environment
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
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: apimocker_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run db:generate
      - run: npm run db:push
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
# Check environment variables
echo $DATABASE_URL

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
