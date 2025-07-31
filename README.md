# ApiMocker

A fake REST API service for developers to test against, built with Node.js, Express, TypeScript, and PostgreSQL.

## Features

- **RESTful API** with full CRUD operations
- **Three core resources**: Users, Posts, and Todos
- **Realistic data** with proper relationships
- **Rate limiting**: 100 writes/day per IP, unlimited reads
- **Daily reset** at midnight UTC with fresh data
- **Modular architecture** for easy extension
- **Comprehensive validation** and error handling
- **Production-ready** with logging and monitoring

## Tech Stack

- **Backend**: Node.js with Express
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Language**: TypeScript
- **Validation**: express-validator
- **Rate Limiting**: express-rate-limit
- **Logging**: Winston
- **Scheduling**: node-cron

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon recommended)

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
   DATABASE_URL="your-postgresql-connection-string"
   PORT=3000
   NODE_ENV=development
   RATE_LIMIT_WINDOW_MS=86400000
   RATE_LIMIT_MAX_WRITES=100
   LOG_LEVEL=info
   ```

4. **Set up the database**

   ```bash
   # Generate Prisma client
   npm run db:generate

   # Push schema to database
   npm run db:push

   # Seed with initial data
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

## API Endpoints

### Users

| Method | Endpoint           | Description      |
| ------ | ------------------ | ---------------- |
| GET    | `/users`           | Get all users    |
| GET    | `/users/:id`       | Get single user  |
| GET    | `/users/:id/posts` | Get user's posts |
| GET    | `/users/:id/todos` | Get user's todos |
| POST   | `/users`           | Create user      |
| PUT    | `/users/:id`       | Update user      |
| DELETE | `/users/:id`       | Delete user      |

### Posts

| Method | Endpoint     | Description     |
| ------ | ------------ | --------------- |
| GET    | `/posts`     | Get all posts   |
| GET    | `/posts/:id` | Get single post |
| POST   | `/posts`     | Create post     |
| PUT    | `/posts/:id` | Update post     |
| DELETE | `/posts/:id` | Delete post     |

### Todos

| Method | Endpoint     | Description     |
| ------ | ------------ | --------------- |
| GET    | `/todos`     | Get all todos   |
| GET    | `/todos/:id` | Get single todo |
| POST   | `/todos`     | Create todo     |
| PUT    | `/todos/:id` | Update todo     |
| DELETE | `/todos/:id` | Delete todo     |

## Query Parameters

All GET endpoints support the following query parameters:

- `_page`: Page number for pagination (default: 1)
- `_limit`: Number of items per page (default: 10)
- `userId`: Filter by user ID
- `completed`: Filter todos by completion status (true/false)

### Examples

```bash
# Get first 5 users
GET /users?_limit=5

# Get posts from page 2
GET /posts?_page=2&_limit=20

# Get todos for user 1
GET /todos?userId=1

# Get completed todos
GET /todos?completed=true
```

## Data Models

### User

```typescript
{
  id: number
  name: string
  username: string
  email: string
  phone?: string
  website?: string
  address?: {
    street: string
    suite: string
    city: string
    zipcode: string
    geo: { lat: string, lng: string }
  }
  company?: {
    name: string
    catchPhrase: string
    bs: string
  }
  createdAt: Date
  updatedAt: Date
}
```

### Post

```typescript
{
  id: number
  title: string
  body: string
  userId: number
  user?: User
  createdAt: Date
  updatedAt: Date
}
```

### Todo

```typescript
{
  id: number
  title: string
  completed: boolean
  userId: number
  user?: User
  createdAt: Date
  updatedAt: Date
}
```

## Rate Limiting

- **Read operations**: Unlimited
- **Write operations**: 100 per day per IP address
- **General requests**: 1000 per 15 minutes per IP

## Daily Reset

The database automatically resets at midnight UTC every day, providing fresh data for testing.

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:seed      # Seed database with data
npm run db:reset     # Reset and reseed database
npm run db:studio    # Open Prisma Studio
```

### Project Structure

```
src/
├── controllers/     # Generic CRUD controller
├── middleware/      # Express middleware
├── routes/          # API route definitions
├── scripts/         # Database seeding scripts
├── utils/           # Utility functions
└── index.ts         # Main server file
```

## Extending the API

To add new resources (e.g., Comments, Albums):

1. **Add to Prisma schema** (`prisma/schema.prisma`)
2. **Create route file** (`src/routes/comments.ts`)
3. **Add validation** (`src/middleware/validation.ts`)
4. **Register routes** (`src/index.ts`)
5. **Update seed script** (`src/scripts/seed.ts`)

The generic controller pattern makes it easy to add new resources with minimal code.

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error Type",
  "message": "Human-readable message",
  "details": [] // Validation errors (if applicable)
}
```

## Health Check

```bash
GET /health
```

Returns server status and uptime information.

## License

MIT
