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

  // Search posts by title and body
  search = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { q, _delay } = req.query;
      
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
      
      const posts = await prisma.post.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { body: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: 10,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      });

      res.json({
        query: searchTerm,
        total: posts.length,
        results: posts,
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  };
} 