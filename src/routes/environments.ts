import { Router } from 'express';
import { EnvironmentController } from '../controllers/environmentController';
import {
  requireEnvironmentAccess,
  requireManagementAccess,
} from '../middleware/environmentAccess';
import {
  validateComment,
  validateLike,
  validatePost,
  validateTodo,
  validateUser,
} from '../middleware/validation';

const router = Router({ mergeParams: true });
const controller = new EnvironmentController();

router.use(requireEnvironmentAccess);

router.get('/usage', controller.usage);
router.post('/reset', requireManagementAccess, controller.reset);

router.get('/users/search', controller.search('users'));
router.get('/users', controller.list('users'));
router.get('/users/:id/posts', controller.getRelated('posts'));
router.get('/users/:id/todos', controller.getRelated('todos'));
router.get('/users/:id', controller.getById('users'));
router.post('/users', validateUser, controller.create('users'));
router.put('/users/:id', validateUser, controller.update('users'));
router.patch('/users/:id', validateUser, controller.update('users'));
router.delete('/users/:id', controller.delete('users'));

router.get('/posts/search', controller.search('posts'));
router.get('/posts', controller.list('posts'));
router.get('/posts/:id/likes', controller.getLikes);
router.post('/posts/:id/likes', validateLike, controller.addLike);
router.get('/posts/:id', controller.getById('posts'));
router.post('/posts', validatePost, controller.create('posts'));
router.put('/posts/:id', validatePost, controller.update('posts'));
router.patch('/posts/:id', validatePost, controller.update('posts'));
router.delete('/posts/:id', controller.delete('posts'));

router.get('/todos/search', controller.search('todos'));
router.get('/todos', controller.list('todos'));
router.get('/todos/:id', controller.getById('todos'));
router.post('/todos', validateTodo, controller.create('todos'));
router.put('/todos/:id', validateTodo, controller.update('todos'));
router.patch('/todos/:id', validateTodo, controller.update('todos'));
router.delete('/todos/:id', controller.delete('todos'));

router.get('/comments/search', controller.search('comments'));
router.get('/comments', controller.list('comments'));
router.get('/comments/:id', controller.getById('comments'));
router.post('/comments', validateComment, controller.create('comments'));
router.put('/comments/:id', validateComment, controller.update('comments'));
router.patch('/comments/:id', validateComment, controller.update('comments'));
router.delete('/comments/:id', controller.delete('comments'));

export default router;
