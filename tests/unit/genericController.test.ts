import { Request, Response } from 'express';
import { GenericController } from '../../src/controllers/genericController';
import { PrismaClient } from '@prisma/client';

// Mock Prisma client
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

describe('GenericController', () => {
  let controller: GenericController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    controller = new GenericController(mockPrisma, 'user');
    mockNext = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('getAll', () => {
    it('should return all users with pagination', async () => {
      const mockUsers = [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      mockPrisma.user.count.mockResolvedValue(2);

      mockRequest = {
        query: { _page: '1', _limit: '10' },
      };

      await controller.getAll(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
      });
      expect(mockPrisma.user.count).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: mockUsers,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      });
    });

    it('should handle filtering by userId for posts', async () => {
      controller = new GenericController(mockPrisma, 'post');

      const mockPosts = [
        { id: 1, title: 'Post 1', userId: 1 },
        { id: 2, title: 'Post 2', userId: 1 },
      ];

      mockPrisma.post.findMany.mockResolvedValue(mockPosts);
      mockPrisma.post.count.mockResolvedValue(2);

      mockRequest = {
        query: { userId: '1', _page: '1', _limit: '10' },
      };

      await controller.getAll(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        skip: 0,
        take: 10,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
            },
          },
        },
      });
    });

    it('should handle filtering by completed status for todos', async () => {
      controller = new GenericController(mockPrisma, 'todo');

      const mockTodos = [{ id: 1, title: 'Todo 1', completed: true }];

      mockPrisma.todo.findMany.mockResolvedValue(mockTodos);
      mockPrisma.todo.count.mockResolvedValue(1);

      mockRequest = {
        query: { completed: 'true', _page: '1', _limit: '10' },
      };

      await controller.getAll(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrisma.todo.findMany).toHaveBeenCalledWith({
        where: { completed: true },
        skip: 0,
        take: 10,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
            },
          },
        },
      });
    });

    it('should handle invalid pagination parameters', async () => {
      const mockUsers = [{ id: 1, name: 'John Doe' }];
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      mockPrisma.user.count.mockResolvedValue(1);

      mockRequest = {
        query: { _page: 'invalid', _limit: 'invalid' },
      };

      await controller.getAll(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10, // Default values
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockPrisma.user.findMany.mockRejectedValue(error);

      mockRequest = {
        query: {},
      };

      await controller.getAll(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getById', () => {
    it('should return a user by ID', async () => {
      const mockUser = { id: 1, name: 'John Doe', email: 'john@example.com' };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      mockRequest = {
        params: { id: '1' },
      };

      await controller.getById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockUser);
    });

    it('should return 404 for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      mockRequest = {
        params: { id: '999' },
      };

      await controller.getById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Not Found',
        message: 'User not found',
      });
    });

    it('should handle invalid ID format', async () => {
      mockRequest = {
        params: { id: 'invalid' },
      };

      await controller.getById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: 'Invalid ID format',
      });
    });

    it('should include user information for posts', async () => {
      controller = new GenericController(mockPrisma, 'post');

      const mockPost = {
        id: 1,
        title: 'Test Post',
        userId: 1,
        user: { id: 1, name: 'John Doe' },
      };

      mockPrisma.post.findUnique.mockResolvedValue(mockPost);

      mockRequest = {
        params: { id: '1' },
      };

      await controller.getById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
            },
          },
        },
      });
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const userData = { name: 'John Doe', email: 'john@example.com' };
      const createdUser = { id: 1, ...userData };

      mockPrisma.user.create.mockResolvedValue(createdUser);

      mockRequest = {
        body: userData,
      };

      await controller.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: userData,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(createdUser);
    });

    it('should handle database errors during creation', async () => {
      const error = new Error('Database error');
      mockPrisma.user.create.mockRejectedValue(error);

      mockRequest = {
        body: { name: 'John Doe' },
      };

      await controller.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('update', () => {
    it('should update an existing user', async () => {
      const updateData = { name: 'Updated Name' };
      const updatedUser = {
        id: 1,
        name: 'Updated Name',
        email: 'john@example.com',
      };

      mockPrisma.user.update.mockResolvedValue(updatedUser);

      mockRequest = {
        params: { id: '1' },
        body: updateData,
      };

      await controller.update(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateData,
      });
      expect(mockResponse.json).toHaveBeenCalledWith(updatedUser);
    });

    it('should return 404 for non-existent user', async () => {
      const error = new Error('Record not found');
      (error as any).code = 'P2025';
      mockPrisma.user.update.mockRejectedValue(error);

      mockRequest = {
        params: { id: '999' },
        body: { name: 'Updated Name' },
      };

      await controller.update(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Not Found',
        message: 'User not found',
      });
    });

    it('should handle invalid ID format', async () => {
      mockRequest = {
        params: { id: 'invalid' },
        body: { name: 'Updated Name' },
      };

      await controller.update(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: 'Invalid ID format',
      });
    });
  });

  describe('delete', () => {
    it('should delete an existing user', async () => {
      const deletedUser = { id: 1, name: 'John Doe' };
      mockPrisma.user.delete.mockResolvedValue(deletedUser);

      mockRequest = {
        params: { id: '1' },
      };

      await controller.delete(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User deleted successfully',
      });
    });

    it('should return 404 for non-existent user', async () => {
      const error = new Error('Record not found');
      (error as any).code = 'P2025';
      mockPrisma.user.delete.mockRejectedValue(error);

      mockRequest = {
        params: { id: '999' },
      };

      await controller.delete(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Not Found',
        message: 'User not found',
      });
    });

    it('should handle invalid ID format', async () => {
      mockRequest = {
        params: { id: 'invalid' },
      };

      await controller.delete(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: 'Invalid ID format',
      });
    });
  });

  describe('getRelated', () => {
    it('should return related posts for a user', async () => {
      const mockPosts = [
        { id: 1, title: 'Post 1', userId: 1 },
        { id: 2, title: 'Post 2', userId: 1 },
      ];

      mockPrisma.post.findMany.mockResolvedValue(mockPosts);
      mockPrisma.post.count.mockResolvedValue(2);

      mockRequest = {
        params: { id: '1' },
        query: { _page: '1', _limit: '10' },
      };

      await controller.getRelated(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
        'post',
        'userId'
      );

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        skip: 0,
        take: 10,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
            },
          },
        },
      });
    });

    it('should return 404 for non-existent user when getting related', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      mockRequest = {
        params: { id: '999' },
      };

      await controller.getRelated(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
        'post',
        'userId'
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Not Found',
        message: 'User not found',
      });
    });
  });
});
