# ApiMocker 🚀

A comprehensive fake REST API service for developers to test against, built with Node.js, Express, TypeScript, and PostgreSQL. Similar to JSONPlaceholder but with enhanced features including rate limiting, validation, and realistic data.

## ✨ Features

- **Full CRUD Operations** - Create, Read, Update, Delete for all resources
- **Realistic Data** - 10 users, 100 posts, 200 todos with realistic content
- **Rate Limiting** - Configurable limits to prevent abuse
- **Input Validation** - Comprehensive validation for all endpoints
- **Pagination** - Built-in pagination support
- **Filtering** - Query-based filtering for all resources
- **Daily Reset** - Automatic database reset at midnight UTC
- **Comprehensive Logging** - Request/response logging with Winston
- **TypeScript** - Full type safety throughout the application
- **Prisma ORM** - Type-safe database operations
- **Neon PostgreSQL** - Cloud-hosted database

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Validation**: express-validator
- **Rate Limiting**: express-rate-limit
- **Logging**: Winston
- **Security**: Helmet, CORS
- **Scheduling**: node-cron

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Neon PostgreSQL database

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd apimocker
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:

   ```env
   # Database
   DATABASE_URL="postgresql://username:password@host/database?sslmode=require"

   # Server
   PORT=8000
   NODE_ENV=development

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=86400000 # 24 hours
   RATE_LIMIT_MAX_WRITES=100 # 100 writes per day per IP

   # Logging
   LOG_LEVEL=info
   ```

4. **Generate Prisma client**

   ```bash
   npm run db:generate
   ```

5. **Push database schema**

   ```bash
   npm run db:push
   ```

6. **Seed the database**

   ```bash
   npm run db:seed
   ```

7. **Start the server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:8000`

## 📊 API Endpoints

### Base URL

```
http://localhost:8000
```

### Web Interface

```
http://localhost:8000/
```

A beautiful web interface with API documentation and quick testing links.

### API Base URL

```
http://localhost:8000/api
```

### Health Check

```http
GET /health
```

**Response:**

```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600
}
```

### Users

#### Get All Users

```http
GET /api/users
```

**Query Parameters:**

- `_page` (optional): Page number (default: 1)
- `_limit` (optional): Items per page (default: 10, max: 100)

**Example:**

```http
GET /api/users?_page=1&_limit=5
```

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "username": "johndoe",
      "email": "john.doe@example.com",
      "phone": "+1-555-0123",
      "website": "https://johndoe.dev",
      "address": {
        "street": "123 Main St",
        "suite": "Apt 4B",
        "city": "New York",
        "zipcode": "10001",
        "geo": { "lat": "40.7128", "lng": "-74.0060" }
      },
      "company": {
        "name": "Tech Solutions Inc",
        "catchPhrase": "Innovating the future",
        "bs": "harness real-time e-markets"
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 10,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Get User by ID

```http
GET /api/users/:id
```

**Example:**

```http
GET /api/users/1
```

#### Create User

```http
POST /api/users
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "New User",
  "username": "newuser",
  "email": "newuser@example.com",
  "phone": "+1-555-0123",
  "website": "https://newuser.com",
  "address": {
    "street": "123 Main St",
    "suite": "Apt 4B",
    "city": "New York",
    "zipcode": "10001",
    "geo": { "lat": "40.7128", "lng": "-74.0060" }
  },
  "company": {
    "name": "Company Name",
    "catchPhrase": "Company catchphrase",
    "bs": "Company business statement"
  }
}
```

#### Update User

```http
PUT /api/users/:id
Content-Type: application/json
```

**Example:**

```http
PUT /api/users/1
{
  "name": "Updated Name"
}
```

#### Delete User

```http
DELETE /api/users/:id
```

**Example:**

```http
DELETE /api/users/1
```

#### Get User's Posts

```http
GET /api/users/:id/posts
```

**Query Parameters:**

- `_page` (optional): Page number (default: 1)
- `_limit` (optional): Items per page (default: 10)

**Example:**

```http
GET /api/users/1/posts?_page=1&_limit=5
```

#### Get User's Todos

```http
GET /api/users/:id/todos
```

**Query Parameters:**

- `_page` (optional): Page number (default: 1)
- `_limit` (optional): Items per page (default: 10)

**Example:**

```http
GET /api/users/1/todos?_page=1&_limit=5
```

### Posts

#### Get All Posts

```http
GET /api/posts
```

**Query Parameters:**

- `_page` (optional): Page number (default: 1)
- `_limit` (optional): Items per page (default: 10)
- `userId` (optional): Filter by user ID

**Example:**

```http
GET /api/posts?userId=1&_page=1&_limit=5
```

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "title": "Getting Started with Modern Web Development",
      "body": "This is a comprehensive article about getting started with modern web development...",
      "userId": 1,
      "user": {
        "id": 1,
        "name": "John Doe",
        "username": "johndoe",
        "email": "john.doe@example.com"
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 100,
    "totalPages": 20,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Get Post by ID

```http
GET /api/posts/:id
```

#### Create Post

```http
POST /api/posts
Content-Type: application/json
```

**Request Body:**

```json
{
  "title": "New Post Title",
  "body": "This is the content of the new post...",
  "userId": 1
}
```

#### Update Post

```http
PUT /api/posts/:id
Content-Type: application/json
```

#### Delete Post

```http
DELETE /api/posts/:id
```

### Todos

#### Get All Todos

```http
GET /api/todos
```

**Query Parameters:**

- `_page` (optional): Page number (default: 1)
- `_limit` (optional): Items per page (default: 10)
- `userId` (optional): Filter by user ID
- `completed` (optional): Filter by completion status (true/false)

**Example:**

```http
GET /api/todos?completed=true&userId=1&_page=1&_limit=5
```

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "title": "Review pull requests",
      "completed": true,
      "userId": 1,
      "user": {
        "id": 1,
        "name": "John Doe",
        "username": "johndoe",
        "email": "john.doe@example.com"
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 200,
    "totalPages": 40,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Get Todo by ID

```http
GET /api/todos/:id
```

#### Create Todo

```http
POST /api/todos
Content-Type: application/json
```

**Request Body:**

```json
{
  "title": "New Todo Item",
  "completed": false,
  "userId": 1
}
```

#### Update Todo

```http
PUT /api/todos/:id
Content-Type: application/json
```

#### Delete Todo

```http
DELETE /api/todos/:id
```

## 🔒 Rate Limiting

ApiMocker implements a sophisticated rate limiting system to prevent abuse while allowing legitimate usage:

### Write Operations (POST, PUT, DELETE, PATCH)

- **Limit**: 100 write operations per day per IP address
- **Window**: 24 hours (configurable via `RATE_LIMIT_WINDOW_MS`)
- **Reset**: Daily at midnight UTC

### Read Operations (GET)

- **Limit**: 1000 requests per 15 minutes per IP address
- **Window**: 15 minutes
- **Reset**: Automatically after the time window

### Rate Limit Response

When rate limits are exceeded, the API returns:

```json
{
  "error": "Too Many Requests",
  "message": "Write limit exceeded. Maximum 100 write operations per day per IP.",
  "resetTime": "2024-01-16T00:00:00.000Z"
}
```

**HTTP Status**: `429 Too Many Requests`

### Rate Limit Headers

The API includes rate limit information in response headers:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit resets

## ✅ Input Validation

All endpoints include comprehensive input validation:

### User Validation

- **name**: Required, 1-100 characters
- **username**: Required, 3-50 characters, alphanumeric + underscore only
- **email**: Required, valid email format
- **phone**: Optional, valid phone number
- **website**: Optional, valid URL
- **address**: Optional, must be an object
- **company**: Optional, must be an object

### Post Validation

- **title**: Required, 1-200 characters
- **body**: Required, 1-5000 characters
- **userId**: Required, positive integer

### Todo Validation

- **title**: Required, 1-200 characters
- **completed**: Optional, boolean value
- **userId**: Required, positive integer

### Validation Error Response

```json
{
  "error": "Validation Error",
  "message": "Invalid input data",
  "details": [
    {
      "type": "field",
      "value": "",
      "msg": "Name is required and must be between 1 and 100 characters",
      "path": "name",
      "location": "body"
    }
  ]
}
```

## 🔄 Daily Reset

The database automatically resets at **midnight UTC** every day:

- All existing data is cleared
- Fresh seed data is inserted
- 10 users, 100 posts, and 200 todos are created
- Reset includes realistic data with proper relationships

This ensures a consistent testing environment and prevents data accumulation.

## 📝 Logging

ApiMocker uses Winston for comprehensive logging:

### Log Files

- `logs/error.log`: Error-level logs only
- `logs/combined.log`: All logs

### Logged Information

- **Request Details**: Method, URL, IP, User-Agent, timestamp
- **Response Details**: Status code, duration, content length
- **Error Details**: Stack traces, error messages
- **Database Operations**: Connection status, seeding events

### Log Format

```json
{
  "level": "info",
  "message": "Request completed",
  "method": "GET",
  "url": "/users",
  "statusCode": 200,
  "duration": "45ms",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "apimocker"
}
```

## 🛠 Development Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build TypeScript
npm run start        # Start production server

# Database
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:seed      # Seed database with sample data
npm run db:reset     # Reset and reseed database
npm run db:studio    # Open Prisma Studio

# Testing
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run test:integration # Run only integration tests
npm run test:unit    # Run only unit tests
```

## 📁 Project Structure

```
apimocker/
├── src/
│   ├── controllers/
│   │   └── genericController.ts    # Generic CRUD controller
│   ├── middleware/
│   │   ├── errorHandler.ts         # Error handling middleware
│   │   ├── rateLimiter.ts          # Rate limiting middleware
│   │   ├── requestLogger.ts        # Request logging middleware
│   │   └── validation.ts           # Input validation middleware
│   ├── routes/
│   │   ├── users.ts                # User routes
│   │   ├── posts.ts                # Post routes
│   │   └── todos.ts                # Todo routes
│   ├── scripts/
│   │   ├── seed.ts                 # Database seeding
│   │   └── reset.ts                # Database reset
│   ├── utils/
│   │   ├── logger.ts               # Winston logger configuration
│   │   └── cronJobs.ts             # Daily reset scheduling
│   ├── lib/
│   │   └── prisma.ts               # Prisma client initialization
│   └── index.ts                    # Main application file
├── prisma/
│   └── schema.prisma               # Database schema
├── logs/                           # Log files (auto-generated)
├── .env                            # Environment variables
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Configuration

### Environment Variables

| Variable                | Description                              | Default        |
| ----------------------- | ---------------------------------------- | -------------- |
| `DATABASE_URL`          | PostgreSQL connection string             | Required       |
| `PORT`                  | Server port                              | 8000           |
| `NODE_ENV`              | Environment (development/production)     | development    |
| `RATE_LIMIT_WINDOW_MS`  | Rate limit window in milliseconds        | 86400000 (24h) |
| `RATE_LIMIT_MAX_WRITES` | Maximum write operations per day per IP  | 100            |
| `LOG_LEVEL`             | Logging level (error, warn, info, debug) | info           |

### Database Schema

The application uses three main models:

- **User**: Personal information, contact details, address, company
- **Post**: Blog posts with title, body, and user relationship
- **Todo**: Task items with title, completion status, and user relationship

All models include timestamps and proper foreign key relationships.

## 🚀 Deployment

### Production Deployment

1. **Set environment variables**

   ```bash
   NODE_ENV=production
   DATABASE_URL=your_production_database_url
   ```

2. **Build the application**

   ```bash
   npm run build
   ```

3. **Start the server**
   ```bash
   npm start
   ```

### Docker Deployment (Optional)

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 8000

CMD ["npm", "start"]
```

## 🧪 Testing

ApiMocker includes a comprehensive testing suite with both integration and unit tests.

### Quick Start

1. **Set up test environment**:

   ```bash
   # Create test database
   createdb apimocker_test

   # Set up test environment variables
   cp .env.example .env.test
   # Edit .env.test with test database URL
   ```

2. **Run tests**:

   ```bash
   # Run all tests
   npm test

   # Run with coverage
   npm run test:coverage

   # Run specific test types
   npm run test:integration
   npm run test:unit
   ```

### Test Types

- **Integration Tests**: Full API endpoint testing with real database operations
- **Unit Tests**: Individual component testing with mocked dependencies
- **Manual Testing**: Example scripts for manual API testing

### Test Coverage

The test suite covers:

- ✅ All CRUD operations for Users, Posts, and Todos
- ✅ Pagination and filtering
- ✅ Input validation and error handling
- ✅ Rate limiting enforcement
- ✅ Database relationships
- ✅ Edge cases and boundary conditions

For detailed testing information, see [tests/README.md](tests/README.md).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues, questions, or contributions:

- Create an issue on GitHub
- Check the documentation
- Review the API endpoints

---

**ApiMocker** - Your reliable fake API for development and testing! 🎯
