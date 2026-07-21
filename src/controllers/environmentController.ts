import { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { getEnvironmentContext } from '../middleware/environmentAccess';
import {
  createRecord,
  deleteRecord,
  EnvironmentDataError,
  getCollection,
  hydrateRecord,
  listRecords,
  resetState,
  searchRecords,
  updateRecord,
} from '../services/environmentData';
import { EnvironmentStore } from '../services/environmentStore';
import { burstWindowEnd } from '../utils/environmentQuota';
import {
  environmentResources,
  EnvironmentResource,
} from '../types/environment';

type CrudResource = 'users' | 'posts' | 'todos' | 'comments';

const store = new EnvironmentStore(prisma);

const relationResources: Record<CrudResource, EnvironmentResource[]> = {
  users: ['users'],
  posts: ['posts', 'users'],
  todos: ['todos', 'users'],
  comments: ['comments', 'posts'],
};

const searchFields: Record<CrudResource, readonly string[]> = {
  users: ['name', 'username', 'email'],
  posts: ['title', 'body'],
  todos: ['title', 'description'],
  comments: ['name', 'email', 'body'],
};

const deleteResources: Record<CrudResource, EnvironmentResource[]> = {
  users: ['users', 'posts', 'todos', 'comments', 'likes'],
  posts: ['posts', 'comments', 'likes'],
  todos: ['todos'],
  comments: ['comments'],
};

const parseId = (value: string | undefined) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) {
    throw new EnvironmentDataError('Invalid resource ID', 400);
  }
  return id;
};

const environmentError = (
  error: unknown,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof EnvironmentDataError) {
    return res.status(error.statusCode).json({
      error: error.statusCode === 404 ? 'Not Found' : 'Request Error',
      message: error.message,
    });
  }

  return next(error);
};

export class EnvironmentController {
  list = (resource: CrudResource) =>
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const environment = getEnvironmentContext(res);
        const state = await store.read(environment.id, relationResources[resource]);
        const listed = listRecords(
          getCollection(state, resource).data,
          req.query as Record<string, unknown>
        );
        const data = listed.data.map(record => hydrateRecord(resource, record, state));

        res.set({
          'X-Total-Count': listed.pagination.total.toString(),
        });
        return res.json({ data, pagination: listed.pagination });
      } catch (error) {
        return environmentError(error, res, next);
      }
    };

  getById = (resource: CrudResource) =>
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = parseId(req.params['id']);
        const environment = getEnvironmentContext(res);
        const state = await store.read(environment.id, relationResources[resource]);
        const record = getCollection(state, resource).data.find(item => item.id === id);

        if (!record) {
          throw new EnvironmentDataError(
            `${resource.slice(0, -1)} with id ${id} not found`,
            404
          );
        }

        return res.json(hydrateRecord(resource, record, state));
      } catch (error) {
        return environmentError(error, res, next);
      }
    };

  create = (resource: CrudResource) =>
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const environment = getEnvironmentContext(res);
        const record = await store.mutate(
          environment.id,
          relationResources[resource],
          state => {
            const created = createRecord(
              state,
              resource,
              req.body as Record<string, unknown>,
              environment.maxRecords
            );
            return {
              changed: [resource],
              value: hydrateRecord(resource, created, state),
            };
          }
        );

        return res.status(201).json(record);
      } catch (error) {
        return environmentError(error, res, next);
      }
    };

  update = (resource: CrudResource) =>
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = parseId(req.params['id']);
        const environment = getEnvironmentContext(res);
        const record = await store.mutate(
          environment.id,
          relationResources[resource],
          state => {
            const updated = updateRecord(
              state,
              resource,
              id,
              req.body as Record<string, unknown>
            );
            return {
              changed: [resource],
              value: hydrateRecord(resource, updated, state),
            };
          }
        );

        return res.json(record);
      } catch (error) {
        return environmentError(error, res, next);
      }
    };

  delete = (resource: CrudResource) =>
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = parseId(req.params['id']);
        const environment = getEnvironmentContext(res);
        await store.mutate(environment.id, deleteResources[resource], state => {
          deleteRecord(state, resource, id);
          return {
            changed: deleteResources[resource],
            value: undefined,
          };
        });
        return res.status(204).send();
      } catch (error) {
        return environmentError(error, res, next);
      }
    };

  search = (resource: CrudResource) =>
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const q = req.query['q'];
        if (typeof q !== 'string' || !q.trim()) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Query parameter "q" is required',
          });
        }

        const environment = getEnvironmentContext(res);
        const state = await store.read(environment.id, relationResources[resource]);
        const matches = searchRecords(
          getCollection(state, resource).data,
          q,
          searchFields[resource]
        );

        if (resource === 'posts') {
          const query = { ...req.query } as Record<string, unknown>;
          delete query['q'];
          const listed = listRecords(matches, query);
          return res.json({
            query: q.trim(),
            total: listed.pagination.total,
            totalPages: listed.pagination.totalPages,
            page: listed.pagination.page,
            limit: listed.pagination.limit,
            hasNext: listed.pagination.hasNext,
            hasPrev: listed.pagination.hasPrev,
            results: listed.data.map(record => hydrateRecord(resource, record, state)),
          });
        }

        const results = matches.slice(0, 10).map(record => {
          if (resource === 'users') {
            return {
              id: record.id,
              name: record['name'],
              username: record['username'],
              email: record['email'],
            };
          }
          return hydrateRecord(resource, record, state);
        });
        return res.json({ query: q.trim(), total: results.length, results });
      } catch (error) {
        return environmentError(error, res, next);
      }
    };

  getRelated = (relation: 'posts' | 'todos') =>
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = parseId(req.params['id']);
        const environment = getEnvironmentContext(res);
        const state = await store.read(environment.id, [relation, 'users']);

        const query = {
          ...req.query,
          userId: userId.toString(),
        } as Record<string, unknown>;
        const listed = listRecords(getCollection(state, relation).data, query);
        return res.json({
          ...listed,
          data: listed.data.map(record => hydrateRecord(relation, record, state)),
        });
      } catch (error) {
        return environmentError(error, res, next);
      }
    };

  getLikes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const postId = parseId(req.params['id']);
      const environment = getEnvironmentContext(res);
      const state = await store.read(environment.id, ['posts', 'likes']);
      const postExists = getCollection(state, 'posts').data.some(post => post.id === postId);
      if (!postExists) {
        throw new EnvironmentDataError(`Post with id ${postId} not found`, 404);
      }

      const likes = getCollection(state, 'likes').data.filter(
        like => Number(like['postId']) === postId
      ).length;
      return res.json({ postId, likes });
    } catch (error) {
      return environmentError(error, res, next);
    }
  };

  addLike = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const postId = parseId(req.params['id']);
      const environment = getEnvironmentContext(res);
      const response = await store.mutate(
        environment.id,
        ['posts', 'likes'],
        state => {
          const like = createRecord(
            state,
            'likes',
            { postId, userId: req.body['userId'] ?? null },
            environment.maxRecords
          );
          const totalLikes = getCollection(state, 'likes').data.filter(
            item => Number(item['postId']) === postId
          ).length;
          return {
            changed: ['likes'],
            value: {
              message: 'Like added successfully',
              like,
              totalLikes,
            },
          };
        }
      );
      return res.status(201).json(response);
    } catch (error) {
      return environmentError(error, res, next);
    }
  };

  usage = (_req: Request, res: Response) => {
    const environment = getEnvironmentContext(res);
    return res.json({
      slug: environment.slug,
      name: environment.name,
      plan: environment.plan,
      active: true,
      requestsUsed: environment.requestsUsed,
      requestLimit: environment.requestLimit,
      requestsRemaining: Math.max(
        environment.requestLimit - environment.requestsUsed,
        0
      ),
      periodStart: environment.periodStart,
      periodEnd: environment.periodEnd,
      burstRequests: environment.burstRequests,
      burstLimit: environment.burstLimit,
      burstWindowStart: environment.burstWindowStart,
      burstWindowEnd: burstWindowEnd(environment.burstWindowStart),
      maxRecords: environment.maxRecords,
    });
  };

  reset = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const environment = getEnvironmentContext(res);
      await store.mutate(environment.id, [...environmentResources], state => {
        resetState(state);
        return {
          changed: [...environmentResources],
          value: undefined,
        };
      }, true);
      return res.json({
        message: 'Environment reset successfully',
        slug: environment.slug,
      });
    } catch (error) {
      return environmentError(error, res, next);
    }
  };
}
