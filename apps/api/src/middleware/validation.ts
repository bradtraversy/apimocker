import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

// Helper function to handle validation errors
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid input data',
      details: errors.array(),
    });
  }
  return next();
};

const userValidators = (partial = false) => [
  (partial ? body('name').optional() : body('name'))
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name is required and must be between 1 and 100 characters'),
  
  (partial ? body('username').optional() : body('username'))
    .trim()
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-50 characters and contain only letters, numbers, and underscores'),
  
  (partial ? body('email').optional() : body('email'))
    .isEmail()
    .normalizeEmail()
    .withMessage('Must be a valid email address'),
  
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Must be a valid phone number'),
  
  body('website')
    .optional()
    .isURL()
    .withMessage('Must be a valid URL'),
  
  body('address')
    .optional()
    .isObject()
    .withMessage('Address must be an object'),
  
  body('company')
    .optional()
    .isObject()
    .withMessage('Company must be an object'),
  
  handleValidationErrors,
];

export const validateUser = userValidators();
export const validateUserPatch = userValidators(true);

const postValidators = (partial = false) => [
  (partial ? body('title').optional() : body('title'))
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title is required and must be between 1 and 200 characters'),
  
  (partial ? body('body').optional() : body('body'))
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Body is required and must be between 1 and 5000 characters'),
  
  body('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('userId must be a positive integer'),
  
  handleValidationErrors,
];

export const validatePost = postValidators();
export const validatePostPatch = postValidators(true);

const todoValidators = (partial = false) => [
  (partial ? body('title').optional() : body('title'))
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title is required and must be between 1 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description must be between 1 and 1000 characters'),
  
  body('completed')
    .optional()
    .isBoolean()
    .withMessage('Completed must be a boolean value'),
  
  body('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('userId must be a positive integer'),
  
  handleValidationErrors,
];

export const validateTodo = todoValidators();
export const validateTodoPatch = todoValidators(true);

// userId is the only optional field in a like body.
export const validateLike = [
  body('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('userId must be a positive integer'),

  handleValidationErrors,
];

const commentValidators = (partial = false) => [
  (partial ? body('name').optional() : body('name'))
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name is required and must be between 1 and 100 characters'),
  
  (partial ? body('email').optional() : body('email'))
    .isEmail()
    .normalizeEmail()
    .withMessage('Must be a valid email address'),
  
  (partial ? body('body').optional() : body('body'))
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Body is required and must be between 1 and 1000 characters'),
  
  (partial ? body('postId').optional() : body('postId'))
    .isInt({ min: 1 })
    .withMessage('postId must be a positive integer'),
  
  handleValidationErrors,
];

export const validateComment = commentValidators();
export const validateCommentPatch = commentValidators(true);
