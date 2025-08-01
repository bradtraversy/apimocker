import { Router } from 'express';
import { CommentsController } from '../controllers/commentsController';
import { validateComment } from '../middleware/validation';

const router = Router();
const commentsController = new CommentsController();

// Search comments
router.get('/search', commentsController.search);

// GET /comments - Get all comments
router.get('/', commentsController.getAll);

// GET /comments/:id - Get single comment
router.get('/:id', commentsController.getById);

// POST /comments - Create comment
router.post('/', validateComment, commentsController.create);

// PUT /comments/:id - Update comment
router.put('/:id', validateComment, commentsController.update);

// PATCH /comments/:id - Partial update comment
router.patch('/:id', validateComment, commentsController.update);

// DELETE /comments/:id - Delete comment
router.delete('/:id', commentsController.delete);

export default router; 