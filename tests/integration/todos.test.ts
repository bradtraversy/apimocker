import request from 'supertest';
import {
  TestDatabase,
  ApiTester,
  sampleUsers,
  sampleTodos,
  createTestApp,
} from '../utils/testHelpers';

describe('Todos API Integration Tests', () => {
  let app: any;
  let db: TestDatabase;
  let apiTester: ApiTester;
  let testUser: any;

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
    // Create a test user for todos
    testUser = await db.createUser(sampleUsers[0]);
  });

  describe('GET /api/todos', () => {
    it('should return empty array when no todos exist', async () => {
      const response = await apiTester.testGetAll('/api/todos');

      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });

    it('should return all todos with user information', async () => {
      const todo1 = await db.createTodo({
        ...sampleTodos[0],
        userId: testUser.id,
      });
      const todo2 = await db.createTodo({
        ...sampleTodos[1],
        userId: testUser.id,
      });

      const response = await apiTester.testGetAll('/api/todos');

      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
      expect(response.body.data[0]).toMatchObject({
        id: expect.any(Number),
        title: expect.any(String),
        completed: expect.any(Boolean),
        userId: testUser.id,
        user: {
          id: testUser.id,
          name: testUser.name,
          username: testUser.username,
          email: testUser.email,
        },
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should support pagination parameters', async () => {
      // Create multiple todos
      for (let i = 0; i < 5; i++) {
        await db.createTodo({
          title: `Todo ${i}`,
          completed: i % 2 === 0,
          userId: testUser.id,
        });
      }

      const response = await apiTester.testPagination('/api/todos', 1, 3);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(3);
      expect(response.body.pagination.hasNext).toBe(true);
    });

    it('should filter todos by userId', async () => {
      const user2 = await db.createUser(sampleUsers[1]);

      // Create todos for both users
      await db.createTodo({
        title: 'User 1 Todo',
        completed: false,
        userId: testUser.id,
      });
      await db.createTodo({
        title: 'User 2 Todo',
        completed: true,
        userId: user2.id,
      });

      const response = await request(app)
        .get(`/api/todos?userId=${testUser.id}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].userId).toBe(testUser.id);
      expect(response.body.data[0].title).toBe('User 1 Todo');
    });

    it('should filter todos by completion status', async () => {
      // Create completed and incomplete todos
      await db.createTodo({
        title: 'Completed Todo 1',
        completed: true,
        userId: testUser.id,
      });
      await db.createTodo({
        title: 'Completed Todo 2',
        completed: true,
        userId: testUser.id,
      });
      await db.createTodo({
        title: 'Incomplete Todo 1',
        completed: false,
        userId: testUser.id,
      });

      // Test completed filter
      const completedResponse = await request(app)
        .get('/api/todos?completed=true')
        .expect(200);

      expect(completedResponse.body.data).toHaveLength(2);
      expect(
        completedResponse.body.data.every((todo: any) => todo.completed)
      ).toBe(true);

      // Test incomplete filter
      const incompleteResponse = await request(app)
        .get('/api/todos?completed=false')
        .expect(200);

      expect(incompleteResponse.body.data).toHaveLength(1);
      expect(
        incompleteResponse.body.data.every((todo: any) => !todo.completed)
      ).toBe(true);
    });

    it('should combine multiple filters', async () => {
      const user2 = await db.createUser(sampleUsers[1]);

      // Create todos with different combinations
      await db.createTodo({
        title: 'User 1 Completed',
        completed: true,
        userId: testUser.id,
      });
      await db.createTodo({
        title: 'User 1 Incomplete',
        completed: false,
        userId: testUser.id,
      });
      await db.createTodo({
        title: 'User 2 Completed',
        completed: true,
        userId: user2.id,
      });

      const response = await request(app)
        .get(`/api/todos?userId=${testUser.id}&completed=true`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].userId).toBe(testUser.id);
      expect(response.body.data[0].completed).toBe(true);
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/todos?_page=invalid&_limit=invalid')
        .expect(200);

      // Should use default values
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });
  });

  describe('GET /api/todos/:id', () => {
    it('should return a specific todo by ID', async () => {
      const createdTodo = await db.createTodo({
        ...sampleTodos[0],
        userId: testUser.id,
      });

      const response = await apiTester.testGetById(
        '/api/todos',
        createdTodo.id
      );

      expect(response.body).toMatchObject({
        id: createdTodo.id,
        title: sampleTodos[0].title,
        completed: sampleTodos[0].completed,
        userId: testUser.id,
        user: {
          id: testUser.id,
          name: testUser.name,
          username: testUser.username,
          email: testUser.email,
        },
      });
    });

    it('should return 404 for non-existent todo', async () => {
      await apiTester.testGetById('/api/todos', 999, 404);
    });

    it('should handle invalid ID format', async () => {
      await request(app).get('/api/todos/invalid').expect(400);
    });
  });

  describe('POST /api/todos', () => {
    it('should create a new todo with valid data', async () => {
      const newTodo = {
        title: 'New Todo Item',
        completed: false,
        userId: testUser.id,
      };

      const response = await apiTester.testCreate('/api/todos', newTodo);

      expect(response.body).toMatchObject(newTodo);
      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
    });

    it('should create todo with default completed status', async () => {
      const newTodo = {
        title: 'Todo without completed status',
        userId: testUser.id,
      };

      const response = await apiTester.testCreate('/api/todos', newTodo);

      expect(response.body.completed).toBe(false); // Default value
      expect(response.body.title).toBe(newTodo.title);
    });

    it('should return validation error for missing required fields', async () => {
      const invalidTodo = {
        title: '', // Empty title
        userId: testUser.id,
      };

      await apiTester.testValidationError('/api/todos', 'post', invalidTodo);
    });

    it('should return validation error for invalid userId', async () => {
      const invalidTodo = {
        title: 'Valid Title',
        completed: false,
        userId: 999, // Non-existent user
      };

      await apiTester.testValidationError('/api/todos', 'post', invalidTodo);
    });

    it('should return validation error for title too long', async () => {
      const invalidTodo = {
        title: 'A'.repeat(201), // Title longer than 200 characters
        completed: false,
        userId: testUser.id,
      };

      await apiTester.testValidationError('/api/todos', 'post', invalidTodo);
    });

    it('should return validation error for invalid completed type', async () => {
      const invalidTodo = {
        title: 'Valid Title',
        completed: 'not-a-boolean', // Invalid type
        userId: testUser.id,
      };

      await apiTester.testValidationError('/api/todos', 'post', invalidTodo);
    });
  });

  describe('PUT /api/todos/:id', () => {
    it('should update an existing todo', async () => {
      const createdTodo = await db.createTodo({
        ...sampleTodos[0],
        userId: testUser.id,
      });

      const updateData = {
        title: 'Updated Todo Title',
        completed: true,
      };

      const response = await apiTester.testUpdate(
        '/api/todos',
        createdTodo.id,
        updateData
      );

      expect(response.body).toMatchObject(updateData);
      expect(response.body.id).toBe(createdTodo.id);
      expect(response.body.userId).toBe(testUser.id);
    });

    it('should update only specific fields', async () => {
      const createdTodo = await db.createTodo({
        title: 'Original Title',
        completed: false,
        userId: testUser.id,
      });

      const updateData = {
        completed: true, // Only update completion status
      };

      const response = await apiTester.testUpdate(
        '/api/todos',
        createdTodo.id,
        updateData
      );

      expect(response.body.completed).toBe(true);
      expect(response.body.title).toBe('Original Title'); // Should remain unchanged
    });

    it('should return 404 for non-existent todo', async () => {
      const updateData = { title: 'Updated Title' };
      await apiTester.testUpdate('/api/todos', 999, updateData, 404);
    });

    it('should return validation error for invalid update data', async () => {
      const createdTodo = await db.createTodo({
        ...sampleTodos[0],
        userId: testUser.id,
      });

      const invalidData = {
        title: '', // Empty title
      };

      await apiTester.testValidationError(
        `/api/todos/${createdTodo.id}`,
        'put',
        invalidData
      );
    });
  });

  describe('DELETE /api/todos/:id', () => {
    it('should delete an existing todo', async () => {
      const createdTodo = await db.createTodo({
        ...sampleTodos[0],
        userId: testUser.id,
      });

      await apiTester.testDelete('/api/todos', createdTodo.id);

      // Verify todo is deleted
      const deletedTodo = await db.getTodo(createdTodo.id);
      expect(deletedTodo).toBeNull();
    });

    it('should return 404 for non-existent todo', async () => {
      await apiTester.testDelete('/api/todos', 999, 404);
    });
  });

  describe('Filtering and Search', () => {
    it('should filter todos by multiple userIds', async () => {
      const user2 = await db.createUser(sampleUsers[1]);

      // Create todos for both users
      await db.createTodo({
        title: 'User 1 Todo 1',
        completed: false,
        userId: testUser.id,
      });
      await db.createTodo({
        title: 'User 1 Todo 2',
        completed: true,
        userId: testUser.id,
      });
      await db.createTodo({
        title: 'User 2 Todo',
        completed: false,
        userId: user2.id,
      });

      const response = await request(app)
        .get(`/api/todos?userId=${testUser.id}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(
        response.body.data.every((todo: any) => todo.userId === testUser.id)
      ).toBe(true);
    });

    it('should combine filtering with pagination', async () => {
      const user2 = await db.createUser(sampleUsers[1]);

      // Create multiple todos for both users
      for (let i = 0; i < 5; i++) {
        await db.createTodo({
          title: `User 1 Todo ${i}`,
          completed: i % 2 === 0,
          userId: testUser.id,
        });
        await db.createTodo({
          title: `User 2 Todo ${i}`,
          completed: i % 2 === 0,
          userId: user2.id,
        });
      }

      const response = await request(app)
        .get(`/api/todos?userId=${testUser.id}&_page=1&_limit=3`)
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      expect(
        response.body.data.every((todo: any) => todo.userId === testUser.id)
      ).toBe(true);
      expect(response.body.pagination.total).toBe(5);
    });

    it('should handle boolean filter parameters correctly', async () => {
      // Create todos with different completion statuses
      await db.createTodo({
        title: 'Completed Todo',
        completed: true,
        userId: testUser.id,
      });
      await db.createTodo({
        title: 'Incomplete Todo',
        completed: false,
        userId: testUser.id,
      });

      // Test with string 'true'
      const completedResponse = await request(app)
        .get('/api/todos?completed=true')
        .expect(200);

      expect(completedResponse.body.data).toHaveLength(1);
      expect(completedResponse.body.data[0].completed).toBe(true);

      // Test with string 'false'
      const incompleteResponse = await request(app)
        .get('/api/todos?completed=false')
        .expect(200);

      expect(incompleteResponse.body.data).toHaveLength(1);
      expect(incompleteResponse.body.data[0].completed).toBe(false);
    });
  });

  describe('Data Relationships', () => {
    it('should include user information in todo responses', async () => {
      const todo = await db.createTodo({
        title: 'Test Todo',
        completed: false,
        userId: testUser.id,
      });

      const response = await request(app)
        .get(`/api/todos/${todo.id}`)
        .expect(200);

      expect(response.body.user).toMatchObject({
        id: testUser.id,
        name: testUser.name,
        username: testUser.username,
        email: testUser.email,
      });
    });

    it('should maintain referential integrity', async () => {
      const todo = await db.createTodo({
        title: 'Test Todo',
        completed: false,
        userId: testUser.id,
      });

      // Delete the user
      await db.disconnect();
      await db.connect();
      await request(app).delete(`/api/users/${testUser.id}`).expect(200);

      // Todo should still exist but user should be null
      const response = await request(app)
        .get(`/api/todos/${todo.id}`)
        .expect(200);

      expect(response.body.userId).toBe(testUser.id);
      // Note: In a real application, you might want to handle this differently
      // depending on your foreign key constraints
    });
  });

  describe('Business Logic', () => {
    it('should handle todo completion status changes', async () => {
      const todo = await db.createTodo({
        title: 'Test Todo',
        completed: false,
        userId: testUser.id,
      });

      // Mark as completed
      await request(app)
        .put(`/api/todos/${todo.id}`)
        .send({ completed: true })
        .expect(200);

      let response = await request(app)
        .get(`/api/todos/${todo.id}`)
        .expect(200);

      expect(response.body.completed).toBe(true);

      // Mark as incomplete
      await request(app)
        .put(`/api/todos/${todo.id}`)
        .send({ completed: false })
        .expect(200);

      response = await request(app).get(`/api/todos/${todo.id}`).expect(200);

      expect(response.body.completed).toBe(false);
    });

    it('should update timestamp when todo is modified', async () => {
      const todo = await db.createTodo({
        title: 'Test Todo',
        completed: false,
        userId: testUser.id,
      });

      const originalUpdatedAt = todo.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Update the todo
      await request(app)
        .put(`/api/todos/${todo.id}`)
        .send({ completed: true })
        .expect(200);

      const response = await request(app)
        .get(`/api/todos/${todo.id}`)
        .expect(200);

      expect(new Date(response.body.updatedAt).getTime()).toBeGreaterThan(
        new Date(originalUpdatedAt).getTime()
      );
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on write operations', async () => {
      // Create many todos to trigger rate limit
      for (let i = 0; i < 101; i++) {
        const todoData = {
          title: `Todo ${i}`,
          completed: i % 2 === 0,
          userId: testUser.id,
        };

        const expectedStatus = i < 100 ? 201 : 429;
        await request(app)
          .post('/api/todos')
          .send(todoData)
          .expect(expectedStatus);
      }
    });
  });
});
