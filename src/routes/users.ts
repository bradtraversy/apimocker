import { Router, Request, Response, NextFunction } from 'express';
import { UsersController } from '../controllers/usersController';
import { validateUser } from '../middleware/validation';

const router = Router();
const usersController = new UsersController();

// Search users
router.get('/search', usersController.search);

// GET /users - Get all users
router.get('/', usersController.getAll);

// GET /users/:id - Get single user
router.get('/:id', usersController.getById);

// GET /users/:id/posts - Get user's posts
router.get('/:id/posts', (req: Request, res: Response, next: NextFunction) => {
  usersController.getRelated(req, res, next, 'post', 'userId');
});

// GET /users/:id/todos - Get user's todos
router.get('/:id/todos', (req: Request, res: Response, next: NextFunction) => {
  usersController.getRelated(req, res, next, 'todo', 'userId');
});

// POST /users - Create user
router.post('/', validateUser, usersController.create);

// PUT /users/:id - Update user
router.put('/:id', validateUser, usersController.update);

// DELETE /users/:id - Delete user
router.delete('/:id', usersController.delete);

export default router;
