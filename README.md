# ApiMocker 🚀

ApiMocker is a free hosted mock REST API for frontend developers, students,
instructors, and tutorial authors. It provides realistic relational data,
working CRUD, filtering, sorting, pagination, search, delay and error
simulation, and a predictable daily reset. No signup or API key is required.

- **Website:** https://apimocker.com
- **Documentation:** https://apimocker.com/docs
- **API Base URL:** https://api.apimocker.com

You can also explore the API with [ApiProbe](https://apiprobe.dev).

[![ApiMocker homepage](./apps/web/public/readme-screenshot.jpg)](https://apimocker.com)

## ⚡ Quick Usage (Hosted)

- **Hosted Base URL**: https://api.apimocker.com
- All responses are JSON and support pagination, filtering, and sorting.

### Core Endpoints

- Users
  - GET `https://api.apimocker.com/users`
  - GET `https://api.apimocker.com/users/1`
  - GET `https://api.apimocker.com/users/1/posts`
  - GET `https://api.apimocker.com/users/1/todos`
  - GET `https://api.apimocker.com/users/search?q=john`
- Posts
  - GET `https://api.apimocker.com/posts`
  - GET `https://api.apimocker.com/posts/1`
  - GET `https://api.apimocker.com/posts?userId=1&_page=1&_limit=10`
  - GET `https://api.apimocker.com/posts/search?q=development&_sort=id&_order=desc&_page=1&_limit=5`
  - GET `https://api.apimocker.com/posts/1/likes`
  - POST `https://api.apimocker.com/posts/1/likes`
- Todos
  - GET `https://api.apimocker.com/todos`
  - GET `https://api.apimocker.com/todos/1`
  - GET `https://api.apimocker.com/todos?completed=true&_page=1&_limit=10`
  - GET `https://api.apimocker.com/todos/search?q=review`
- Comments
  - GET `https://api.apimocker.com/comments`
  - GET `https://api.apimocker.com/comments/1`
  - GET `https://api.apimocker.com/comments?email=reader@example.com&_page=1&_limit=5`
  - GET `https://api.apimocker.com/comments/search?q=great`

### Useful Query Params

- Pagination: `_page`, `_limit`
- Sorting: `_sort`, `_order` (e.g., `_sort=title&_order=asc`)
- Text search: `field_like` (e.g., `title_like=web`)
- Response delay (simulate latency): `_delay=2000`

### Health Check

- GET `https://api.apimocker.com/health`

## ✨ Features

- **Full CRUD Operations** - Create, Read, Update, Delete for all resources
- **PATCH Method Support** - Partial updates for users, posts, todos, and comments
- **Advanced Filtering** - `_like`, `_sort`, `_order` parameters with `X-Total-Count` headers
- **Per-Resource Search** - Dedicated `/search` endpoints on users, posts, todos, and comments
- **Response Delay Simulation** - `_delay` parameter for testing loading states
- **Error Simulation** - Dedicated endpoints for testing error handling
- **Realistic Data** - 10 users, 100 posts, 200 todos, 500 comments with realistic content
- **Rate Limiting** - Configurable limits to prevent abuse
- **Input Validation** - Comprehensive validation for all endpoints
- **Pagination** - Built-in pagination support with `_page` and `_limit`
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

- Node.js 22.12.x
- pnpm 11.9.0
- Neon PostgreSQL database

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd apimocker
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   Copy the example file and fill in your values:

   ```bash
   cp apps/api/.env.example apps/api/.env
   ```

   Then edit `apps/api/.env` to set your `DATABASE_URL`. The full set of supported variables:

   ```env
   # Database
   DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
   # DIRECT_URL="postgresql://username:password@host/database?sslmode=require"

   # Server
   PORT=8000
   NODE_ENV=development
   ENABLE_ISOLATED_ENVIRONMENTS=false
   RESET_SCHEDULER=in_process

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=86400000 # 24 hours
   RATE_LIMIT_MAX_WRITES=100 # 100 writes per day per IP

   # Logging
   LOG_LEVEL=info
   ```

   Prisma 7 reads its CLI connection URL from `prisma.config.ts`. It uses
   `DATABASE_URL` by default. Set `DIRECT_URL` only when schema commands need a
   separate direct database connection.

4. **Generate Prisma client**

   ```bash
   pnpm run db:generate
   ```

5. **Push database schema**

   ```bash
   pnpm run db:push
   ```

6. **Seed the database**

   ```bash
   pnpm run db:seed
   ```

7. **Start the server**
   ```bash
   pnpm run dev:api
   ```

The API will be available at `http://localhost:8000`

## 📊 API Endpoints

### Base URL

```
http://localhost:8000
```

The API root (`http://localhost:8000/`) returns a small status payload. The Astro
frontend is developed separately with `pnpm run dev:web`.

### Response Format

- **List endpoints** (e.g. `GET /posts`, `GET /users/:id/posts`) wrap the array
  so pagination metadata can ride along:

  ```json
  { "data": [ ... ], "pagination": { "page": 1, "total": 100, ... } }
  ```

- **Single-resource endpoints** (e.g. `GET /posts/1`, `POST /posts`,
  `PUT /posts/1`) return the bare resource object with no wrapper:

  ```json
  { "id": 1, "title": "...", "body": "...", "user": { ... } }
  ```

- `DELETE` returns `204 No Content` with an empty body.

## 🔍 Advanced Features

### Per-Resource Search
Each main resource exposes its own `/search` endpoint that searches the relevant
text fields (case-insensitive):

```http
GET /users/search?q=john
GET /posts/search?q=development
GET /todos/search?q=review
GET /comments/search?q=great
```

**Parameters:**
- `q` (required): Search query
- `_delay` (optional): Response delay in milliseconds
- Posts search additionally supports `_sort`, `_order`, `_page`, and `_limit`.

### Response Delay Simulation
Test loading states by adding delays to any request:

```http
GET /posts?_delay=2000
```

### Error Simulation
Test error handling with dedicated error endpoints:

```http
GET /error/404
GET /error/500
GET /error/validation
GET /error/timeout
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
GET /users
```

**Query Parameters:**

- `_page` (optional): Page number (default: 1)
- `_limit` (optional): Items per page (default: 10, max: 100)

**Example:**

```http
GET /users?_page=1&_limit=5
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
GET /users/:id
```

**Example:**

```http
GET /users/1
```

#### Create User

```http
POST /users
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
PUT /users/:id
Content-Type: application/json
```

**Example:**

```http
PUT /users/1
{
  "name": "Updated Name",
  "username": "updateduser",
  "email": "updated@example.com"
}
```

Use `PATCH /users/1` when sending only the fields that should change.

#### Delete User

```http
DELETE /users/:id
```

**Example:**

```http
DELETE /users/1
```

#### Get User's Posts

```http
GET /users/:id/posts
```

**Query Parameters:**

- `_page` (optional): Page number (default: 1)
- `_limit` (optional): Items per page (default: 10)

**Example:**

```http
GET /users/1/posts?_page=1&_limit=5
```

#### Get User's Todos

```http
GET /users/:id/todos
```

**Query Parameters:**

- `_page` (optional): Page number (default: 1)
- `_limit` (optional): Items per page (default: 10)

**Example:**

```http
GET /users/1/todos?_page=1&_limit=5
```

### Posts

#### Get All Posts

```http
GET /posts
```

**Query Parameters:**

- `_page` (optional): Page number (default: 1)
- `_limit` (optional): Items per page (default: 10)
- `userId` (optional): Filter by user ID

**Example:**

```http
GET /posts?userId=1&_page=1&_limit=5
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
GET /posts/:id
```

#### Create Post

```http
POST /posts
Content-Type: application/json
```

**Request Body:**

```json
{
  "title": "New Post Title",
  "body": "This is the content of the new post..."
}
```

**Note:** `userId` is optional and defaults to user ID 1 if not provided.

#### Update Post

```http
PUT /posts/:id
Content-Type: application/json
```

#### Delete Post

```http
DELETE /posts/:id
```

#### Get Post Likes

```http
GET /posts/:id/likes
```

**Example:**

```http
GET /posts/1/likes
```

**Response:**

```json
{
  "postId": 1,
  "likes": 42
}
```

#### Add Like to Post

```http
POST /posts/:id/likes
Content-Type: application/json
```

**Request Body (optional):**

```json
{
  "userId": 1
}
```

**Note:** `userId` is optional. Omit it for anonymous likes.

**Response:**

```json
{
  "message": "Like added successfully",
  "like": {
    "id": 123,
    "postId": 1,
    "userId": 1,
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "totalLikes": 43
}
```

### Todos

#### Get All Todos

```http
GET /todos
```

**Query Parameters:**

- `_page` (optional): Page number (default: 1)
- `_limit` (optional): Items per page (default: 10)
- `userId` (optional): Filter by user ID
- `completed` (optional): Filter by completion status (true/false)

**Example:**

```http
GET /todos?completed=true&userId=1&_page=1&_limit=5
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
GET /todos/:id
```

#### Create Todo

```http
POST /todos
Content-Type: application/json
```

**Request Body:**

```json
{
  "title": "New Todo Item",
  "description": "Optional description for the todo item",
  "completed": false
}
```

**Note:** `userId` and `description` are optional. `userId` defaults to user ID 1 if not provided.

#### Update Todo

```http
PUT /todos/:id
Content-Type: application/json
```

#### Delete Todo

```http
DELETE /todos/:id
```

### Comments

#### Get All Comments

```http
GET /comments
```

**Query Parameters:**

- `_page` (optional): Page number (default: 1)
- `_limit` (optional): Items per page (default: 10)
- `email` (optional): Filter by exact email address
- `name_like` (optional): Search by commenter name
- `email_like` (optional): Search by email

**Example:**

```http
GET /comments?email=reader@example.com&_page=1&_limit=5
```

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "body": "Great article! This really helped me understand the concepts better.",
      "postId": 1,
      "post": {
        "id": 1,
        "title": "Getting Started with Modern Web Development"
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 500,
    "totalPages": 100,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Get Comment by ID

```http
GET /comments/:id
```

#### Create Comment

```http
POST /comments
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "Commenter Name",
  "email": "commenter@example.com",
  "body": "This is a comment on the post",
  "postId": 1
}
```

#### Update Comment

```http
PUT /comments/:id
Content-Type: application/json
```

#### Delete Comment

```http
DELETE /comments/:id
```

## 🔍 Advanced Filtering & Querying

ApiMocker supports powerful filtering, sorting, and querying capabilities:

### Pagination
- `_page` or `page`: Page number (default: 1)
- `_limit` or `limit`: Items per page (default: 10, max: 100)

### Sorting
- `_sort`: Field to sort by (e.g., `title`, `id`, `createdAt`)
- `_order`: Sort order (`asc` or `desc`)

### Text Search
- `field_like`: Partial text matching (case-insensitive)
  - `title_like=web` - Search posts with "web" in title
  - `name_like=john` - Search users with "john" in name
  - `body_like=development` - Search posts with "development" in body

### Response Headers
- `X-Total-Count`: Total number of items (for pagination)

### Examples

**Basic pagination:**
```http
GET /posts?_page=2&_limit=5
```

**Sorting:**
```http
GET /posts?_sort=title&_order=asc
```

**Text search:**
```http
GET /posts?title_like=development
```

**Combined filtering:**
```http
GET /todos?completed=true&userId=1&_sort=title&_order=desc&_page=1&_limit=10
```

**With delay simulation:**
```http
GET /posts?title_like=web&_delay=2000
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
- **userId**: Optional, positive integer (defaults to user ID 1 if not provided)

### Todo Validation

- **title**: Required, 1-200 characters
- **description**: Optional, 1-1000 characters
- **completed**: Optional, boolean value
- **userId**: Optional, positive integer (defaults to user ID 1 if not provided)

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
- 10 users, 100 posts, 200 todos, and 500 comments are created
- Reset includes realistic data with proper relationships

This ensures a consistent testing environment and prevents data accumulation.

Set `RESET_SCHEDULER=in_process` to run the midnight reset inside the API
process. Use `external` when a platform cron service runs `pnpm run db:reset`,
or `disabled` when no scheduled reset should run.

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
pnpm run dev         # Start both development servers
pnpm run dev:api     # Start the API development server
pnpm run dev:web     # Start the Astro development server
pnpm run build       # Build both workspace apps
pnpm run build:api   # Build the API
pnpm run build:web   # Build the Astro app
pnpm run typecheck   # Type-check both workspace apps
pnpm run start       # Start the built API
pnpm run start:api   # Start the built API
pnpm run start:web   # Start the built Astro Node server

# Database
pnpm run db:generate # Generate Prisma client
pnpm run db:migrate  # Apply tracked database migrations
pnpm run db:push     # Push schema to database
pnpm run db:seed     # Seed database with sample data
pnpm run db:reset    # Reset and reseed database
pnpm run db:studio   # Open Prisma Studio

# Testing
pnpm test                 # Run all API tests
pnpm run test:watch       # Run API tests in watch mode
pnpm run test:coverage    # Run API tests with coverage
pnpm run test:integration # Run only integration tests
pnpm run test:unit        # Run only unit tests
pnpm run test:environment # Run isolated environment tests
```

## 📁 Project Structure

```
apimocker/
├── apps/
│   ├── api/
│   │   ├── prisma/                 # Database schema and migrations
│   │   ├── public/                 # Preserved legacy homepage source
│   │   ├── src/                    # Express API source
│   │   ├── tests/                  # API test suites and guide
│   │   ├── .env.example            # API environment template
│   │   ├── package.json
│   │   └── prisma.config.ts
│   └── web/
│       ├── public/                 # Astro static assets
│       ├── src/                    # Astro pages and components
│       ├── astro.config.mjs
│       └── package.json
├── package.json                    # Workspace scripts
├── pnpm-workspace.yaml
└── README.md
```

## 🔧 Configuration

### Environment Variables

| Variable                | Description                              | Default        |
| ----------------------- | ---------------------------------------- | -------------- |
| `DATABASE_URL`          | PostgreSQL connection string             | Required       |
| `TEST_DATABASE_URL`     | Dedicated database used only by the default Jest suite | Required for database tests |
| `DIRECT_URL`            | Optional direct URL for Prisma CLI commands | DATABASE_URL |
| `PORT`                  | Server port                              | 8000           |
| `NODE_ENV`              | Environment (development/production)     | development    |
| `ENABLE_ISOLATED_ENVIRONMENTS` | Development flag for unfinished isolated environment routes | false |
| `RESET_SCHEDULER`       | Reset mode: in_process, external, or disabled | in_process |
| `RATE_LIMIT_WINDOW_MS`  | Rate limit window in milliseconds        | 86400000 (24h) |
| `RATE_LIMIT_MAX_WRITES` | Maximum write operations per day per IP  | 100            |
| `LOG_LEVEL`             | Logging level (error, warn, info, debug) | info           |

### Database Schema

The shared API uses five models:

- **User**: Personal information, contact details, address, company
- **Post**: Blog posts with title, body, and user relationship
- **Todo**: Task items with title, completion status, and user relationship
- **Comment**: Comments on posts with name, email, and body
- **Like**: Likes on posts (optional userId for anonymous likes)

All models include timestamps and proper foreign key relationships, with cascade
deletes from parents to children.

The in-development isolated environment work adds `ApiEnvironment` for
credentials and quotas, plus `EnvironmentCollection` for private JSON resource
snapshots. This product is not publicly available. These models are not touched
by the shared API's daily reset.

## 🚀 Deployment

Production runs as separate API and web services on Railway from this pnpm
workspace. The API builds with `pnpm run build:api` and starts with
`pnpm run start:api`. The Astro app builds with `pnpm run build:web` and starts
with `pnpm run start:web` using the Node adapter in standalone mode.

## 🧪 Testing

ApiMocker includes a comprehensive testing suite with both integration and unit tests.

### Quick Start

1. **Set up test environment**:

   ```bash
   # Create test database
   createdb apimocker_test

   # Set up test environment variables
   cp apps/api/.env.example apps/api/.env.test
   # Edit TEST_DATABASE_URL in apps/api/.env.test to use a dedicated test database
   ```

2. **Run tests**:

   ```bash
   # Run all tests
   pnpm test

   # Run with coverage
   pnpm run test:coverage

   # Run specific test types
   pnpm run test:integration
   pnpm run test:unit
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

For detailed testing information, see
[apps/api/tests/README.md](apps/api/tests/README.md).

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

---

## Isolated Environments (In Development)

> **Not available yet:** Isolated environments are still in development. There
> is no public beta, signup, billing, or customer provisioning at this time.
> The routes and tooling in this section document unfinished development work
> and are not part of the currently available ApiMocker service.

The shared `/users`, `/posts`, `/todos`, and `/comments` API remains free and
resets every day. The planned isolated environments will keep a private copy of
those five collections, including likes, behind an API key. Data written to one
environment will not affect the shared API or another environment.

Environment routes use this base path:

```http
/v1/environments/:slug
```

Send the API key with every environment request. This key is a browser-visible
metering token for non-sensitive mock data, so it is not an authorization
boundary for confidential information:

```http
X-API-Key: am_env_your_key
```

The four main resources support CRUD plus the common filtering, sorting,
pagination, search, relationship, and post-like flows used by the shared API.

The current development contract includes these planned differences:

- Every isolated request requires an API key and limits request bodies to 64 KB.
- Authenticated requests to provisioned development environments consume
  persistent monthly and burst quota after payload parsing.
- Usage and reset are environment-only routes. Reset also requires the
  management key.
- Isolated environments do not expose `/health` or `/error` routes.
- Isolated routes do not support `_delay` response simulation.
- Isolated writes discard unknown input fields, while shared Prisma-backed
  writes reject fields outside the resource schema.
- Isolated domain errors can use a different response envelope from shared
  Prisma errors.

The planned environment-only routes, currently implemented behind a disabled
development flag, are:

```http
GET /v1/environments/:slug/usage
POST /v1/environments/:slug/reset
```

Reset also requires a server-side management key:

```http
X-Management-Key: am_mgmt_your_key
```

Usage is enforced with persistent monthly and per-minute counters in PostgreSQL.
Each resource also has a record cap. The reset route restores the private data
snapshot captured when the environment was created. The global midnight reset
does not modify provisioned development environments. Keep the management key
on the server and never include it in browser code.

Billing, customer self-service, and public provisioning are not available.
Internal development tooling can provision and revoke test environments from
the server:

```bash
pnpm run env:create -- --slug acme-course --name "Acme Course" --plan classroom
pnpm run env:revoke -- --slug acme-course
```

The `developer` plan defaults to 25,000 monthly requests, 120 requests per
minute, and 1,000 records per resource. The `classroom` plan defaults to
100,000 monthly requests, 240 requests per minute, and 2,000 records per
resource. Provisioning arguments can override those limits during development
testing.

The create command copies all current global tables in ID order inside one
repeatable-read transaction. It displays the API and management keys once and
stores only their SHA-256 hashes.

Existing deployments that were created with `prisma db push` must mark the
tracked baseline as already applied before deploying the environment tables:

```bash
pnpm --filter @apimocker/api exec prisma migrate resolve --applied 20260720112500_baseline_existing_schema
pnpm run db:migrate
```

Run these commands with `DIRECT_URL` pointing to the target database. A fresh
database only needs `pnpm run db:migrate`. Keep
`ENABLE_ISOLATED_ENVIRONMENTS=false` during the migration. Do not enable it in
production until the environment product is ready for release.

The routes stay unavailable while `ENABLE_ISOLATED_ENVIRONMENTS` is `false`.
That flag should remain false for the current public service. Keep any keys
created during development in a password manager or secrets service.
