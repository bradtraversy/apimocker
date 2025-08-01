import request from 'supertest';
import {
  TestDatabase,
  ApiTester,
  sampleUsers,
  createTestApp,
} from '../utils/testHelpers';

describe('Users API Integration Tests', () => {
  let app: any;
  let db: TestDatabase;
  let apiTester: ApiTester;

  beforeAll(async () => {
    app = await createTestApp();
    db = new TestDatabase();
    await db.connect();
    apiTester = new ApiTester(app);
  });

  afterAll(async () => {
    await db.disconnect();
  });

  beforeEach(async () => {
    await db.cleanup();
  });

  describe('GET /api/users', () => {
    it('should return empty array when no users exist', async () => {
      const response = await apiTester.testGetAll('/api/users');

      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });

    it('should return all users with pagination', async () => {
      // Create test users
      const user1 = await db.createUser(sampleUsers[0]);
      const user2 = await db.createUser(sampleUsers[1]);

      const response = await apiTester.testGetAll('/api/users');

      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
      expect(response.body.data[0]).toMatchObject({
        id: expect.any(Number),
        name: expect.any(String),
        username: expect.any(String),
        email: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should support pagination parameters', async () => {
      // Create multiple users
      for (let i = 0; i < 5; i++) {
        await db.createUser({
          ...sampleUsers[0],
          username: `user${i}`,
          email: `user${i}@example.com`,
        });
      }

      const response = await apiTester.testPagination('/api/users', 1, 3);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(3);
      expect(response.body.pagination.hasNext).toBe(true);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/users?_page=invalid&_limit=invalid')
        .expect(200);

      // Should use default values
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return a specific user by ID', async () => {
      const createdUser = await db.createUser(sampleUsers[0]);

      const response = await apiTester.testGetById(
        '/api/users',
        createdUser.id
      );

      expect(response.body).toMatchObject({
        id: createdUser.id,
        name: sampleUsers[0].name,
        username: sampleUsers[0].username,
        email: sampleUsers[0].email,
      });
    });

    it('should return 404 for non-existent user', async () => {
      await apiTester.testGetById('/api/users', 999, 404);
    });

    it('should handle invalid ID format', async () => {
      await request(app).get('/api/users/invalid').expect(400);
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user with valid data', async () => {
      const newUser = {
        name: 'New User',
        username: 'newuser',
        email: 'newuser@example.com',
        phone: '+1-555-0125',
        website: 'https://newuser.com',
        address: {
          street: '789 Pine St',
          suite: 'Apt 2A',
          city: 'Chicago',
          zipcode: '60601',
          geo: { lat: '41.8781', lng: '-87.6298' },
        },
        company: {
          name: 'New Company',
          catchPhrase: 'Building the future',
          bs: 'innovate cutting-edge solutions',
        },
      };

      const response = await apiTester.testCreate('/api/users', newUser);

      expect(response.body).toMatchObject(newUser);
      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
    });

    it('should return validation error for missing required fields', async () => {
      const invalidUser = {
        name: '', // Empty name
        email: 'invalid-email', // Invalid email
      };

      await apiTester.testValidationError('/api/users', 'post', invalidUser);
    });

    it('should return validation error for invalid email format', async () => {
      const invalidUser = {
        ...sampleUsers[0],
        email: 'not-an-email',
      };

      await apiTester.testValidationError('/api/users', 'post', invalidUser);
    });

    it('should return validation error for invalid username format', async () => {
      const invalidUser = {
        ...sampleUsers[0],
        username: 'user@name', // Contains invalid character
      };

      await apiTester.testValidationError('/api/users', 'post', invalidUser);
    });

    it('should return validation error for invalid phone format', async () => {
      const invalidUser = {
        ...sampleUsers[0],
        phone: 'not-a-phone',
      };

      await apiTester.testValidationError('/api/users', 'post', invalidUser);
    });

    it('should return validation error for invalid website format', async () => {
      const invalidUser = {
        ...sampleUsers[0],
        website: 'not-a-url',
      };

      await apiTester.testValidationError('/api/users', 'post', invalidUser);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update an existing user', async () => {
      const createdUser = await db.createUser(sampleUsers[0]);
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com',
      };

      const response = await apiTester.testUpdate(
        '/api/users',
        createdUser.id,
        updateData
      );

      expect(response.body).toMatchObject(updateData);
      expect(response.body.id).toBe(createdUser.id);
    });

    it('should return 404 for non-existent user', async () => {
      const updateData = { name: 'Updated Name' };
      await apiTester.testUpdate('/api/users', 999, updateData, 404);
    });

    it('should return validation error for invalid update data', async () => {
      const createdUser = await db.createUser(sampleUsers[0]);
      const invalidData = {
        email: 'invalid-email',
      };

      await apiTester.testValidationError(
        `/api/users/${createdUser.id}`,
        'put',
        invalidData
      );
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete an existing user', async () => {
      const createdUser = await db.createUser(sampleUsers[0]);

      await apiTester.testDelete('/api/users', createdUser.id);

      // Verify user is deleted
      const deletedUser = await db.getUser(createdUser.id);
      expect(deletedUser).toBeNull();
    });

    it('should return 404 for non-existent user', async () => {
      await apiTester.testDelete('/api/users', 999, 404);
    });
  });

  describe('GET /api/users/:id/posts', () => {
    it('should return user posts', async () => {
      const user = await db.createUser(sampleUsers[0]);
      const post1 = await db.createPost({
        title: 'User Post 1',
        body: 'Content 1',
        userId: user.id,
      });
      const post2 = await db.createPost({
        title: 'User Post 2',
        body: 'Content 2',
        userId: user.id,
      });

      const response = await request(app)
        .get(`/api/users/${user.id}/posts`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toMatchObject({
        id: expect.any(Number),
        title: expect.any(String),
        body: expect.any(String),
        userId: user.id,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
        },
      });
    });

    it('should return empty array when user has no posts', async () => {
      const user = await db.createUser(sampleUsers[0]);

      const response = await request(app)
        .get(`/api/users/${user.id}/posts`)
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });

    it('should support pagination for user posts', async () => {
      const user = await db.createUser(sampleUsers[0]);

      // Create multiple posts
      for (let i = 0; i < 5; i++) {
        await db.createPost({
          title: `Post ${i}`,
          body: `Content ${i}`,
          userId: user.id,
        });
      }

      const response = await request(app)
        .get(`/api/users/${user.id}/posts?_page=1&_limit=3`)
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(3);
    });
  });

  describe('GET /api/users/:id/todos', () => {
    it('should return user todos', async () => {
      const user = await db.createUser(sampleUsers[0]);
      const todo1 = await db.createTodo({
        title: 'User Todo 1',
        completed: true,
        userId: user.id,
      });
      const todo2 = await db.createTodo({
        title: 'User Todo 2',
        completed: false,
        userId: user.id,
      });

      const response = await request(app)
        .get(`/api/users/${user.id}/todos`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toMatchObject({
        id: expect.any(Number),
        title: expect.any(String),
        completed: expect.any(Boolean),
        userId: user.id,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
        },
      });
    });

    it('should return empty array when user has no todos', async () => {
      const user = await db.createUser(sampleUsers[0]);

      const response = await request(app)
        .get(`/api/users/${user.id}/todos`)
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });

    it('should support pagination for user todos', async () => {
      const user = await db.createUser(sampleUsers[0]);

      // Create multiple todos
      for (let i = 0; i < 5; i++) {
        await db.createTodo({
          title: `Todo ${i}`,
          completed: i % 2 === 0,
          userId: user.id,
        });
      }

      const response = await request(app)
        .get(`/api/users/${user.id}/todos?_page=1&_limit=3`)
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(3);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on write operations', async () => {
      // Create many users to trigger rate limit
      for (let i = 0; i < 101; i++) {
        const userData = {
          ...sampleUsers[0],
          username: `user${i}`,
          email: `user${i}@example.com`,
        };

        const expectedStatus = i < 100 ? 201 : 429;
        await request(app)
          .post('/api/users')
          .send(userData)
          .expect(expectedStatus);
      }
    });
  });
});
