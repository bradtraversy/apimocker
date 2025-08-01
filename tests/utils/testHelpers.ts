import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { Express } from 'express';

export type TestUser = {
  name: string;
  username: string;
  email: string;
  phone?: string;
  website?: string;
  address?: {
    street: string;
    suite: string;
    city: string;
    zipcode: string;
    geo: { lat: string; lng: string };
  };
  company?: {
    name: string;
    catchPhrase: string;
    bs: string;
  };
};

export type TestPost = {
  title: string;
  body: string;
  userId: number;
};

export type TestTodo = {
  title: string;
  completed: boolean;
  userId: number;
};

export class TestDatabase {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url:
            process.env.DATABASE_URL ||
            'postgresql://test:test@localhost:5432/apimocker_test',
        },
      },
    });
  }

  async connect() {
    await this.prisma.$connect();
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }

  async cleanup() {
    await this.prisma.user.deleteMany();
    await this.prisma.post.deleteMany();
    await this.prisma.todo.deleteMany();
  }

  async createUser(userData: TestUser) {
    return await this.prisma.user.create({
      data: userData,
    });
  }

  async createPost(postData: TestPost) {
    return await this.prisma.post.create({
      data: postData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
          },
        },
      },
    });
  }

  async createTodo(todoData: TestTodo) {
    return await this.prisma.todo.create({
      data: todoData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
          },
        },
      },
    });
  }

  async getUser(id: number) {
    return await this.prisma.user.findUnique({
      where: { id },
    });
  }

  async getPost(id: number) {
    return await this.prisma.post.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
          },
        },
      },
    });
  }

  async getTodo(id: number) {
    return await this.prisma.todo.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
          },
        },
      },
    });
  }
}

export class ApiTester {
  private app: Express;

  constructor(app: Express) {
    this.app = app;
  }

  // Generic API test methods
  async testGetAll(endpoint: string, expectedStatus = 200) {
    const response = await request(this.app)
      .get(endpoint)
      .expect(expectedStatus);

    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('pagination');
    expect(Array.isArray(response.body.data)).toBe(true);

    return response;
  }

  async testGetById(endpoint: string, id: number, expectedStatus = 200) {
    const response = await request(this.app)
      .get(`${endpoint}/${id}`)
      .expect(expectedStatus);

    if (expectedStatus === 200) {
      expect(response.body).toHaveProperty('id', id);
    }

    return response;
  }

  async testCreate(endpoint: string, data: any, expectedStatus = 201) {
    const response = await request(this.app)
      .post(endpoint)
      .send(data)
      .expect(expectedStatus);

    if (expectedStatus === 201) {
      expect(response.body).toHaveProperty('id');
      expect(response.body).toMatchObject(data);
    }

    return response;
  }

  async testUpdate(
    endpoint: string,
    id: number,
    data: any,
    expectedStatus = 200
  ) {
    const response = await request(this.app)
      .put(`${endpoint}/${id}`)
      .send(data)
      .expect(expectedStatus);

    if (expectedStatus === 200) {
      expect(response.body).toHaveProperty('id', id);
      expect(response.body).toMatchObject(data);
    }

    return response;
  }

  async testDelete(endpoint: string, id: number, expectedStatus = 200) {
    const response = await request(this.app)
      .delete(`${endpoint}/${id}`)
      .expect(expectedStatus);

    return response;
  }

  async testPagination(endpoint: string, page = 1, limit = 5) {
    const response = await request(this.app)
      .get(`${endpoint}?_page=${page}&_limit=${limit}`)
      .expect(200);

    expect(response.body.pagination).toMatchObject({
      page,
      limit,
      hasNext: expect.any(Boolean),
      hasPrev: expect.any(Boolean),
      total: expect.any(Number),
      totalPages: expect.any(Number),
    });

    expect(response.body.data.length).toBeLessThanOrEqual(limit);

    return response;
  }

  async testValidationError(
    endpoint: string,
    method: 'post' | 'put',
    data: any
  ) {
    const response = await request(this.app)
      [method](endpoint)
      .send(data)
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Validation Error');
    expect(response.body).toHaveProperty('details');
    expect(Array.isArray(response.body.details)).toBe(true);

    return response;
  }
}

// Sample data generators
export const sampleUsers: TestUser[] = [
  {
    name: 'John Doe',
    username: 'johndoe',
    email: 'john.doe@example.com',
    phone: '+1-555-0123',
    website: 'https://johndoe.dev',
    address: {
      street: '123 Main St',
      suite: 'Apt 4B',
      city: 'New York',
      zipcode: '10001',
      geo: { lat: '40.7128', lng: '-74.0060' },
    },
    company: {
      name: 'Tech Solutions Inc',
      catchPhrase: 'Innovating the future',
      bs: 'harness real-time e-markets',
    },
  },
  {
    name: 'Jane Smith',
    username: 'janesmith',
    email: 'jane.smith@example.com',
    phone: '+1-555-0124',
    website: 'https://janesmith.com',
    address: {
      street: '456 Oak Ave',
      suite: 'Suite 7C',
      city: 'Los Angeles',
      zipcode: '90210',
      geo: { lat: '34.0522', lng: '-118.2437' },
    },
    company: {
      name: 'Creative Agency',
      catchPhrase: 'Designing tomorrow',
      bs: 'synergize scalable supply-chains',
    },
  },
];

export const samplePosts: TestPost[] = [
  {
    title: 'Getting Started with Modern Web Development',
    body: 'This is a comprehensive guide to modern web development practices...',
    userId: 1,
  },
  {
    title: 'The Future of JavaScript',
    body: 'JavaScript continues to evolve with new features and capabilities...',
    userId: 1,
  },
];

export const sampleTodos: TestTodo[] = [
  {
    title: 'Review pull requests',
    completed: true,
    userId: 1,
  },
  {
    title: 'Write documentation',
    completed: false,
    userId: 1,
  },
];

// Helper function to create a test app instance
export const createTestApp = async () => {
  // Import the app dynamically to avoid circular dependencies
  const { default: app } = await import('../src/index');
  return app;
};
