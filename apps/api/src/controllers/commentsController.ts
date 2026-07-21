import { Request, Response, NextFunction } from 'express';
import { GenericController } from './genericController';
import { prisma } from '../lib/prisma';

export class CommentsController extends GenericController {
  constructor() {
    super(prisma, 'comment', {
      post: {
        select: {
          id: true,
          title: true,
        },
      },
    });
  }

  // Search comments by name, email, and body
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
      
      const comments = await prisma.comment.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
            { body: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: 10,
        include: {
          post: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      res.json({
        query: searchTerm,
        total: comments.length,
        results: comments,
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  };
} 