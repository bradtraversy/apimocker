import express, { Express, NextFunction, Request, Response } from 'express';
import request from 'supertest';
import {
  environmentResources,
  EnvironmentRecord,
  EnvironmentResource,
  EnvironmentState,
} from '../../src/types/environment';
import { makeCollectionState } from '../../src/services/environmentData';
import { hashApiKey } from '../../src/utils/apiKey';

type MockEnvironment = {
  id: string;
  slug: string;
  name: string;
  apiKeyHash: string;
  managementKeyHash: string;
  plan: string;
  active: boolean;
  requestLimit: number;
  requestsUsed: number;
  periodStart: Date;
  periodEnd: Date;
  burstLimit: number;
  burstRequests: number;
  burstWindowStart: Date;
  maxRecords: number;
};

type Mutation<T> = (state: EnvironmentState) => {
  changed: EnvironmentResource[];
  value: T;
};

const apiKeys = {
  alpha: 'am_env_alpha_test',
  beta: 'am_env_beta_test',
};

const managementKeys = {
  alpha: 'am_mgmt_alpha_test',
  beta: 'am_mgmt_beta_test',
};

let mockEnvironments: Record<string, MockEnvironment>;
let mockStates: Record<string, EnvironmentState>;
let mockRevokeOnTransaction = false;

const findEnvironment = (where: { id?: string; slug?: string }) => {
  const environment = Object.values(mockEnvironments).find(candidate =>
    where.id ? candidate.id === where.id : candidate.slug === where.slug
  );
  return environment ? { ...environment } : null;
};

const mockApiEnvironmentModel = {
  fields: {
    requestLimit: 'requestLimit',
    burstLimit: 'burstLimit',
  },
  findUnique: jest.fn(async ({ where }: { where: { id?: string; slug?: string } }) =>
    findEnvironment(where)
  ),
  updateMany: jest.fn(async ({
    where,
    data,
  }: {
    where: {
      id: string;
      periodEnd?: { lte: Date };
      burstWindowStart?: { lte?: Date; gt?: Date };
    };
    data: Record<string, unknown>;
  }) => {
    const environment = mockEnvironments[where.id];
    if (!environment) {
      return { count: 0 };
    }

    const requestsUsed = data['requestsUsed'];
    const burstRequests = data['burstRequests'];
    if (
      requestsUsed === 0 &&
      data['periodStart'] instanceof Date &&
      data['periodEnd'] instanceof Date &&
      where.periodEnd?.lte &&
      environment.active &&
      environment.periodEnd <= where.periodEnd.lte
    ) {
      environment.requestsUsed = 0;
      environment.periodStart = data['periodStart'];
      environment.periodEnd = data['periodEnd'];
      return { count: 1 };
    }

    if (
      burstRequests === 0 &&
      data['burstWindowStart'] instanceof Date &&
      where.burstWindowStart?.lte &&
      environment.active &&
      environment.burstWindowStart <= where.burstWindowStart.lte
    ) {
      environment.burstRequests = 0;
      environment.burstWindowStart = data['burstWindowStart'];
      return { count: 1 };
    }

    const incrementsQuota =
      typeof requestsUsed === 'object' &&
      requestsUsed !== null &&
      'increment' in requestsUsed &&
      typeof burstRequests === 'object' &&
      burstRequests !== null &&
      'increment' in burstRequests;

    if (!incrementsQuota) {
      return { count: 0 };
    }

    if (
      !environment.active ||
      environment.requestsUsed >= environment.requestLimit ||
      environment.burstRequests >= environment.burstLimit
    ) {
      return { count: 0 };
    }

    environment.requestsUsed += 1;
    environment.burstRequests += 1;
    return { count: 1 };
  }),
};

const mockPrisma = {
  apiEnvironment: mockApiEnvironmentModel,
  post: {
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(async (
    callback: (transaction: { apiEnvironment: typeof mockApiEnvironmentModel }) =>
      Promise<unknown>
  ) => {
    if (mockRevokeOnTransaction) {
      mockEnvironments['environment-alpha']!.active = false;
      mockRevokeOnTransaction = false;
    }
    return callback({ apiEnvironment: mockApiEnvironmentModel });
  }),
};

const getState = (environmentId: string) => {
  const state = mockStates[environmentId];
  if (!state) {
    throw new Error(`Missing mock state for ${environmentId}`);
  }
  return state;
};

const mockStore = {
  read: jest.fn(async (
    environmentId: string,
    resources: EnvironmentResource[]
  ) => {
    const state = getState(environmentId);
    return resources.reduce<EnvironmentState>((selected, resource) => {
      const collection = state[resource];
      if (!collection) {
        throw new Error(`Missing ${resource} state for ${environmentId}`);
      }
      selected[resource] = collection;
      return selected;
    }, {});
  }),
  mutate: jest.fn(async <T>(
    environmentId: string,
    _resources: EnvironmentResource[],
    mutator: Mutation<T>
  ) => mutator(getState(environmentId)).value),
};

jest.mock('../../src/lib/prisma', () => ({ prisma: mockPrisma }));
jest.mock('../../src/services/environmentStore', () => ({
  EnvironmentStore: jest.fn().mockImplementation(() => mockStore),
}));

const environmentRoutes = require('../../src/routes/environments').default;
const sharedPostRoutes = require('../../src/routes/posts').default;
const {
  environmentAttemptRateLimiter,
  environmentPayloadError,
} = require('../../src/middleware/environmentAccess');
const previousFeatureFlag = process.env['ENABLE_ISOLATED_ENVIRONMENTS'];
process.env['ENABLE_ISOLATED_ENVIRONMENTS'] = 'true';
const exportedApp = require('../../src/index').default;
if (previousFeatureFlag === undefined) {
  delete process.env['ENABLE_ISOLATED_ENVIRONMENTS'];
} else {
  process.env['ENABLE_ISOLATED_ENVIRONMENTS'] = previousFeatureFlag;
}

const records = (values: EnvironmentRecord[]) => makeCollectionState(values);

const makeState = (label: string): EnvironmentState => ({
  users: records([
    { id: 1, name: `${label} One`, username: `${label}one`, email: `${label}1@example.com` },
    { id: 2, name: `${label} Two`, username: `${label}two`, email: `${label}2@example.com` },
  ]),
  posts: records([
    { id: 1, title: `${label} post`, body: 'Seed body', userId: 2 },
  ]),
  todos: records([
    { id: 1, title: `${label} todo`, completed: false, userId: 2 },
  ]),
  comments: records([
    {
      id: 1,
      name: `${label} Reader`,
      email: `${label}reader@example.com`,
      body: 'Seed comment',
      postId: 1,
    },
  ]),
  likes: records([{ id: 1, postId: 1, userId: 1 }]),
});

const makeEnvironment = (
  id: string,
  slug: 'alpha' | 'beta'
): MockEnvironment => ({
  id,
  slug,
  name: `${slug} environment`,
  apiKeyHash: hashApiKey(apiKeys[slug]),
  managementKeyHash: hashApiKey(managementKeys[slug]),
  plan: 'developer',
  active: true,
  requestLimit: 100,
  requestsUsed: 3,
  periodStart: new Date('2026-07-01T00:00:00.000Z'),
  periodEnd: new Date('2026-08-01T00:00:00.000Z'),
  burstLimit: 100,
  burstRequests: 2,
  burstWindowStart: new Date(),
  maxRecords: 10,
});

const makeIsolatedApp = () => {
  const app = express();
  app.set('trust proxy', 1);
  app.use(
    '/v1/environments/:slug',
    environmentAttemptRateLimiter,
    express.json({ limit: '64kb' }),
    express.urlencoded({ extended: true, limit: '64kb' }),
    environmentRoutes,
    (req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.originalUrl} not found`,
      });
    },
    environmentPayloadError
  );
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ error: String(error) });
  });
  return app;
};

const makeSharedApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/posts', sharedPostRoutes);
  return app;
};

const environmentRequest = (
  app: Express,
  slug: 'alpha' | 'beta',
  path: string
) => request(app).get(`/v1/environments/${slug}${path}`).set('X-API-Key', apiKeys[slug]);

describe('API root', () => {
  it('returns API status without serving legacy frontend assets', async () => {
    const status = await request(exportedApp).get('/').expect(200);

    expect(status.body).toEqual({
      name: 'ApiMocker API',
      status: 'running',
      health: '/health',
    });

    await request(exportedApp).get('/styles.css').expect(404);
  });
});

describe('isolated environment routes', () => {
  let app: ReturnType<typeof makeIsolatedApp>;

  beforeEach(() => {
    mockEnvironments = {
      'environment-alpha': makeEnvironment('environment-alpha', 'alpha'),
      'environment-beta': makeEnvironment('environment-beta', 'beta'),
    };
    mockStates = {
      'environment-alpha': makeState('alpha'),
      'environment-beta': makeState('beta'),
    };
    mockRevokeOnTransaction = false;
    mockApiEnvironmentModel.findUnique.mockClear();
    mockApiEnvironmentModel.updateMany.mockClear();
    mockPrisma.$transaction.mockClear();
    mockStore.read.mockClear();
    mockStore.mutate.mockClear();
    app = makeIsolatedApp();
  });

  it('rejects missing and invalid API keys', async () => {
    const missing = await request(app)
      .get('/v1/environments/alpha/users')
      .expect(401);
    const invalid = await request(app)
      .get('/v1/environments/alpha/users')
      .set('X-API-Key', 'am_env_invalid')
      .expect(401);

    expect(Number(invalid.headers['ratelimit-remaining'])).toBe(
      Number(missing.headers['ratelimit-remaining']) - 1
    );
  });

  it('rejects an inactive environment', async () => {
    mockEnvironments['environment-alpha']!.active = false;

    const response = await environmentRequest(app, 'alpha', '/users').expect(403);

    expect(response.body.message).toBe('This environment is inactive');
  });

  it('denies monthly and burst quota exhaustion', async () => {
    const alpha = mockEnvironments['environment-alpha']!;
    alpha.requestsUsed = alpha.requestLimit;

    const monthly = await environmentRequest(app, 'alpha', '/users').expect(429);
    expect(monthly.body.message).toBe('Monthly environment request limit exceeded');

    alpha.requestsUsed = 0;
    alpha.burstRequests = alpha.burstLimit;

    const burst = await environmentRequest(app, 'alpha', '/users').expect(429);
    expect(burst.body.message).toContain('Burst limit exceeded');
  });

  it('returns usage with persistent quota headers', async () => {
    const response = await environmentRequest(app, 'alpha', '/usage').expect(200);

    expect(response.body).toMatchObject({
      slug: 'alpha',
      requestsUsed: 4,
      requestsRemaining: 96,
      burstRequests: 3,
      maxRecords: 10,
    });
    expect(response.headers['x-ratelimit-limit']).toBe('100');
    expect(response.headers['x-ratelimit-remaining']).toBe('96');
    expect(response.headers['x-burstlimit-limit']).toBe('100');
    expect(response.headers['access-control-expose-headers']).toContain(
      'X-BurstLimit-Remaining'
    );
  });

  it('resets an expired monthly quota period before consuming the request', async () => {
    const alpha = mockEnvironments['environment-alpha']!;
    alpha.periodEnd = new Date('2026-06-01T00:00:00.000Z');
    alpha.requestsUsed = alpha.requestLimit;

    const response = await environmentRequest(app, 'alpha', '/usage').expect(200);

    expect(response.body.requestsUsed).toBe(1);
    expect(new Date(response.body.periodEnd).getTime()).toBeGreaterThan(Date.now());
    expect(mockApiEnvironmentModel.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ requestsUsed: 0 }),
      })
    );
  });

  it('resets an expired burst window before consuming the request', async () => {
    const alpha = mockEnvironments['environment-alpha']!;
    alpha.burstWindowStart = new Date(Date.now() - 120_000);
    alpha.burstRequests = alpha.burstLimit;

    const response = await environmentRequest(app, 'alpha', '/usage').expect(200);

    expect(response.body.burstRequests).toBe(1);
    expect(mockApiEnvironmentModel.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ burstRequests: 0 }),
      })
    );
  });

  it('requires the correct management key for reset', async () => {
    await request(app)
      .post('/v1/environments/alpha/reset')
      .set('X-API-Key', apiKeys.alpha)
      .set('X-Management-Key', 'am_mgmt_wrong')
      .expect(403);

    expect(mockStore.mutate).not.toHaveBeenCalled();
  });

  it('restores seed state when reset is authorized', async () => {
    await request(app)
      .post('/v1/environments/alpha/posts')
      .set('X-API-Key', apiKeys.alpha)
      .send({ title: 'Temporary', body: 'Remove me', userId: 2 })
      .expect(201);

    await request(app)
      .post('/v1/environments/alpha/reset')
      .set('X-API-Key', apiKeys.alpha)
      .set('X-Management-Key', managementKeys.alpha)
      .expect(200);

    expect(mockStore.mutate).toHaveBeenLastCalledWith(
      'environment-alpha',
      [...environmentResources],
      expect.any(Function),
      true
    );

    const response = await environmentRequest(app, 'alpha', '/posts').expect(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].title).toBe('alpha post');
  });

  it('rejects creation when the resource record cap is reached', async () => {
    mockEnvironments['environment-alpha']!.maxRecords = 1;

    const response = await request(app)
      .post('/v1/environments/alpha/posts')
      .set('X-API-Key', apiKeys.alpha)
      .send({ title: 'Over cap', body: 'No room', userId: 2 })
      .expect(409);

    expect(response.body.message).toBe('posts has reached the 1 record limit');
  });

  it('keeps mutations isolated between two routed environments', async () => {
    await request(app)
      .post('/v1/environments/alpha/posts')
      .set('X-API-Key', apiKeys.alpha)
      .send({ title: 'Alpha only', body: 'Private data', userId: 2 })
      .expect(201);

    const alpha = await environmentRequest(app, 'alpha', '/posts').expect(200);
    const beta = await environmentRequest(app, 'beta', '/posts').expect(200);

    expect(alpha.body.data.map((post: EnvironmentRecord) => post['title'])).toContain(
      'Alpha only'
    );
    expect(beta.body.data).toHaveLength(1);
    expect(beta.body.data[0].title).toBe('beta post');
  });

  it('hydrates related records with the nested user email', async () => {
    const response = await environmentRequest(
      app,
      'alpha',
      '/users/2/posts'
    ).expect(200);

    expect(response.body.data[0]).toMatchObject({
      userId: 2,
      user: {
        id: 2,
        name: 'alpha Two',
        username: 'alphatwo',
        email: 'alpha2@example.com',
      },
    });
  });

  it('rejects an empty search query', async () => {
    const response = await environmentRequest(
      app,
      'alpha',
      '/posts/search?q=%20%20'
    ).expect(400);

    expect(response.body.message).toBe('Query parameter "q" is required');
  });

  it('mounts the exported environment app with the 64 KB body limit', async () => {
    const response = await request(exportedApp)
      .post('/v1/environments/alpha/posts')
      .set('X-API-Key', apiKeys.alpha)
      .send({ title: 'Large', body: 'x'.repeat(70 * 1024), userId: 2 })
      .expect(413);

    expect(response.body.message).toBe(
      'Isolated environment request bodies are limited to 64 KB'
    );
  });

  it('does not count validation, management, or quota errors as auth attempts', async () => {
    const validation = await request(app)
      .post('/v1/environments/alpha/posts')
      .set('X-API-Key', apiKeys.alpha)
      .send({ title: '', body: '' })
      .expect(400);

    const management = await request(app)
      .post('/v1/environments/alpha/reset')
      .set('X-API-Key', apiKeys.alpha)
      .set('X-Management-Key', 'am_mgmt_wrong')
      .expect(403);

    const alpha = mockEnvironments['environment-alpha']!;
    alpha.requestsUsed = alpha.requestLimit;
    const quota = await environmentRequest(app, 'alpha', '/users').expect(429);

    expect(management.headers['ratelimit-remaining']).toBe(
      validation.headers['ratelimit-remaining']
    );
    expect(quota.headers['ratelimit-remaining']).toBe(
      validation.headers['ratelimit-remaining']
    );
  });

  it('returns 403 when an environment is revoked during quota consumption', async () => {
    mockRevokeOnTransaction = true;

    const response = await environmentRequest(app, 'alpha', '/users').expect(403);

    expect(response.body.message).toBe('This environment is inactive');
  });

  it('accepts partial updates and preserves the existing user relationship', async () => {
    const response = await request(app)
      .patch('/v1/environments/alpha/posts/1')
      .set('X-API-Key', apiKeys.alpha)
      .send({ title: 'Partial title' })
      .expect(200);

    expect(response.body).toMatchObject({ title: 'Partial title', userId: 2 });
    expect(mockStates['environment-alpha']!.posts!.data[0]).toMatchObject({
      title: 'Partial title',
      userId: 2,
    });
  });

  it.each([
    ['users', { name: 'Renamed user' }, { name: 'Renamed user', username: 'alphaone' }],
    ['todos', { completed: true }, { completed: true, userId: 2 }],
    ['comments', { body: 'Updated comment' }, { body: 'Updated comment', postId: 1 }],
  ])('accepts partial %s updates', async (resource, body, expected) => {
    const response = await request(app)
      .patch(`/v1/environments/alpha/${resource}/1`)
      .set('X-API-Key', apiKeys.alpha)
      .send(body)
      .expect(200);

    expect(response.body).toMatchObject(expected);
  });

  it('preserves post and todo userId when PUT omits the relationship', async () => {
    const post = await request(app)
      .put('/v1/environments/alpha/posts/1')
      .set('X-API-Key', apiKeys.alpha)
      .send({ title: 'Replacement post', body: 'Replacement body' })
      .expect(200);
    const todo = await request(app)
      .put('/v1/environments/alpha/todos/1')
      .set('X-API-Key', apiKeys.alpha)
      .send({ title: 'Replacement todo' })
      .expect(200);

    expect(post.body.userId).toBe(2);
    expect(todo.body.userId).toBe(2);
  });
});

describe('shared post routes', () => {
  beforeEach(() => {
    mockPrisma.post.findMany.mockReset().mockResolvedValue([]);
    mockPrisma.post.count.mockReset().mockResolvedValue(0);
    mockPrisma.post.update.mockReset();
    mockPrisma.post.update.mockResolvedValue({
      id: 1,
      title: 'Partial title',
      body: 'Existing body',
      userId: 2,
    });
  });

  it('accepts a partial post and leaves an omitted userId unchanged', async () => {
    await request(makeSharedApp())
      .patch('/posts/1')
      .send({ title: 'Partial title' })
      .expect(200);

    expect(mockPrisma.post.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { title: 'Partial title' },
      include: {
        user: {
          select: { id: true, name: true, username: true, email: true },
        },
      },
    });
  });

  it.each([
    ['invalid', 'invalid', 1, 10, 0],
    ['2', '500', 2, 100, 100],
  ])(
    'normalizes search pagination for page %s and limit %s',
    async (page, limit, expectedPage, expectedLimit, expectedSkip) => {
      const response = await request(makeSharedApp())
        .get('/posts/search')
        .query({ q: 'api', _page: page, _limit: limit })
        .expect(200);

      expect(response.body).toMatchObject({
        page: expectedPage,
        limit: expectedLimit,
      });
      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: expectedLimit,
          skip: expectedSkip,
        })
      );
    }
  );
});
