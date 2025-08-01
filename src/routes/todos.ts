import { Router } from 'express';
import { TodosController } from '../controllers/todosController';
import { validateTodo } from '../middleware/validation';

const router = Router();
const todosController = new TodosController();

// Search todos
router.get('/search', todosController.search);

// GET /todos - Get all todos
router.get('/', todosController.getAll);

// GET /todos/:id - Get single todo
router.get('/:id', todosController.getById);

// POST /todos - Create todo
router.post('/', validateTodo, todosController.create);

// PUT /todos/:id - Update todo
router.put('/:id', validateTodo, todosController.update);

// PATCH /todos/:id - Partial update todo
router.patch('/:id', validateTodo, todosController.update);

// DELETE /todos/:id - Delete todo
router.delete('/:id', todosController.delete);

export default router;
