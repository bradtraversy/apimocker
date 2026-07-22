import { API_BASE_URL } from './site';

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const jsonResponse = (description: string, schema?: Record<string, unknown>) => ({
  description,
  ...(schema
    ? {
        content: {
          'application/json': { schema },
        },
      }
    : {}),
});

const idParameter = {
  name: 'id',
  in: 'path',
  required: true,
  description: 'Numeric resource ID.',
  schema: { type: 'integer', minimum: 1 },
};

const delayParameter = {
  name: '_delay',
  in: 'query',
  description: 'Artificial response delay in milliseconds.',
  schema: { type: 'integer', minimum: 0 },
};

const listParameters = [
  {
    name: '_page',
    in: 'query',
    description: 'Page number. The page alias is also supported.',
    schema: { type: 'integer', minimum: 1, default: 1 },
  },
  {
    name: '_limit',
    in: 'query',
    description: 'Items per page. The limit alias is also supported.',
    schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
  },
  {
    name: '_sort',
    in: 'query',
    description: 'Resource field used for sorting.',
    schema: { type: 'string', default: 'id' },
  },
  {
    name: '_order',
    in: 'query',
    description: 'Sort direction.',
    schema: { type: 'string', enum: ['asc', 'desc'], default: 'asc' },
  },
  delayParameter,
];

const searchParameters = [
  {
    name: 'q',
    in: 'query',
    required: true,
    description: 'Case-insensitive search text.',
    schema: { type: 'string', minLength: 1 },
  },
  delayParameter,
];

const mutationResponses = (resourceName: string) => ({
  '200': jsonResponse(`Updated ${resourceName}.`, ref(resourceName)),
  '400': jsonResponse('Invalid request data.', ref('ValidationError')),
  '404': jsonResponse(`${resourceName} not found.`, ref('Error')),
});

interface CrudResource {
  slug: string;
  name: string;
  listDescription: string;
  searchDescription: string;
  filters: Array<Record<string, unknown>>;
}

const createCrudPaths = ({
  slug,
  name,
  listDescription,
  searchDescription,
  filters,
}: CrudResource) => {
  const inputName = `${name}Input`;
  const patchName = `${name}Patch`;
  const paths: Record<string, unknown> = {};

  paths[`/${slug}`] = {
    get: {
      operationId: `list${name}s`,
      tags: [name],
      summary: `List ${slug}`,
      description: listDescription,
      parameters: [...listParameters, ...filters],
      responses: {
        '200': jsonResponse(`Paginated ${slug}.`, {
          allOf: [
            ref('PaginatedResponse'),
            {
              type: 'object',
              properties: {
                data: { type: 'array', items: ref(name) },
              },
            },
          ],
        }),
      },
    },
    post: {
      operationId: `create${name}`,
      tags: [name],
      summary: `Create a ${name.toLowerCase()}`,
      requestBody: {
        required: true,
        content: { 'application/json': { schema: ref(inputName) } },
      },
      responses: {
        '201': jsonResponse(`Created ${name}.`, ref(name)),
        '400': jsonResponse('Invalid request data.', ref('ValidationError')),
      },
    },
  };

  paths[`/${slug}/search`] = {
    get: {
      operationId: `search${name}s`,
      tags: [name],
      summary: `Search ${slug}`,
      description: searchDescription,
      parameters: name === 'Post' ? [searchParameters[0], ...listParameters] : searchParameters,
      responses: {
        '200': jsonResponse('Search results.', {
          type: 'object',
          properties: {
            query: { type: 'string' },
            total: { type: 'integer' },
            results: { type: 'array', items: ref(name) },
          },
          required: ['query', 'total', 'results'],
        }),
        '400': jsonResponse('Missing search query.', ref('ValidationError')),
      },
    },
  };

  paths[`/${slug}/{id}`] = {
    get: {
      operationId: `get${name}`,
      tags: [name],
      summary: `Get one ${name.toLowerCase()}`,
      parameters: [idParameter, delayParameter],
      responses: {
        '200': jsonResponse(`${name} resource.`, ref(name)),
        '404': jsonResponse(`${name} not found.`, ref('Error')),
      },
    },
    put: {
      operationId: `replace${name}`,
      tags: [name],
      summary: `Replace a ${name.toLowerCase()}`,
      parameters: [idParameter],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: ref(inputName) } },
      },
      responses: mutationResponses(name),
    },
    patch: {
      operationId: `update${name}`,
      tags: [name],
      summary: `Update selected ${name.toLowerCase()} fields`,
      parameters: [idParameter],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: ref(patchName) } },
      },
      responses: mutationResponses(name),
    },
    delete: {
      operationId: `delete${name}`,
      tags: [name],
      summary: `Delete a ${name.toLowerCase()}`,
      parameters: [idParameter],
      responses: {
        '204': { description: 'Deleted successfully. No response body.' },
        '404': jsonResponse(`${name} not found.`, ref('Error')),
      },
    },
  };

  return paths;
};

const crudResources: CrudResource[] = [
  {
    slug: 'users',
    name: 'User',
    listDescription: 'Returns users with pagination, sorting, delay, and field filters.',
    searchDescription: 'Searches user name, username, and email. Returns up to 10 results.',
    filters: [
      { name: 'name_like', in: 'query', schema: { type: 'string' } },
      { name: 'username', in: 'query', schema: { type: 'string' } },
      { name: 'email', in: 'query', schema: { type: 'string' } },
    ],
  },
  {
    slug: 'posts',
    name: 'Post',
    listDescription: 'Returns posts with their user summary, pagination, sorting, delay, and filters.',
    searchDescription: 'Searches post title and body with pagination and sorting.',
    filters: [
      { name: 'userId', in: 'query', schema: { type: 'integer' } },
      { name: 'title_like', in: 'query', schema: { type: 'string' } },
      { name: 'body_like', in: 'query', schema: { type: 'string' } },
    ],
  },
  {
    slug: 'todos',
    name: 'Todo',
    listDescription: 'Returns todos with their user summary, pagination, sorting, delay, and filters.',
    searchDescription: 'Searches todo title and description. Returns up to 10 results.',
    filters: [
      { name: 'userId', in: 'query', schema: { type: 'integer' } },
      { name: 'completed', in: 'query', schema: { type: 'boolean' } },
      { name: 'title_like', in: 'query', schema: { type: 'string' } },
    ],
  },
  {
    slug: 'comments',
    name: 'Comment',
    listDescription: 'Returns comments with their post summary, pagination, sorting, delay, and filters.',
    searchDescription: 'Searches comment name, email, and body. Returns up to 10 results.',
    filters: [
      { name: 'body_like', in: 'query', schema: { type: 'string' } },
      { name: 'email', in: 'query', schema: { type: 'string' } },
    ],
  },
];

const paths: Record<string, unknown> = {
  '/health': {
    get: {
      operationId: 'getHealth',
      tags: ['System'],
      summary: 'Check API health',
      responses: {
        '200': jsonResponse('API is healthy.', {
          type: 'object',
          properties: {
            status: { type: 'string', examples: ['OK'] },
            timestamp: { type: 'string', format: 'date-time' },
            uptime: { type: 'number', description: 'Process uptime in seconds.' },
          },
          required: ['status', 'timestamp', 'uptime'],
        }),
      },
    },
  },
};

crudResources.forEach((resource) => {
  Object.assign(paths, createCrudPaths(resource));
});

Object.assign(paths, {
  '/users/{id}/posts': {
    get: {
      operationId: 'listUserPosts',
      tags: ['User', 'Post'],
      summary: "List a user's posts",
      parameters: [idParameter, ...listParameters.slice(0, 2)],
      responses: {
        '200': jsonResponse('Paginated posts.', ref('PaginatedPostResponse')),
        '404': jsonResponse('User not found.', ref('Error')),
      },
    },
  },
  '/users/{id}/todos': {
    get: {
      operationId: 'listUserTodos',
      tags: ['User', 'Todo'],
      summary: "List a user's todos",
      parameters: [idParameter, ...listParameters.slice(0, 2)],
      responses: {
        '200': jsonResponse('Paginated todos.', ref('PaginatedTodoResponse')),
        '404': jsonResponse('User not found.', ref('Error')),
      },
    },
  },
  '/posts/{id}/likes': {
    get: {
      operationId: 'getPostLikes',
      tags: ['Post'],
      summary: "Get a post's like count",
      parameters: [idParameter],
      responses: {
        '200': jsonResponse('Current like count.', {
          type: 'object',
          properties: {
            postId: { type: 'integer' },
            likes: { type: 'integer' },
          },
          required: ['postId', 'likes'],
        }),
        '404': jsonResponse('Post not found.', ref('Error')),
      },
    },
    post: {
      operationId: 'addPostLike',
      tags: ['Post'],
      summary: 'Add a like to a post',
      parameters: [idParameter],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { userId: { type: 'integer', minimum: 1 } },
            },
          },
        },
      },
      responses: {
        '201': jsonResponse('Like added.', ref('LikeResult')),
        '404': jsonResponse('Post not found.', ref('Error')),
      },
    },
  },
  '/error/404': {
    get: {
      operationId: 'simulateNotFound',
      tags: ['Error simulation'],
      summary: 'Simulate a 404 response',
      responses: { '404': jsonResponse('Intentional not-found response.', ref('Error')) },
    },
  },
  '/error/500': {
    get: {
      operationId: 'simulateServerError',
      tags: ['Error simulation'],
      summary: 'Simulate a 500 response',
      responses: { '500': jsonResponse('Intentional server error.', ref('Error')) },
    },
  },
  '/error/validation': {
    get: {
      operationId: 'simulateValidationError',
      tags: ['Error simulation'],
      summary: 'Simulate a validation failure',
      responses: { '400': jsonResponse('Intentional validation error.', ref('ValidationError')) },
    },
  },
  '/error/timeout': {
    get: {
      operationId: 'simulateTimeout',
      tags: ['Error simulation'],
      summary: 'Simulate a request that never completes',
      responses: { default: { description: 'The server intentionally does not send a response.' } },
    },
  },
});

const timestampProperties = {
  createdAt: { type: 'string', format: 'date-time', readOnly: true },
  updatedAt: { type: 'string', format: 'date-time', readOnly: true },
};

const userInputProperties = {
  name: { type: 'string', minLength: 1, maxLength: 100 },
  username: { type: 'string', minLength: 3, maxLength: 50, pattern: '^[A-Za-z0-9_]+$' },
  email: { type: 'string', format: 'email' },
  phone: { type: 'string' },
  website: { type: 'string', format: 'uri' },
  address: { type: ['object', 'null'], additionalProperties: true },
  company: { type: ['object', 'null'], additionalProperties: true },
};

const postInputProperties = {
  title: { type: 'string', minLength: 1, maxLength: 200 },
  body: { type: 'string', minLength: 1, maxLength: 5000 },
  userId: { type: 'integer', minimum: 1, default: 1 },
};

const todoInputProperties = {
  title: { type: 'string', minLength: 1, maxLength: 200 },
  description: { type: 'string', minLength: 1, maxLength: 1000 },
  completed: { type: 'boolean', default: false },
  userId: { type: 'integer', minimum: 1, default: 1 },
};

const commentInputProperties = {
  name: { type: 'string', minLength: 1, maxLength: 100 },
  email: { type: 'string', format: 'email' },
  body: { type: 'string', minLength: 1, maxLength: 1000 },
  postId: { type: 'integer', minimum: 1 },
};

export const openapiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'ApiMocker Free API',
    version: '1.0.0',
    description:
      'A shared mock REST API for frontend development. Writes are temporary and data resets daily at midnight UTC.',
  },
  servers: [{ url: API_BASE_URL, description: 'Public free API' }],
  tags: [
    { name: 'System' },
    { name: 'User' },
    { name: 'Post' },
    { name: 'Todo' },
    { name: 'Comment' },
    { name: 'Error simulation' },
  ],
  paths,
  components: {
    schemas: {
      UserSummary: {
        type: 'object',
        properties: {
          id: { type: 'integer', readOnly: true },
          name: { type: 'string' },
          username: { type: 'string' },
          email: { type: 'string', format: 'email' },
        },
        required: ['id', 'name', 'username', 'email'],
      },
      UserInput: {
        type: 'object',
        properties: userInputProperties,
        required: ['name', 'username', 'email'],
        additionalProperties: false,
      },
      UserPatch: { type: 'object', properties: userInputProperties, additionalProperties: false },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', readOnly: true },
          ...userInputProperties,
          ...timestampProperties,
        },
        required: ['id', 'name', 'username', 'email', 'createdAt', 'updatedAt'],
      },
      PostInput: {
        type: 'object',
        properties: postInputProperties,
        required: ['title', 'body'],
        additionalProperties: false,
      },
      PostPatch: { type: 'object', properties: postInputProperties, additionalProperties: false },
      Post: {
        type: 'object',
        properties: {
          id: { type: 'integer', readOnly: true },
          ...postInputProperties,
          user: { ...ref('UserSummary'), readOnly: true },
          ...timestampProperties,
        },
        required: ['id', 'title', 'body', 'userId', 'user', 'createdAt', 'updatedAt'],
      },
      TodoInput: {
        type: 'object',
        properties: todoInputProperties,
        required: ['title'],
        additionalProperties: false,
      },
      TodoPatch: { type: 'object', properties: todoInputProperties, additionalProperties: false },
      Todo: {
        type: 'object',
        properties: {
          id: { type: 'integer', readOnly: true },
          ...todoInputProperties,
          description: { type: ['string', 'null'] },
          user: { ...ref('UserSummary'), readOnly: true },
          ...timestampProperties,
        },
        required: ['id', 'title', 'completed', 'userId', 'user', 'createdAt', 'updatedAt'],
      },
      CommentInput: {
        type: 'object',
        properties: commentInputProperties,
        required: ['name', 'email', 'body', 'postId'],
        additionalProperties: false,
      },
      CommentPatch: { type: 'object', properties: commentInputProperties, additionalProperties: false },
      Comment: {
        type: 'object',
        properties: {
          id: { type: 'integer', readOnly: true },
          ...commentInputProperties,
          post: {
            type: 'object',
            readOnly: true,
            properties: { id: { type: 'integer' }, title: { type: 'string' } },
            required: ['id', 'title'],
          },
          ...timestampProperties,
        },
        required: ['id', 'name', 'email', 'body', 'postId', 'post', 'createdAt', 'updatedAt'],
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
          hasNext: { type: 'boolean' },
          hasPrev: { type: 'boolean' },
        },
        required: ['page', 'limit', 'total', 'totalPages', 'hasNext', 'hasPrev'],
      },
      PaginatedResponse: {
        type: 'object',
        properties: {
          data: { type: 'array', items: {} },
          pagination: ref('Pagination'),
        },
        required: ['data', 'pagination'],
      },
      PaginatedPostResponse: {
        allOf: [
          ref('PaginatedResponse'),
          { type: 'object', properties: { data: { type: 'array', items: ref('Post') } } },
        ],
      },
      PaginatedTodoResponse: {
        allOf: [
          ref('PaginatedResponse'),
          { type: 'object', properties: { data: { type: 'array', items: ref('Todo') } } },
        ],
      },
      LikeResult: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          like: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              postId: { type: 'integer' },
              userId: { type: ['integer', 'null'] },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
          totalLikes: { type: 'integer' },
        },
        required: ['message', 'like', 'totalLikes'],
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
        },
      },
      ValidationError: {
        type: 'object',
        properties: {
          error: { type: 'string', examples: ['Validation Error'] },
          message: { type: 'string', examples: ['Invalid input data'] },
          details: { type: 'array', items: { type: 'object', additionalProperties: true } },
        },
        required: ['error', 'message'],
      },
    },
  },
} as const;
