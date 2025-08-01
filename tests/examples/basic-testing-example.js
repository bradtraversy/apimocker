/**
 * Basic Testing Example
 *
 * This file demonstrates how to test the API routes using simple HTTP requests.
 * This is useful for manual testing or as a reference for understanding the API.
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api';
const TEST_USER = {
  name: 'Test User',
  username: 'testuser',
  email: 'test@example.com',
  phone: '+1-555-0123',
  website: 'https://testuser.com',
  address: {
    street: '123 Test St',
    suite: 'Apt 1A',
    city: 'Test City',
    zipcode: '12345',
    geo: { lat: '40.7128', lng: '-74.0060' },
  },
  company: {
    name: 'Test Company',
    catchPhrase: 'Testing the future',
    bs: 'test scalable solutions',
  },
};

const TEST_POST = {
  title: 'Test Post',
  body: 'This is a test post for API testing.',
  userId: 1,
};

const TEST_TODO = {
  title: 'Test Todo',
  completed: false,
  userId: 1,
};

// Test functions
async function testUsersAPI() {
  console.log('🧪 Testing Users API...\n');

  try {
    // 1. Get all users
    console.log('1. Getting all users...');
    const usersResponse = await axios.get(`${BASE_URL}/users`);
    console.log(`✅ Found ${usersResponse.data.data.length} users`);
    console.log(
      `   Pagination: Page ${usersResponse.data.pagination.page} of ${usersResponse.data.pagination.totalPages}\n`
    );

    // 2. Create a new user
    console.log('2. Creating a new user...');
    const createUserResponse = await axios.post(`${BASE_URL}/users`, TEST_USER);
    const newUserId = createUserResponse.data.id;
    console.log(`✅ Created user with ID: ${newUserId}\n`);

    // 3. Get user by ID
    console.log('3. Getting user by ID...');
    const getUserResponse = await axios.get(`${BASE_URL}/users/${newUserId}`);
    console.log(`✅ Retrieved user: ${getUserResponse.data.name}\n`);

    // 4. Update user
    console.log('4. Updating user...');
    const updateData = { name: 'Updated Test User' };
    const updateUserResponse = await axios.put(
      `${BASE_URL}/users/${newUserId}`,
      updateData
    );
    console.log(`✅ Updated user: ${updateUserResponse.data.name}\n`);

    // 5. Get user posts
    console.log('5. Getting user posts...');
    const userPostsResponse = await axios.get(
      `${BASE_URL}/users/${newUserId}/posts`
    );
    console.log(
      `✅ Found ${userPostsResponse.data.data.length} posts for user\n`
    );

    // 6. Get user todos
    console.log('6. Getting user todos...');
    const userTodosResponse = await axios.get(
      `${BASE_URL}/users/${newUserId}/todos`
    );
    console.log(
      `✅ Found ${userTodosResponse.data.data.length} todos for user\n`
    );

    // 7. Delete user
    console.log('7. Deleting user...');
    await axios.delete(`${BASE_URL}/users/${newUserId}`);
    console.log('✅ User deleted successfully\n');

    return newUserId;
  } catch (error) {
    console.error(
      '❌ Error testing Users API:',
      error.response?.data || error.message
    );
    throw error;
  }
}

async function testPostsAPI(userId) {
  console.log('🧪 Testing Posts API...\n');

  try {
    // 1. Get all posts
    console.log('1. Getting all posts...');
    const postsResponse = await axios.get(`${BASE_URL}/posts`);
    console.log(`✅ Found ${postsResponse.data.data.length} posts\n`);

    // 2. Create a new post
    console.log('2. Creating a new post...');
    const postData = { ...TEST_POST, userId };
    const createPostResponse = await axios.post(`${BASE_URL}/posts`, postData);
    const newPostId = createPostResponse.data.id;
    console.log(`✅ Created post with ID: ${newPostId}\n`);

    // 3. Get post by ID
    console.log('3. Getting post by ID...');
    const getPostResponse = await axios.get(`${BASE_URL}/posts/${newPostId}`);
    console.log(`✅ Retrieved post: ${getPostResponse.data.title}\n`);

    // 4. Update post
    console.log('4. Updating post...');
    const updateData = { title: 'Updated Test Post' };
    const updatePostResponse = await axios.put(
      `${BASE_URL}/posts/${newPostId}`,
      updateData
    );
    console.log(`✅ Updated post: ${updatePostResponse.data.title}\n`);

    // 5. Filter posts by userId
    console.log('5. Filtering posts by userId...');
    const filteredPostsResponse = await axios.get(
      `${BASE_URL}/posts?userId=${userId}`
    );
    console.log(
      `✅ Found ${filteredPostsResponse.data.data.length} posts for user ${userId}\n`
    );

    // 6. Delete post
    console.log('6. Deleting post...');
    await axios.delete(`${BASE_URL}/posts/${newPostId}`);
    console.log('✅ Post deleted successfully\n');

    return newPostId;
  } catch (error) {
    console.error(
      '❌ Error testing Posts API:',
      error.response?.data || error.message
    );
    throw error;
  }
}

async function testTodosAPI(userId) {
  console.log('🧪 Testing Todos API...\n');

  try {
    // 1. Get all todos
    console.log('1. Getting all todos...');
    const todosResponse = await axios.get(`${BASE_URL}/todos`);
    console.log(`✅ Found ${todosResponse.data.data.length} todos\n`);

    // 2. Create a new todo
    console.log('2. Creating a new todo...');
    const todoData = { ...TEST_TODO, userId };
    const createTodoResponse = await axios.post(`${BASE_URL}/todos`, todoData);
    const newTodoId = createTodoResponse.data.id;
    console.log(`✅ Created todo with ID: ${newTodoId}\n`);

    // 3. Get todo by ID
    console.log('3. Getting todo by ID...');
    const getTodoResponse = await axios.get(`${BASE_URL}/todos/${newTodoId}`);
    console.log(`✅ Retrieved todo: ${getTodoResponse.data.title}\n`);

    // 4. Update todo
    console.log('4. Updating todo...');
    const updateData = { completed: true };
    const updateTodoResponse = await axios.put(
      `${BASE_URL}/todos/${newTodoId}`,
      updateData
    );
    console.log(
      `✅ Updated todo: completed = ${updateTodoResponse.data.completed}\n`
    );

    // 5. Filter todos by completed status
    console.log('5. Filtering completed todos...');
    const completedTodosResponse = await axios.get(
      `${BASE_URL}/todos?completed=true`
    );
    console.log(
      `✅ Found ${completedTodosResponse.data.data.length} completed todos\n`
    );

    // 6. Filter todos by userId
    console.log('6. Filtering todos by userId...');
    const userTodosResponse = await axios.get(
      `${BASE_URL}/todos?userId=${userId}`
    );
    console.log(
      `✅ Found ${userTodosResponse.data.data.length} todos for user ${userId}\n`
    );

    // 7. Delete todo
    console.log('7. Deleting todo...');
    await axios.delete(`${BASE_URL}/todos/${newTodoId}`);
    console.log('✅ Todo deleted successfully\n');

    return newTodoId;
  } catch (error) {
    console.error(
      '❌ Error testing Todos API:',
      error.response?.data || error.message
    );
    throw error;
  }
}

async function testPagination() {
  console.log('🧪 Testing Pagination...\n');

  try {
    // Test pagination for users
    console.log('1. Testing pagination for users...');
    const paginatedResponse = await axios.get(
      `${BASE_URL}/users?_page=1&_limit=5`
    );
    const pagination = paginatedResponse.data.pagination;

    console.log(`✅ Page ${pagination.page} of ${pagination.totalPages}`);
    console.log(`   Items: ${pagination.limit} per page`);
    console.log(`   Total: ${pagination.total} items`);
    console.log(`   Has next: ${pagination.hasNext}`);
    console.log(`   Has prev: ${pagination.hasPrev}\n`);

    // Test pagination for posts
    console.log('2. Testing pagination for posts...');
    const postsPaginatedResponse = await axios.get(
      `${BASE_URL}/posts?_page=1&_limit=3`
    );
    const postsPagination = postsPaginatedResponse.data.pagination;

    console.log(
      `✅ Page ${postsPagination.page} of ${postsPagination.totalPages}`
    );
    console.log(`   Items: ${postsPagination.limit} per page`);
    console.log(`   Total: ${postsPagination.total} items\n`);
  } catch (error) {
    console.error(
      '❌ Error testing pagination:',
      error.response?.data || error.message
    );
    throw error;
  }
}

async function testErrorHandling() {
  console.log('🧪 Testing Error Handling...\n');

  try {
    // 1. Test invalid user ID
    console.log('1. Testing invalid user ID...');
    try {
      await axios.get(`${BASE_URL}/users/invalid`);
    } catch (error) {
      console.log(
        `✅ Correctly rejected invalid ID: ${error.response.status} - ${error.response.data.error}\n`
      );
    }

    // 2. Test non-existent user
    console.log('2. Testing non-existent user...');
    try {
      await axios.get(`${BASE_URL}/users/99999`);
    } catch (error) {
      console.log(
        `✅ Correctly handled non-existent user: ${error.response.status} - ${error.response.data.error}\n`
      );
    }

    // 3. Test validation error
    console.log('3. Testing validation error...');
    try {
      await axios.post(`${BASE_URL}/users`, {
        name: '',
        email: 'invalid-email',
      });
    } catch (error) {
      console.log(
        `✅ Correctly handled validation error: ${error.response.status} - ${error.response.data.error}\n`
      );
    }
  } catch (error) {
    console.error(
      '❌ Error testing error handling:',
      error.response?.data || error.message
    );
    throw error;
  }
}

async function testRateLimiting() {
  console.log('🧪 Testing Rate Limiting...\n');

  try {
    console.log('1. Testing write rate limits...');
    let successCount = 0;
    let rateLimitedCount = 0;

    // Try to create many users to trigger rate limit
    for (let i = 0; i < 15; i++) {
      try {
        const userData = {
          ...TEST_USER,
          username: `testuser${i}`,
          email: `test${i}@example.com`,
        };
        await axios.post(`${BASE_URL}/users`, userData);
        successCount++;
      } catch (error) {
        if (error.response?.status === 429) {
          rateLimitedCount++;
          console.log(
            `✅ Rate limit hit after ${successCount} successful requests`
          );
          break;
        }
      }
    }

    console.log(
      `✅ Successfully created ${successCount} users before rate limit\n`
    );
  } catch (error) {
    console.error(
      '❌ Error testing rate limiting:',
      error.response?.data || error.message
    );
    throw error;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting API Tests...\n');

  try {
    // Test basic functionality
    const userId = await testUsersAPI();
    await testPostsAPI(userId);
    await testTodosAPI(userId);

    // Test advanced features
    await testPagination();
    await testErrorHandling();
    await testRateLimiting();

    console.log('🎉 All tests completed successfully!');
  } catch (error) {
    console.error('💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testUsersAPI,
  testPostsAPI,
  testTodosAPI,
  testPagination,
  testErrorHandling,
  testRateLimiting,
  runAllTests,
};
