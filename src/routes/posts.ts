import { Router } from 'express';
import { GenericController } from '../controllers/genericController';
import { prisma } from '../index';
import { validatePost } from '../middleware/validation';

const router = Router();

// Initialize generic controller for posts
const postController = new GenericController(prisma, 'post', {
  user: {
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
    },
  },
});

// GET /posts - Get all posts
router.get('/', postController.getAll);

// GET /posts/:id - Get single post
router.get('/:id', postController.getById);

// POST /posts - Create post
router.post('/', validatePost, postController.create);

// PUT /posts/:id - Update post
router.put('/:id', validatePost, postController.update);

// DELETE /posts/:id - Delete post
router.delete('/:id', postController.delete);

export default router; 