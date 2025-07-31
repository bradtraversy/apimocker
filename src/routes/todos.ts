import { Router } from 'express';
import { GenericController } from '../controllers/genericController';
import { prisma } from '../index';
import { validateTodo } from '../middleware/validation';

const router = Router();

// Initialize generic controller for todos
const todoController = new GenericController(prisma, 'todo', {
  user: {
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
    },
  },
});

// GET /todos - Get all todos
router.get('/', todoController.getAll);

// GET /todos/:id - Get single todo
router.get('/:id', todoController.getById);

// POST /todos - Create todo
router.post('/', validateTodo, todoController.create);

// PUT /todos/:id - Update todo
router.put('/:id', validateTodo, todoController.update);

// DELETE /todos/:id - Delete todo
router.delete('/:id', todoController.delete);

export default router; 