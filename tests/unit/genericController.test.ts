import { Request, Response } from 'express';
import { GenericController } from '../../src/controllers/genericController';

const mockPrisma = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  post: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  todo: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
} as any;

const relations = {
  user: {
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
    },
  },
};

const makeRequest = (values: Partial<Request> = {}) => ({
  query: {},
  params: {},
  body: {},
  ...values,
}) as Request;

describe('GenericController', () => {
  let controller: GenericController;
  let response: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new GenericController(mockPrisma, 'user');
    next = jest.fn();
    response = {
      set: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  describe('getAll', () => {
    it('returns records with default pagination and sorting', async () => {
      const users = [{ id: 1, name: 'John Doe' }];
      mockPrisma.user.findMany.mockResolvedValue(users);
      mockPrisma.user.count.mockResolvedValue(1);

      await controller.getAll(makeRequest(), response as Response, next);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        include: undefined,
        orderBy: { id: 'asc' },
      });
      expect(response.json).toHaveBeenCalledWith({
        data: users,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      });
    });

    it.each([
      [{ _page: 'invalid', _limit: 'invalid' }, 1, 10, 0],
      [{ _page: '0', _limit: '-5' }, 1, 10, 0],
      [{ _page: '2', _limit: '500' }, 2, 100, 100],
    ])(
      'normalizes pagination values',
      async (query, expectedPage, expectedLimit, expectedSkip) => {
        mockPrisma.user.findMany.mockResolvedValue([]);
        mockPrisma.user.count.mockResolvedValue(0);

        await controller.getAll(
          makeRequest({ query }),
          response as Response,
          next
        );

        expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            skip: expectedSkip,
            take: expectedLimit,
          })
        );
        expect(response.json).toHaveBeenCalledWith(
          expect.objectContaining({
            pagination: expect.objectContaining({
              page: expectedPage,
              limit: expectedLimit,
            }),
          })
        );
      }
    );

    it('builds typed filters and passes configured relations', async () => {
      controller = new GenericController(mockPrisma, 'post', relations);
      mockPrisma.post.findMany.mockResolvedValue([]);
      mockPrisma.post.count.mockResolvedValue(0);

      await controller.getAll(
        makeRequest({ query: { userId: '2', title_like: 'api' } }),
        response as Response,
        next
      );

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
        where: {
          userId: 2,
          title: { contains: 'api', mode: 'insensitive' },
        },
        skip: 0,
        take: 10,
        include: relations,
        orderBy: { id: 'asc' },
      });
    });

    it('forwards database errors', async () => {
      const error = new Error('Database error');
      mockPrisma.user.findMany.mockRejectedValue(error);
      mockPrisma.user.count.mockResolvedValue(0);

      await controller.getAll(makeRequest(), response as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getById', () => {
    it('loads a record by numeric ID', async () => {
      const user = { id: 1, name: 'John Doe' };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      await controller.getById(
        makeRequest({ params: { id: '1' } }),
        response as Response,
        next
      );

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: undefined,
      });
      expect(response.json).toHaveBeenCalledWith(user);
    });

    it('returns 404 when the record does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await controller.getById(
        makeRequest({ params: { id: '999' } }),
        response as Response,
        next
      );

      expect(response.status).toHaveBeenCalledWith(404);
      expect(response.json).toHaveBeenCalledWith({
        error: 'Not Found',
        message: 'user with id 999 not found',
      });
    });

    it('forwards invalid ID validation to the centralized error handler', async () => {
      const error = Object.assign(new Error('Invalid ID'), {
        name: 'PrismaClientValidationError',
      });
      mockPrisma.user.findUnique.mockRejectedValue(error);

      await controller.getById(
        makeRequest({ params: { id: 'invalid' } }),
        response as Response,
        next
      );

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: Number.NaN },
        include: undefined,
      });
      expect(next).toHaveBeenCalledWith(error);
    });

    it('passes relation selection to Prisma', async () => {
      controller = new GenericController(mockPrisma, 'post', relations);
      mockPrisma.post.findUnique.mockResolvedValue({ id: 1, userId: 1 });

      await controller.getById(
        makeRequest({ params: { id: '1' } }),
        response as Response,
        next
      );

      expect(mockPrisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: relations,
      });
    });
  });

  describe('mutations', () => {
    it('creates a record', async () => {
      const user = { id: 1, name: 'John Doe' };
      mockPrisma.user.create.mockResolvedValue(user);

      await controller.create(
        makeRequest({ body: { name: 'John Doe' } }),
        response as Response,
        next
      );

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: { name: 'John Doe' },
        include: undefined,
      });
      expect(response.status).toHaveBeenCalledWith(201);
    });

    it('updates a record without injecting omitted fields', async () => {
      mockPrisma.post.update.mockResolvedValue({ id: 1, title: 'Updated' });
      controller = new GenericController(mockPrisma, 'post', relations);

      await controller.update(
        makeRequest({ params: { id: '1' }, body: { title: 'Updated' } }),
        response as Response,
        next
      );

      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { title: 'Updated' },
        include: relations,
      });
    });

    it('forwards Prisma not-found errors during updates', async () => {
      const error = Object.assign(new Error('Record not found'), {
        name: 'PrismaClientKnownRequestError',
        code: 'P2025',
      });
      mockPrisma.user.update.mockRejectedValue(error);

      await controller.update(
        makeRequest({ params: { id: '999' }, body: { name: 'Updated' } }),
        response as Response,
        next
      );

      expect(next).toHaveBeenCalledWith(error);
    });

    it('deletes a record with an empty 204 response', async () => {
      mockPrisma.user.delete.mockResolvedValue({ id: 1 });

      await controller.delete(
        makeRequest({ params: { id: '1' } }),
        response as Response,
        next
      );

      expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(response.status).toHaveBeenCalledWith(204);
      expect(response.send).toHaveBeenCalledWith();
    });

    it('forwards Prisma not-found errors during deletes', async () => {
      const error = Object.assign(new Error('Record not found'), {
        name: 'PrismaClientKnownRequestError',
        code: 'P2025',
      });
      mockPrisma.user.delete.mockRejectedValue(error);

      await controller.delete(
        makeRequest({ params: { id: '999' } }),
        response as Response,
        next
      );

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getRelated', () => {
    it('queries the relation directly with normalized pagination', async () => {
      const posts = [{ id: 1, userId: 2 }];
      mockPrisma.post.findMany.mockResolvedValue(posts);
      mockPrisma.post.count.mockResolvedValue(1);

      await controller.getRelated(
        makeRequest({
          params: { id: '2' },
          query: { _page: '-1', _limit: 'invalid' },
        }),
        response as Response,
        next,
        'post',
        'userId'
      );

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
        where: { userId: 2 },
        skip: 0,
        take: 10,
        include: relations,
        orderBy: { id: 'asc' },
      });
      expect(response.json).toHaveBeenCalledWith({
        data: posts,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      });
    });
  });
});
