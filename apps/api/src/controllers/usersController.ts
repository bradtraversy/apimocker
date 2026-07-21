import { Request, Response, NextFunction } from 'express';
import { GenericController } from './genericController';
import { prisma } from '../lib/prisma';

export class UsersController extends GenericController {
  constructor() {
    super(prisma, 'user');
  }

  // Search users by name, username, and email
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
      
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { username: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: 10,
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
        },
      });

      res.json({
        query: searchTerm,
        total: users.length,
        results: users,
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  };
} 