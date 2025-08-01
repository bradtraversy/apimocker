import { Router } from 'express';
import { PostsController } from '../controllers/postsController';
import { validatePost } from '../middleware/validation';

const router = Router();
const postsController = new PostsController();

// GET /posts - Get all posts
router.get('/', postsController.getAll);

// Search posts (must come before /:id route to avoid conflicts)
router.get('/search', postsController.search);

// GET /posts/:id - Get single post
router.get('/:id', postsController.getById);

// POST /posts - Create post
router.post('/', validatePost, postsController.create);

// PUT /posts/:id - Update post
router.put('/:id', validatePost, postsController.update);

// PATCH /posts/:id - Partial update post
router.patch('/:id', validatePost, postsController.update);

// DELETE /posts/:id - Delete post
router.delete('/:id', postsController.delete);

export default router;
