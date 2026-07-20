import {
  EnvironmentCollectionState,
  EnvironmentRecord,
  EnvironmentResource,
  EnvironmentState,
} from '../types/environment';

const reservedQueryKeys = new Set([
  '_limit',
  '_page',
  'limit',
  'page',
  '_sort',
  '_order',
  '_delay',
]);

const allowedFields: Record<EnvironmentResource, readonly string[]> = {
  users: ['name', 'username', 'email', 'phone', 'website', 'address', 'company'],
  posts: ['title', 'body', 'userId'],
  todos: ['title', 'description', 'completed', 'userId'],
  comments: ['name', 'email', 'body', 'postId'],
  likes: ['postId', 'userId'],
};

const timestampedResources = new Set<EnvironmentResource>([
  'users',
  'posts',
  'todos',
  'comments',
]);

export class EnvironmentDataError extends Error {
  constructor(
    message: string,
    readonly statusCode: number
  ) {
    super(message);
    this.name = 'EnvironmentDataError';
  }
}

export const cloneRecords = (records: EnvironmentRecord[]) =>
  JSON.parse(JSON.stringify(records)) as EnvironmentRecord[];

export const getCollection = (
  state: EnvironmentState,
  resource: EnvironmentResource
) => {
  const collection = state[resource];

  if (!collection) {
    throw new EnvironmentDataError(`Collection ${resource} is unavailable`, 500);
  }

  return collection;
};

const getQueryValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

const numberFromQuery = (value: unknown, fallback: number) => {
  const parsed = Number(getQueryValue(value));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const matchesFilter = (record: EnvironmentRecord, key: string, value: unknown) => {
  const queryValue = getQueryValue(value);

  if (key.endsWith('_like')) {
    const field = key.slice(0, -5);
    return String(record[field] ?? '')
      .toLowerCase()
      .includes(String(queryValue ?? '').toLowerCase());
  }

  if (key === 'id' || key === 'userId' || key === 'postId') {
    return Number(record[key]) === Number(queryValue);
  }

  if (key === 'completed') {
    return record[key] === (String(queryValue).toLowerCase() === 'true');
  }

  return String(record[key] ?? '') === String(queryValue ?? '');
};

const compareValues = (left: unknown, right: unknown) => {
  if (typeof left === 'number' && typeof right === 'number') {
    return left - right;
  }

  return String(left ?? '').localeCompare(String(right ?? ''), undefined, {
    sensitivity: 'base',
  });
};

export const listRecords = (
  records: EnvironmentRecord[],
  query: Record<string, unknown>
) => {
  const page = Math.max(1, Math.floor(numberFromQuery(query['page'] ?? query['_page'], 1)));
  const requestedLimit = Math.floor(
    numberFromQuery(query['limit'] ?? query['_limit'], 10)
  );
  const limit = Math.min(Math.max(requestedLimit, 1), 100);
  const sortField = String(getQueryValue(query['_sort']) ?? 'id');
  const sortDirection = String(getQueryValue(query['_order']) ?? 'asc').toLowerCase();

  const filtered = records.filter(record =>
    Object.entries(query).every(([key, value]) =>
      reservedQueryKeys.has(key) ? true : matchesFilter(record, key, value)
    )
  );

  const sorted = [...filtered].sort((left, right) => {
    const compared = compareValues(left[sortField], right[sortField]);
    return sortDirection === 'desc' ? -compared : compared;
  });
  const total = sorted.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;

  return {
    data: sorted.slice(start, start + limit),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

export const searchRecords = (
  records: EnvironmentRecord[],
  searchTerm: string,
  fields: readonly string[]
) => {
  const term = searchTerm.trim().toLowerCase();
  return records.filter(record =>
    fields.some(field => String(record[field] ?? '').toLowerCase().includes(term))
  );
};

const pickFields = (
  resource: EnvironmentResource,
  input: Record<string, unknown>
) =>
  Object.fromEntries(
    allowedFields[resource]
      .filter(field => Object.prototype.hasOwnProperty.call(input, field))
      .map(field => [field, input[field]])
  );

const assertPositiveId = (value: unknown, field: string) => {
  const id = Number(value);

  if (!Number.isInteger(id) || id < 1) {
    throw new EnvironmentDataError(`${field} must be a positive integer`, 400);
  }

  return id;
};

const assertForeignKeys = (
  state: EnvironmentState,
  resource: EnvironmentResource,
  record: Record<string, unknown>
) => {
  if (resource === 'posts' || resource === 'todos') {
    const userId = assertPositiveId(record['userId'], 'userId');
    if (!getCollection(state, 'users').data.some(user => user.id === userId)) {
      throw new EnvironmentDataError(`User with id ${userId} not found`, 400);
    }
  }

  if (resource === 'comments' || resource === 'likes') {
    const postId = assertPositiveId(record['postId'], 'postId');
    if (!getCollection(state, 'posts').data.some(post => post.id === postId)) {
      throw new EnvironmentDataError(`Post with id ${postId} not found`, 400);
    }
  }

};

const normalizeFields = (
  resource: EnvironmentResource,
  data: Record<string, unknown>,
  creating: boolean
) => {
  if ((resource === 'posts' || resource === 'todos' || resource === 'likes') &&
      data['userId'] !== undefined && data['userId'] !== null) {
    data['userId'] = assertPositiveId(data['userId'], 'userId');
  }

  if ((resource === 'comments' || resource === 'likes') && data['postId'] !== undefined) {
    data['postId'] = assertPositiveId(data['postId'], 'postId');
  }

  if (resource === 'todos') {
    if (data['completed'] !== undefined) {
      data['completed'] = data['completed'] === true || data['completed'] === 'true';
    } else if (creating) {
      data['completed'] = false;
    }
  }
};

const assertUserUnique = (
  state: EnvironmentState,
  record: Record<string, unknown>,
  excludedId?: number
) => {
  const duplicate = getCollection(state, 'users').data.find(user =>
    user.id !== excludedId &&
    (String(user['username']).toLowerCase() === String(record['username']).toLowerCase() ||
      String(user['email']).toLowerCase() === String(record['email']).toLowerCase())
  );

  if (duplicate) {
    throw new EnvironmentDataError('Username or email already exists', 409);
  }
};

export const createRecord = (
  state: EnvironmentState,
  resource: EnvironmentResource,
  input: Record<string, unknown>,
  maxRecords: number,
  now = new Date()
) => {
  const collection = getCollection(state, resource);

  if (collection.data.length >= maxRecords) {
    throw new EnvironmentDataError(
      `${resource} has reached the ${maxRecords} record limit`,
      409
    );
  }

  const data = pickFields(resource, input);
  if ((resource === 'posts' || resource === 'todos') && !data['userId']) {
    data['userId'] = 1;
  }
  normalizeFields(resource, data, true);

  assertForeignKeys(state, resource, data);
  if (resource === 'users') {
    assertUserUnique(state, data);
  }

  const timestamp = now.toISOString();
  const record: EnvironmentRecord = {
    id: collection.nextId,
    ...data,
    createdAt: timestamp,
    ...(timestampedResources.has(resource) ? { updatedAt: timestamp } : {}),
  };

  collection.data.push(record);
  collection.nextId += 1;
  return record;
};

export const updateRecord = (
  state: EnvironmentState,
  resource: EnvironmentResource,
  id: number,
  input: Record<string, unknown>,
  now = new Date()
) => {
  const collection = getCollection(state, resource);
  const index = collection.data.findIndex(record => record.id === id);

  if (index === -1) {
    throw new EnvironmentDataError(`${resource.slice(0, -1)} with id ${id} not found`, 404);
  }

  const current = collection.data[index] as EnvironmentRecord;
  const data = pickFields(resource, input);
  if ((resource === 'posts' || resource === 'todos') && !data['userId']) {
    data['userId'] = 1;
  }
  normalizeFields(resource, data, false);

  const updated: EnvironmentRecord = {
    ...current,
    ...data,
    id,
    ...(timestampedResources.has(resource) ? { updatedAt: now.toISOString() } : {}),
  };

  assertForeignKeys(state, resource, updated);
  if (resource === 'users') {
    assertUserUnique(state, updated, id);
  }

  collection.data[index] = updated;
  return updated;
};

export const deleteRecord = (
  state: EnvironmentState,
  resource: Exclude<EnvironmentResource, 'likes'>,
  id: number
) => {
  const collection = getCollection(state, resource);
  const index = collection.data.findIndex(record => record.id === id);

  if (index === -1) {
    throw new EnvironmentDataError(`${resource.slice(0, -1)} with id ${id} not found`, 404);
  }

  if (resource === 'users') {
    const postIds = new Set(
      getCollection(state, 'posts').data
        .filter(post => Number(post['userId']) === id)
        .map(post => post.id)
    );
    getCollection(state, 'posts').data = getCollection(state, 'posts').data.filter(
      post => Number(post['userId']) !== id
    );
    getCollection(state, 'todos').data = getCollection(state, 'todos').data.filter(
      todo => Number(todo['userId']) !== id
    );
    getCollection(state, 'comments').data = getCollection(state, 'comments').data.filter(
      comment => !postIds.has(Number(comment['postId']))
    );
    getCollection(state, 'likes').data = getCollection(state, 'likes').data.filter(
      like => !postIds.has(Number(like['postId']))
    );
  }

  if (resource === 'posts') {
    getCollection(state, 'comments').data = getCollection(state, 'comments').data.filter(
      comment => Number(comment['postId']) !== id
    );
    getCollection(state, 'likes').data = getCollection(state, 'likes').data.filter(
      like => Number(like['postId']) !== id
    );
  }

  collection.data.splice(index, 1);
};

export const resetState = (state: EnvironmentState) => {
  Object.values(state).forEach(collection => {
    if (collection) {
      if (!collection.seedData || collection.seedNextId === undefined) {
        throw new EnvironmentDataError('Seed snapshot is unavailable for reset', 500);
      }
      collection.data = cloneRecords(collection.seedData);
      collection.nextId = collection.seedNextId;
    }
  });
};

const userSummary = (user: EnvironmentRecord | undefined) =>
  user
    ? {
        id: user.id,
        name: user['name'],
        username: user['username'],
      }
    : null;

const postSummary = (post: EnvironmentRecord | undefined) =>
  post
    ? {
        id: post.id,
        title: post['title'],
      }
    : null;

export const hydrateRecord = (
  resource: EnvironmentResource,
  record: EnvironmentRecord,
  state: EnvironmentState
) => {
  if (resource === 'posts' || resource === 'todos') {
    const user = getCollection(state, 'users').data.find(
      candidate => candidate.id === Number(record['userId'])
    );
    return { ...record, user: userSummary(user) };
  }

  if (resource === 'comments') {
    const post = getCollection(state, 'posts').data.find(
      candidate => candidate.id === Number(record['postId'])
    );
    return { ...record, post: postSummary(post) };
  }

  return { ...record };
};

export const makeCollectionState = (
  records: EnvironmentRecord[]
): EnvironmentCollectionState => {
  const data = cloneRecords(records);
  const nextId = data.reduce((largest, record) => Math.max(largest, record.id), 0) + 1;

  return {
    data,
    seedData: cloneRecords(records),
    nextId,
    seedNextId: nextId,
    version: 1,
  };
};
