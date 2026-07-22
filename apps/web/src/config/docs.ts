import { API_BASE_URL } from './site';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface DocField {
  name: string;
  type: string;
  required: string;
  description: string;
}

export interface DocEndpoint {
  id: string;
  method: HttpMethod;
  path: string;
  summary: string;
  description: string;
  parameters?: DocField[];
  request?: string;
  response?: string;
  responseLabel?: string;
  status?: string;
  notes?: string[];
}

export interface ResourceDoc {
  slug: string;
  name: string;
  description: string;
  seedCount: number;
  fields: DocField[];
  example: string;
  endpoints: DocEndpoint[];
}

export const docsNavigation = [
  {
    label: 'Start here',
    items: [{ label: 'Overview', href: '/docs' }],
  },
  {
    label: 'Resources',
    items: [
      { label: 'Users', href: '/docs/users' },
      { label: 'Posts', href: '/docs/posts' },
      { label: 'Todos', href: '/docs/todos' },
      { label: 'Comments', href: '/docs/comments' },
    ],
  },
  {
    label: 'Guides',
    items: [
      { label: 'Querying data', href: '/docs/querying' },
      { label: 'Errors and testing', href: '/docs/testing' },
    ],
  },
  {
    label: 'Reference',
    items: [{ label: 'OpenAPI JSON', href: '/openapi.json', external: true }],
  },
] as const;

const json = (value: unknown) => JSON.stringify(value, null, 2);

const timestamps: DocField[] = [
  {
    name: 'createdAt',
    type: 'ISO 8601 string',
    required: 'Read only',
    description: 'Time the record was created.',
  },
  {
    name: 'updatedAt',
    type: 'ISO 8601 string',
    required: 'Read only',
    description: 'Time the record was last updated.',
  },
];

const idField: DocField = {
  name: 'id',
  type: 'integer',
  required: 'Read only',
  description: 'Auto-incrementing resource identifier.',
};

const idParameter: DocField = {
  name: 'id',
  type: 'integer',
  required: 'Required',
  description: 'The resource ID from the URL path.',
};

const searchParameter: DocField = {
  name: 'q',
  type: 'string',
  required: 'Required',
  description: 'Case-insensitive search text.',
};

const delayParameter: DocField = {
  name: '_delay',
  type: 'integer',
  required: 'Optional',
  description: 'Artificial response delay in milliseconds.',
};

const listParameters: DocField[] = [
  {
    name: '_page or page',
    type: 'integer',
    required: 'Optional',
    description: 'Page number. Defaults to 1.',
  },
  {
    name: '_limit or limit',
    type: 'integer',
    required: 'Optional',
    description: 'Items per page. Defaults to 10 and is capped at 100.',
  },
  {
    name: '_sort',
    type: 'string',
    required: 'Optional',
    description: 'Field used for sorting. Defaults to id.',
  },
  {
    name: '_order',
    type: 'asc | desc',
    required: 'Optional',
    description: 'Sort direction. Defaults to asc.',
  },
  delayParameter,
];

const paginationExample = {
  page: 1,
  limit: 10,
  total: 10,
  totalPages: 1,
  hasNext: false,
  hasPrev: false,
};

const userExample = {
  id: 1,
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
  createdAt: '2026-07-22T00:00:03.599Z',
  updatedAt: '2026-07-22T00:00:03.599Z',
};

const userSummary = {
  id: 1,
  name: 'John Doe',
  username: 'johndoe',
  email: 'john.doe@example.com',
};

const postExample = {
  id: 1,
  title: 'Getting Started with Modern Web Development: A Practical First Project',
  body: 'This is a comprehensive article about getting started with modern web development.',
  userId: 1,
  createdAt: '2026-07-22T00:00:03.599Z',
  updatedAt: '2026-07-22T00:00:03.599Z',
  user: userSummary,
};

const todoExample = {
  id: 1,
  title: 'Review the component architecture',
  description: 'Check the loading and empty states before the next release.',
  completed: false,
  userId: 1,
  createdAt: '2026-07-22T00:00:03.599Z',
  updatedAt: '2026-07-22T00:00:03.599Z',
  user: userSummary,
};

const commentExample = {
  id: 1,
  name: 'A useful response',
  email: 'reader@example.com',
  body: 'This explanation made the implementation much clearer.',
  postId: 1,
  createdAt: '2026-07-22T00:00:03.599Z',
  updatedAt: '2026-07-22T00:00:03.599Z',
  post: {
    id: 1,
    title: postExample.title,
  },
};

const mutationNotes = [
  'Writes affect the shared dataset until the next daily reset.',
  'Unknown fields are rejected by the database layer.',
];

export const resourceDocs: Record<string, ResourceDoc> = {
  users: {
    slug: 'users',
    name: 'Users',
    description:
      'People with contact, address, and company data. Users own posts and todos.',
    seedCount: 10,
    fields: [
      idField,
      { name: 'name', type: 'string', required: 'Required', description: 'Display name, 1 to 100 characters.' },
      { name: 'username', type: 'string', required: 'Required', description: 'Unique username, 3 to 50 letters, numbers, or underscores.' },
      { name: 'email', type: 'email string', required: 'Required', description: 'Unique valid email address.' },
      { name: 'phone', type: 'string', required: 'Optional', description: 'Valid phone number.' },
      { name: 'website', type: 'URL string', required: 'Optional', description: 'Valid website URL.' },
      { name: 'address', type: 'object', required: 'Optional', description: 'Nested street, city, zipcode, and geo data.' },
      { name: 'company', type: 'object', required: 'Optional', description: 'Nested company name, catch phrase, and business text.' },
      ...timestamps,
    ],
    example: json(userExample),
    endpoints: [
      {
        id: 'list-users',
        method: 'GET',
        path: '/users',
        summary: 'List users',
        description: 'Returns a paginated user collection.',
        parameters: [
          ...listParameters,
          { name: 'name_like', type: 'string', required: 'Optional', description: 'Partial, case-insensitive name match.' },
          { name: 'username', type: 'string', required: 'Optional', description: 'Exact username match.' },
          { name: 'email', type: 'string', required: 'Optional', description: 'Exact email match.' },
        ],
        response: json({ data: [userExample], pagination: paginationExample }),
      },
      {
        id: 'search-users',
        method: 'GET',
        path: '/users/search?q=john',
        summary: 'Search users',
        description: 'Searches name, username, and email and returns up to 10 matches.',
        parameters: [searchParameter, delayParameter],
        response: json({ query: 'john', total: 1, results: [userSummary] }),
      },
      {
        id: 'get-user',
        method: 'GET',
        path: '/users/:id',
        summary: 'Get one user',
        description: 'Returns a user directly, without the list response envelope.',
        parameters: [idParameter, delayParameter],
        response: json(userExample),
      },
      {
        id: 'user-posts',
        method: 'GET',
        path: '/users/:id/posts',
        summary: 'List a user\'s posts',
        description: 'Returns the posts owned by a user in the standard paginated envelope.',
        parameters: [idParameter, ...listParameters.slice(0, 2)],
        response: json({ data: [postExample], pagination: { ...paginationExample, total: 10 } }),
      },
      {
        id: 'user-todos',
        method: 'GET',
        path: '/users/:id/todos',
        summary: 'List a user\'s todos',
        description: 'Returns the todos owned by a user in the standard paginated envelope.',
        parameters: [idParameter, ...listParameters.slice(0, 2)],
        response: json({ data: [todoExample], pagination: { ...paginationExample, total: 20, totalPages: 2, hasNext: true } }),
      },
      {
        id: 'create-user',
        method: 'POST',
        path: '/users',
        summary: 'Create a user',
        description: 'Creates a shared user and returns the new resource with status 201.',
        request: json({ name: 'Jane Smith', username: 'janesmith', email: 'jane@example.com' }),
        response: json({ ...userExample, id: 11, name: 'Jane Smith', username: 'janesmith', email: 'jane@example.com' }),
        status: '201 Created',
        notes: mutationNotes,
      },
      {
        id: 'replace-user',
        method: 'PUT',
        path: '/users/:id',
        summary: 'Replace a user',
        description: 'Updates a user. Name, username, and email are required.',
        parameters: [idParameter],
        request: json({ name: 'Jane Smith', username: 'janesmith', email: 'jane@example.com' }),
        status: '200 OK',
        notes: mutationNotes,
      },
      {
        id: 'patch-user',
        method: 'PATCH',
        path: '/users/:id',
        summary: 'Update selected user fields',
        description: 'Updates only the provided fields.',
        parameters: [idParameter],
        request: json({ website: 'https://jane.dev' }),
        status: '200 OK',
        notes: mutationNotes,
      },
      {
        id: 'delete-user',
        method: 'DELETE',
        path: '/users/:id',
        summary: 'Delete a user',
        description: 'Deletes the user and cascades to that user\'s posts, todos, comments, and likes.',
        parameters: [idParameter],
        status: '204 No Content',
        notes: mutationNotes,
      },
    ],
  },
  posts: {
    slug: 'posts',
    name: 'Posts',
    description: 'Articles connected to users, comments, and lightweight likes.',
    seedCount: 100,
    fields: [
      idField,
      { name: 'title', type: 'string', required: 'Required', description: 'Post title, 1 to 200 characters.' },
      { name: 'body', type: 'string', required: 'Required', description: 'Post content, 1 to 5,000 characters.' },
      { name: 'userId', type: 'integer', required: 'Optional', description: 'Owning user ID. Defaults to 1 when omitted on create.' },
      { name: 'user', type: 'object', required: 'Read only', description: 'Nested summary of the current owning user.' },
      ...timestamps,
    ],
    example: json(postExample),
    endpoints: [
      {
        id: 'list-posts',
        method: 'GET',
        path: '/posts',
        summary: 'List posts',
        description: 'Returns paginated posts with a nested user summary.',
        parameters: [
          ...listParameters,
          { name: 'userId', type: 'integer', required: 'Optional', description: 'Filter by owner.' },
          { name: 'title_like', type: 'string', required: 'Optional', description: 'Partial, case-insensitive title match.' },
          { name: 'body_like', type: 'string', required: 'Optional', description: 'Partial, case-insensitive body match.' },
        ],
        response: json({ data: [postExample], pagination: { ...paginationExample, total: 100, totalPages: 10, hasNext: true } }),
      },
      {
        id: 'search-posts',
        method: 'GET',
        path: '/posts/search?q=development',
        summary: 'Search posts',
        description: 'Searches title and body with pagination and sorting.',
        parameters: [searchParameter, ...listParameters],
        response: json({ query: 'development', total: 20, totalPages: 2, page: 1, limit: 10, hasNext: true, hasPrev: false, results: [postExample] }),
      },
      {
        id: 'get-post',
        method: 'GET',
        path: '/posts/:id',
        summary: 'Get one post',
        description: 'Returns a post directly with its nested user summary.',
        parameters: [idParameter, delayParameter],
        response: json(postExample),
      },
      {
        id: 'get-post-likes',
        method: 'GET',
        path: '/posts/:id/likes',
        summary: 'Get a post\'s like count',
        description: 'Returns the current number of likes for a post.',
        parameters: [idParameter],
        response: json({ postId: 1, likes: 4 }),
      },
      {
        id: 'add-post-like',
        method: 'POST',
        path: '/posts/:id/likes',
        summary: 'Add a like',
        description: 'Adds an anonymous like or records an optional user ID.',
        parameters: [idParameter],
        request: json({ userId: 2 }),
        response: json({ message: 'Like added successfully', like: { id: 5, postId: 1, userId: 2, createdAt: '2026-07-22T12:00:00.000Z' }, totalLikes: 5 }),
        status: '201 Created',
        notes: mutationNotes,
      },
      {
        id: 'create-post',
        method: 'POST',
        path: '/posts',
        summary: 'Create a post',
        description: 'Creates a post. userId defaults to 1 when omitted.',
        request: json({ title: 'A frontend testing workflow', body: 'Build the UI against predictable JSON.', userId: 1 }),
        status: '201 Created',
        notes: mutationNotes,
      },
      {
        id: 'replace-post',
        method: 'PUT',
        path: '/posts/:id',
        summary: 'Replace a post',
        description: 'Updates a post. Title and body are required.',
        parameters: [idParameter],
        request: json({ title: 'Updated title', body: 'Updated post body.', userId: 1 }),
        status: '200 OK',
        notes: mutationNotes,
      },
      {
        id: 'patch-post',
        method: 'PATCH',
        path: '/posts/:id',
        summary: 'Update selected post fields',
        description: 'Updates only the provided fields.',
        parameters: [idParameter],
        request: json({ title: 'A more specific title' }),
        status: '200 OK',
        notes: mutationNotes,
      },
      {
        id: 'delete-post',
        method: 'DELETE',
        path: '/posts/:id',
        summary: 'Delete a post',
        description: 'Deletes the post and cascades to its comments and likes.',
        parameters: [idParameter],
        status: '204 No Content',
        notes: mutationNotes,
      },
    ],
  },
  todos: {
    slug: 'todos',
    name: 'Todos',
    description: 'Task-like records connected to users with a completion state.',
    seedCount: 200,
    fields: [
      idField,
      { name: 'title', type: 'string', required: 'Required', description: 'Todo title, 1 to 200 characters.' },
      { name: 'description', type: 'string | null', required: 'Optional', description: 'Additional detail, 1 to 1,000 characters when provided.' },
      { name: 'completed', type: 'boolean', required: 'Optional', description: 'Completion state. Defaults to false.' },
      { name: 'userId', type: 'integer', required: 'Optional', description: 'Owning user ID. Defaults to 1 when omitted on create.' },
      { name: 'user', type: 'object', required: 'Read only', description: 'Nested summary of the current owning user.' },
      ...timestamps,
    ],
    example: json(todoExample),
    endpoints: [
      {
        id: 'list-todos',
        method: 'GET',
        path: '/todos',
        summary: 'List todos',
        description: 'Returns paginated todos with a nested user summary.',
        parameters: [
          ...listParameters,
          { name: 'userId', type: 'integer', required: 'Optional', description: 'Filter by owner.' },
          { name: 'completed', type: 'boolean', required: 'Optional', description: 'Filter by completion state.' },
          { name: 'title_like', type: 'string', required: 'Optional', description: 'Partial, case-insensitive title match.' },
        ],
        response: json({ data: [todoExample], pagination: { ...paginationExample, total: 200, totalPages: 20, hasNext: true } }),
      },
      {
        id: 'search-todos',
        method: 'GET',
        path: '/todos/search?q=review',
        summary: 'Search todos',
        description: 'Searches title and description and returns up to 10 matches.',
        parameters: [searchParameter, delayParameter],
        response: json({ query: 'review', total: 1, results: [todoExample] }),
      },
      {
        id: 'get-todo',
        method: 'GET',
        path: '/todos/:id',
        summary: 'Get one todo',
        description: 'Returns a todo directly with its nested user summary.',
        parameters: [idParameter, delayParameter],
        response: json(todoExample),
      },
      {
        id: 'create-todo',
        method: 'POST',
        path: '/todos',
        summary: 'Create a todo',
        description: 'Creates a todo. completed defaults to false and userId defaults to 1.',
        request: json({ title: 'Test the empty state', description: 'Verify the UI before launch.', completed: false, userId: 1 }),
        status: '201 Created',
        notes: mutationNotes,
      },
      {
        id: 'replace-todo',
        method: 'PUT',
        path: '/todos/:id',
        summary: 'Replace a todo',
        description: 'Updates a todo. Title is required.',
        parameters: [idParameter],
        request: json({ title: 'Test the completed state', completed: true, userId: 1 }),
        status: '200 OK',
        notes: mutationNotes,
      },
      {
        id: 'patch-todo',
        method: 'PATCH',
        path: '/todos/:id',
        summary: 'Update selected todo fields',
        description: 'Updates only the provided fields.',
        parameters: [idParameter],
        request: json({ completed: true }),
        status: '200 OK',
        notes: mutationNotes,
      },
      {
        id: 'delete-todo',
        method: 'DELETE',
        path: '/todos/:id',
        summary: 'Delete a todo',
        description: 'Deletes the todo permanently until the next reset.',
        parameters: [idParameter],
        status: '204 No Content',
        notes: mutationNotes,
      },
    ],
  },
  comments: {
    slug: 'comments',
    name: 'Comments',
    description: 'Post comments with author details and a nested post summary.',
    seedCount: 500,
    fields: [
      idField,
      { name: 'name', type: 'string', required: 'Required', description: 'Comment subject or author label, 1 to 100 characters.' },
      { name: 'email', type: 'email string', required: 'Required', description: 'Valid author email address.' },
      { name: 'body', type: 'string', required: 'Required', description: 'Comment text, 1 to 1,000 characters.' },
      { name: 'postId', type: 'integer', required: 'Required', description: 'Parent post ID.' },
      { name: 'post', type: 'object', required: 'Read only', description: 'Nested parent post ID and title.' },
      ...timestamps,
    ],
    example: json(commentExample),
    endpoints: [
      {
        id: 'list-comments',
        method: 'GET',
        path: '/comments',
        summary: 'List comments',
        description: 'Returns paginated comments with a nested post summary.',
        parameters: [
          ...listParameters,
          { name: 'body_like', type: 'string', required: 'Optional', description: 'Partial, case-insensitive body match.' },
          { name: 'email', type: 'string', required: 'Optional', description: 'Exact email match.' },
        ],
        response: json({ data: [commentExample], pagination: { ...paginationExample, total: 500, totalPages: 50, hasNext: true } }),
      },
      {
        id: 'search-comments',
        method: 'GET',
        path: '/comments/search?q=clearer',
        summary: 'Search comments',
        description: 'Searches name, email, and body and returns up to 10 matches.',
        parameters: [searchParameter, delayParameter],
        response: json({ query: 'clearer', total: 1, results: [commentExample] }),
      },
      {
        id: 'get-comment',
        method: 'GET',
        path: '/comments/:id',
        summary: 'Get one comment',
        description: 'Returns a comment directly with its nested post summary.',
        parameters: [idParameter, delayParameter],
        response: json(commentExample),
      },
      {
        id: 'create-comment',
        method: 'POST',
        path: '/comments',
        summary: 'Create a comment',
        description: 'Creates a comment for an existing post.',
        request: json({ name: 'Helpful article', email: 'reader@example.com', body: 'This was useful.', postId: 1 }),
        status: '201 Created',
        notes: mutationNotes,
      },
      {
        id: 'replace-comment',
        method: 'PUT',
        path: '/comments/:id',
        summary: 'Replace a comment',
        description: 'Updates a comment. Name, email, body, and postId are required.',
        parameters: [idParameter],
        request: json({ name: 'Updated comment', email: 'reader@example.com', body: 'The updated response.', postId: 1 }),
        status: '200 OK',
        notes: mutationNotes,
      },
      {
        id: 'patch-comment',
        method: 'PATCH',
        path: '/comments/:id',
        summary: 'Update selected comment fields',
        description: 'Updates only the provided fields.',
        parameters: [idParameter],
        request: json({ body: 'A corrected response.' }),
        status: '200 OK',
        notes: mutationNotes,
      },
      {
        id: 'delete-comment',
        method: 'DELETE',
        path: '/comments/:id',
        summary: 'Delete a comment',
        description: 'Deletes the comment permanently until the next reset.',
        parameters: [idParameter],
        status: '204 No Content',
        notes: mutationNotes,
      },
    ],
  },
};

export const resourceList = Object.values(resourceDocs);

export const docsApiBaseUrl = API_BASE_URL;
