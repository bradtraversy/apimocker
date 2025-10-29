import { Request, Response, NextFunction } from 'express';
import { GenericController } from './genericController';
import { prisma } from '../lib/prisma';

export class PostsController extends GenericController {
  constructor() {
    super(prisma, 'post', {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
    });
  }

  // Search posts by title and body with sorting and limiting
  search = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { q, _delay, _sort, _order, _limit, _page } = req.query;
      
      // Handle response delay simulation
      const delay = Number(_delay || 0);
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      if (!q || typeof q !== 'string') {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Query parameter "q" is required',
        });
      }

      const searchTerm = q.trim();
      
      // Handle sorting and limiting
      const sortField = (_sort as string) || 'id';
      const sortOrder = (_order as string) || 'asc';
      const limit = Number(_limit || 10);
      const page = Number(_page || 1);
      const skip = (page - 1) * limit;
      
      const orderBy = { [sortField]: sortOrder };
      
      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          where: {
            OR: [
              { title: { contains: searchTerm, mode: 'insensitive' } },
              { body: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
          take: limit,
          skip,
          orderBy,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        }),
        prisma.post.count({
          where: {
            OR: [
              { title: { contains: searchTerm, mode: 'insensitive' } },
              { body: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
        query: searchTerm,
        total,
        totalPages,
        page,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        results: posts,
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  };

  // GET /posts/:id/likes - Get number of likes for a post
  getLikes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const postId = parseInt(id || '0');

      if (isNaN(postId)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid post ID',
        });
      }

      // Check if post exists
      const post = await prisma.post.findUnique({
        where: { id: postId },
      });

      if (!post) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Post with id ${postId} not found`,
        });
      }

      // Count likes for the post
      const likesCount = await prisma.like.count({
        where: { postId },
      });

      res.json({
        postId,
        likes: likesCount,
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  };

  // POST /posts/:id/likes - Add a like to a post
  addLike = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const postId = parseInt(id || '0');
      const { userId } = req.body;

      if (isNaN(postId)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid post ID',
        });
      }

      // Check if post exists
      const post = await prisma.post.findUnique({
        where: { id: postId },
      });

      if (!post) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Post with id ${postId} not found`,
        });
      }

      // Create the like
      const like = await prisma.like.create({
        data: {
          postId,
          userId: userId ? parseInt(userId) : null,
        },
      });

      // Get updated likes count
      const likesCount = await prisma.like.count({
        where: { postId },
      });

      res.status(201).json({
        message: 'Like added successfully',
        like,
        totalLikes: likesCount,
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  };
} 