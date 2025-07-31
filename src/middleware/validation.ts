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

// User validation rules
export const validateUser = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name is required and must be between 1 and 100 characters'),
  
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-50 characters and contain only letters, numbers, and underscores'),
  
  body('email')
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

// Post validation rules
export const validatePost = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title is required and must be between 1 and 200 characters'),
  
  body('body')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Body is required and must be between 1 and 5000 characters'),
  
  body('userId')
    .isInt({ min: 1 })
    .withMessage('userId must be a positive integer'),
  
  handleValidationErrors,
];

// Todo validation rules
export const validateTodo = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title is required and must be between 1 and 200 characters'),
  
  body('completed')
    .optional()
    .isBoolean()
    .withMessage('Completed must be a boolean value'),
  
  body('userId')
    .isInt({ min: 1 })
    .withMessage('userId must be a positive integer'),
  
  handleValidationErrors,
]; 