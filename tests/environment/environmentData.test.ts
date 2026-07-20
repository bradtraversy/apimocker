import {
  createRecord,
  deleteRecord,
  getCollection,
  listRecords,
  makeCollectionState,
  resetState,
} from '../../src/services/environmentData';
import { EnvironmentRecord, EnvironmentState } from '../../src/types/environment';
import {
  apiKeyMatches,
  generateApiKey,
  generateManagementKey,
  hashApiKey,
} from '../../src/utils/apiKey';

const records = (values: EnvironmentRecord[]) => makeCollectionState(values);

const makeState = (): EnvironmentState => ({
  users: records([
    { id: 1, name: 'Ada', username: 'ada', email: 'ada@example.com' },
    { id: 2, name: 'Grace', username: 'grace', email: 'grace@example.com' },
  ]),
  posts: records([
    { id: 1, title: 'Cloud Notes', body: 'First', userId: 1 },
    { id: 2, title: 'Local Notes', body: 'Second', userId: 2 },
  ]),
  todos: records([{ id: 1, title: 'Ship it', completed: false, userId: 1 }]),
  comments: records([
    {
      id: 1,
      name: 'Reader',
      email: 'reader@example.com',
      body: 'Useful',
      postId: 1,
    },
  ]),
  likes: records([{ id: 1, postId: 1, userId: 1 }]),
});

describe('isolated environment data', () => {
  it('keeps CRUD state isolated between environments', () => {
    const first = makeState();
    const second = makeState();

    const created = createRecord(
      first,
      'posts',
      { title: 'Only here', body: 'Private', userId: 1 },
      100,
      new Date('2026-07-19T12:00:00.000Z')
    );

    expect(created.id).toBe(3);
    expect(getCollection(first, 'posts').data).toHaveLength(3);
    expect(getCollection(second, 'posts').data).toHaveLength(2);
  });

  it('filters, sorts, and paginates without changing source order', () => {
    const state = makeState();
    const source = getCollection(state, 'posts').data;
    const result = listRecords(source, {
      title_like: 'notes',
      _sort: 'title',
      _order: 'desc',
      _page: '1',
      _limit: '1',
    });

    expect(result.data.map(post => post['title'])).toEqual(['Local Notes']);
    expect(result.pagination).toMatchObject({ total: 2, totalPages: 2, hasNext: true });
    expect(source.map(post => post.id)).toEqual([1, 2]);
  });

  it('cascades user deletion and restores the original snapshot', () => {
    const state = makeState();

    deleteRecord(state, 'users', 1);

    expect(getCollection(state, 'users').data.map(user => user.id)).toEqual([2]);
    expect(getCollection(state, 'posts').data.map(post => post.id)).toEqual([2]);
    expect(getCollection(state, 'todos').data).toHaveLength(0);
    expect(getCollection(state, 'comments').data).toHaveLength(0);
    expect(getCollection(state, 'likes').data).toHaveLength(0);

    resetState(state);

    expect(getCollection(state, 'users').data).toHaveLength(2);
    expect(getCollection(state, 'posts').data).toHaveLength(2);
    expect(getCollection(state, 'comments').data).toHaveLength(1);
    expect(getCollection(state, 'likes').data).toHaveLength(1);
  });

  it('normalizes relationship IDs and todo completion values', () => {
    const state = makeState();
    const todo = createRecord(
      state,
      'todos',
      { title: 'Normalize', userId: '2', completed: 'true' },
      100
    );
    const defaultTodo = createRecord(
      state,
      'todos',
      { title: 'Default', userId: 1 },
      100
    );
    const comment = createRecord(
      state,
      'comments',
      { name: 'Reader', email: 'r@example.com', body: 'Hi', postId: '2' },
      100
    );
    const like = createRecord(
      state,
      'likes',
      { postId: '2', userId: '999' },
      100
    );

    expect(todo).toMatchObject({ userId: 2, completed: true });
    expect(defaultTodo).toMatchObject({ userId: 1, completed: false });
    expect(comment).toMatchObject({ postId: 2 });
    expect(like).toMatchObject({ postId: 2, userId: 999 });
  });
});

describe('isolated environment access helpers', () => {
  it('hashes API keys and rejects a different key', () => {
    const key = generateApiKey();
    const hash = hashApiKey(key);

    expect(key.startsWith('am_env_')).toBe(true);
    expect(apiKeyMatches(key, hash)).toBe(true);
    expect(apiKeyMatches(`${key}x`, hash)).toBe(false);
  });

  it('uses a separate management key namespace', () => {
    const managementKey = generateManagementKey();
    const hash = hashApiKey(managementKey);

    expect(managementKey.startsWith('am_mgmt_')).toBe(true);
    expect(apiKeyMatches(managementKey, hash)).toBe(true);
    expect(apiKeyMatches(generateApiKey(), hash)).toBe(false);
  });
});
