import { Router, Request, Response, NextFunction } from 'express';
import { GenericController } from '../controllers/genericController';
import { prisma } from '../lib/prisma';
import { validateUser } from '../middleware/validation';

const router = Router();

// Initialize generic controller for users
const userController = new GenericController(prisma, 'user');

// GET /users - Get all users
router.get('/', userController.getAll);

// GET /users/:id - Get single user
router.get('/:id', userController.getById);

// GET /users/:id/posts - Get user's posts
router.get('/:id/posts', (req: Request, res: Response, next: NextFunction) => {
  userController.getRelated(req, res, next, 'post', 'userId');
});

// GET /users/:id/todos - Get user's todos
router.get('/:id/todos', (req: Request, res: Response, next: NextFunction) => {
  userController.getRelated(req, res, next, 'todo', 'userId');
});

// POST /users - Create user
router.post('/', validateUser, userController.create);

// PUT /users/:id - Update user
router.put('/:id', validateUser, userController.update);

// DELETE /users/:id - Delete user
router.delete('/:id', userController.delete);

export default router;
