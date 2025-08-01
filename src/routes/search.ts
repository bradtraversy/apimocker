import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

const router = Router();

// Global search across multiple resources
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, type, _delay } = req.query;
    
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
    const searchType = type as string || 'all'; // all, users, posts, todos, comments

    const results: any = {
      query: searchTerm,
      type: searchType,
      total: 0,
      results: {},
    };

    // Search users
    if (searchType === 'all' || searchType === 'users') {
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
      results.results.users = users;
      results.total += users.length;
    }

    // Search posts
    if (searchType === 'all' || searchType === 'posts') {
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
      results.results.posts = posts;
      results.total += posts.length;
    }

    // Search todos
    if (searchType === 'all' || searchType === 'todos') {
      const todos = await prisma.todo.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
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
      results.results.todos = todos;
      results.total += todos.length;
    }

    // Search comments
    if (searchType === 'all' || searchType === 'comments') {
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
      results.results.comments = comments;
      results.total += comments.length;
    }

    logger.info(`Search performed for "${searchTerm}"`, { 
      type: searchType, 
      total: results.total 
    });

    res.json(results);
  } catch (error) {
    next(error);
  }
});

export default router; 