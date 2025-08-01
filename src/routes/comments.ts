import { Router } from 'express';
import { GenericController } from '../controllers/genericController';
import { prisma } from '../lib/prisma';
import { validateComment } from '../middleware/validation';

const router = Router();

// Initialize generic controller for comments
const commentController = new GenericController(prisma, 'comment', {
  post: {
    select: {
      id: true,
      title: true,
      userId: true,
    },
  },
});

// GET /comments - Get all comments
router.get('/', commentController.getAll);

// GET /comments/:id - Get single comment
router.get('/:id', commentController.getById);

// POST /comments - Create comment
router.post('/', validateComment, commentController.create);

// PUT /comments/:id - Update comment
router.put('/:id', validateComment, commentController.update);

// PATCH /comments/:id - Partial update comment
router.patch('/:id', validateComment, commentController.update);

// DELETE /comments/:id - Delete comment
router.delete('/:id', commentController.delete);

export default router; 