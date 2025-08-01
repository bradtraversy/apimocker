import { Router } from 'express';

const router = Router();

// Error simulation endpoints (for testing error handling)
router.get('/404', (_req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'This endpoint simulates a 404 error for testing purposes',
  });
});

router.get('/500', (_req, res) => {
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'This endpoint simulates a 500 error for testing purposes',
  });
});

router.get('/timeout', (_req, res) => {
  // Simulate a timeout by not responding
  // This will eventually timeout the request
});

router.get('/validation', (_req, res) => {
  res.status(400).json({
    error: 'Validation Error',
    message: 'This endpoint simulates a validation error for testing purposes',
    details: [
      {
        type: 'field',
        value: 'invalid_value',
        msg: 'This is a simulated validation error',
        path: 'testField',
        location: 'body',
      },
    ],
  });
});

export default router; 