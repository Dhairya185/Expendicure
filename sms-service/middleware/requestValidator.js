/**
 * middleware/requestValidator.js
 * Validates and sanitizes incoming webhook POST body fields.
 * Uses express-validator.
 */

const { body, validationResult } = require('express-validator');

// Validation rules for POST /api/sms-webhook
const validateWebhookBody = [
  body('message')
    .notEmpty().withMessage('message is required')
    .isString().withMessage('message must be a string')
    .isLength({ min: 5, max: 2000 }).withMessage('message length must be between 5 and 2000 chars')
    .trim()
    .escape(),

  body('sender')
    .optional()
    .isString()
    .isLength({ max: 50 })
    .trim()
    .escape(),

  body('timestamp')
    .optional()
    .isISO8601().withMessage('timestamp must be a valid ISO8601 date'),

  body('student_id')
    .optional()
    .isInt({ min: 1 }).withMessage('student_id must be a positive integer'),
];

// Middleware to check for validation errors
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
}

module.exports = { validateWebhookBody, handleValidationErrors };
