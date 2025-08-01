import request from 'supertest';
import {
  TestDatabase,
  ApiTester,
  sampleUsers,
  samplePosts,
  createTestApp,
} from '../utils/testHelpers';

describe('Posts API Integration Tests', () => {
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
    // Create a test user for posts
    testUser = await db.createUser(sampleUsers[0]);
  });

  describe('GET /api/posts', () => {
    it('should return empty array when no posts exist', async () => {
      const response = await apiTester.testGetAll('/api/posts');

      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });

    it('should return all posts with user information', async () => {
      const post1 = await db.createPost({
        ...samplePosts[0],
        userId: testUser.id,
      });
      const post2 = await db.createPost({
        ...samplePosts[1],
        userId: testUser.id,
      });

      const response = await apiTester.testGetAll('/api/posts');

      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
      expect(response.body.data[0]).toMatchObject({
        id: expect.any(Number),
        title: expect.any(String),
        body: expect.any(String),
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
      // Create multiple posts
      for (let i = 0; i < 5; i++) {
        await db.createPost({
          title: `Post ${i}`,
          body: `Content ${i}`,
          userId: testUser.id,
        });
      }

      const response = await apiTester.testPagination('/api/posts', 1, 3);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(3);
      expect(response.body.pagination.hasNext).toBe(true);
    });

    it('should filter posts by userId', async () => {
      const user2 = await db.createUser(sampleUsers[1]);

      // Create posts for both users
      await db.createPost({
        title: 'User 1 Post',
        body: 'Content for user 1',
        userId: testUser.id,
      });
      await db.createPost({
        title: 'User 2 Post',
        body: 'Content for user 2',
        userId: user2.id,
      });

      const response = await request(app)
        .get(`/api/posts?userId=${testUser.id}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].userId).toBe(testUser.id);
      expect(response.body.data[0].title).toBe('User 1 Post');
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/posts?_page=invalid&_limit=invalid')
        .expect(200);

      // Should use default values
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });
  });

  describe('GET /api/posts/:id', () => {
    it('should return a specific post by ID', async () => {
      const createdPost = await db.createPost({
        ...samplePosts[0],
        userId: testUser.id,
      });

      const response = await apiTester.testGetById(
        '/api/posts',
        createdPost.id
      );

      expect(response.body).toMatchObject({
        id: createdPost.id,
        title: samplePosts[0].title,
        body: samplePosts[0].body,
        userId: testUser.id,
        user: {
          id: testUser.id,
          name: testUser.name,
          username: testUser.username,
          email: testUser.email,
        },
      });
    });

    it('should return 404 for non-existent post', async () => {
      await apiTester.testGetById('/api/posts', 999, 404);
    });

    it('should handle invalid ID format', async () => {
      await request(app).get('/api/posts/invalid').expect(400);
    });
  });

  describe('POST /api/posts', () => {
    it('should create a new post with valid data', async () => {
      const newPost = {
        title: 'New Post Title',
        body: 'This is the content of the new post with detailed information...',
        userId: testUser.id,
      };

      const response = await apiTester.testCreate('/api/posts', newPost);

      expect(response.body).toMatchObject(newPost);
      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
    });

    it('should return validation error for missing required fields', async () => {
      const invalidPost = {
        title: '', // Empty title
        body: '', // Empty body
      };

      await apiTester.testValidationError('/api/posts', 'post', invalidPost);
    });

    it('should return validation error for invalid userId', async () => {
      const invalidPost = {
        title: 'Valid Title',
        body: 'Valid body content',
        userId: 999, // Non-existent user
      };

      await apiTester.testValidationError('/api/posts', 'post', invalidPost);
    });

    it('should return validation error for title too long', async () => {
      const invalidPost = {
        title: 'A'.repeat(201), // Title longer than 200 characters
        body: 'Valid body content',
        userId: testUser.id,
      };

      await apiTester.testValidationError('/api/posts', 'post', invalidPost);
    });

    it('should return validation error for body too long', async () => {
      const invalidPost = {
        title: 'Valid Title',
        body: 'A'.repeat(5001), // Body longer than 5000 characters
        userId: testUser.id,
      };

      await apiTester.testValidationError('/api/posts', 'post', invalidPost);
    });
  });

  describe('PUT /api/posts/:id', () => {
    it('should update an existing post', async () => {
      const createdPost = await db.createPost({
        ...samplePosts[0],
        userId: testUser.id,
      });

      const updateData = {
        title: 'Updated Post Title',
        body: 'Updated post content...',
      };

      const response = await apiTester.testUpdate(
        '/api/posts',
        createdPost.id,
        updateData
      );

      expect(response.body).toMatchObject(updateData);
      expect(response.body.id).toBe(createdPost.id);
      expect(response.body.userId).toBe(testUser.id);
    });

    it('should return 404 for non-existent post', async () => {
      const updateData = { title: 'Updated Title' };
      await apiTester.testUpdate('/api/posts', 999, updateData, 404);
    });

    it('should return validation error for invalid update data', async () => {
      const createdPost = await db.createPost({
        ...samplePosts[0],
        userId: testUser.id,
      });

      const invalidData = {
        title: '', // Empty title
      };

      await apiTester.testValidationError(
        `/api/posts/${createdPost.id}`,
        'put',
        invalidData
      );
    });
  });

  describe('DELETE /api/posts/:id', () => {
    it('should delete an existing post', async () => {
      const createdPost = await db.createPost({
        ...samplePosts[0],
        userId: testUser.id,
      });

      await apiTester.testDelete('/api/posts', createdPost.id);

      // Verify post is deleted
      const deletedPost = await db.getPost(createdPost.id);
      expect(deletedPost).toBeNull();
    });

    it('should return 404 for non-existent post', async () => {
      await apiTester.testDelete('/api/posts', 999, 404);
    });
  });

  describe('Filtering and Search', () => {
    it('should filter posts by multiple userIds', async () => {
      const user2 = await db.createUser(sampleUsers[1]);

      // Create posts for both users
      await db.createPost({
        title: 'User 1 Post 1',
        body: 'Content 1',
        userId: testUser.id,
      });
      await db.createPost({
        title: 'User 1 Post 2',
        body: 'Content 2',
        userId: testUser.id,
      });
      await db.createPost({
        title: 'User 2 Post',
        body: 'Content 3',
        userId: user2.id,
      });

      const response = await request(app)
        .get(`/api/posts?userId=${testUser.id}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(
        response.body.data.every((post: any) => post.userId === testUser.id)
      ).toBe(true);
    });

    it('should combine filtering with pagination', async () => {
      const user2 = await db.createUser(sampleUsers[1]);

      // Create multiple posts for both users
      for (let i = 0; i < 5; i++) {
        await db.createPost({
          title: `User 1 Post ${i}`,
          body: `Content ${i}`,
          userId: testUser.id,
        });
        await db.createPost({
          title: `User 2 Post ${i}`,
          body: `Content ${i}`,
          userId: user2.id,
        });
      }

      const response = await request(app)
        .get(`/api/posts?userId=${testUser.id}&_page=1&_limit=3`)
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      expect(
        response.body.data.every((post: any) => post.userId === testUser.id)
      ).toBe(true);
      expect(response.body.pagination.total).toBe(5);
    });
  });

  describe('Data Relationships', () => {
    it('should include user information in post responses', async () => {
      const post = await db.createPost({
        title: 'Test Post',
        body: 'Test content',
        userId: testUser.id,
      });

      const response = await request(app)
        .get(`/api/posts/${post.id}`)
        .expect(200);

      expect(response.body.user).toMatchObject({
        id: testUser.id,
        name: testUser.name,
        username: testUser.username,
        email: testUser.email,
      });
    });

    it('should maintain referential integrity', async () => {
      const post = await db.createPost({
        title: 'Test Post',
        body: 'Test content',
        userId: testUser.id,
      });

      // Delete the user
      await db.disconnect();
      await db.connect();
      await request(app).delete(`/api/users/${testUser.id}`).expect(200);

      // Post should still exist but user should be null
      const response = await request(app)
        .get(`/api/posts/${post.id}`)
        .expect(200);

      expect(response.body.userId).toBe(testUser.id);
      // Note: In a real application, you might want to handle this differently
      // depending on your foreign key constraints
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on write operations', async () => {
      // Create many posts to trigger rate limit
      for (let i = 0; i < 101; i++) {
        const postData = {
          title: `Post ${i}`,
          body: `Content ${i}`,
          userId: testUser.id,
        };

        const expectedStatus = i < 100 ? 201 : 429;
        await request(app)
          .post('/api/posts')
          .send(postData)
          .expect(expectedStatus);
      }
    });
  });
});
