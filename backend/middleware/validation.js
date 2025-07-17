const { validationResult, body } = require('express-validator');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

/**
 * Validation rules for user registration
 */
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  handleValidationErrors
];

/**
 * Validation rules for user login
 */
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

/**
 * Validation rules for poll creation
 */
const createPollValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  
  body('options')
    .isArray({ min: 2, max: 10 })
    .withMessage('Poll must have between 2 and 10 options'),
  
  body('options.*')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Option text must be between 1 and 200 characters'),
  
  body('closing_date')
    .isISO8601()
    .withMessage('Closing date must be a valid date')
    .custom((value) => {
      // Add 1 minute buffer to allow for slight time differences
      const selectedDate = new Date(value);
      const now = new Date();
      const bufferTime = new Date(now.getTime() + 60000);
      
      if (selectedDate <= bufferTime) {
        throw new Error('Closing date must be in the future');
      }
      return true;
    }),
  
  handleValidationErrors
];

/**
 * Validation rules for poll updates
 */
const updatePollValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  
  body('options')
    .optional()
    .isArray({ min: 2, max: 10 })
    .withMessage('Poll must have between 2 and 10 options'),
  
  body('options.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Option text must be between 1 and 200 characters'),
  
  body('closing_date')
    .optional()
    .isISO8601()
    .withMessage('Closing date must be a valid date')
    .custom((value) => {
      // For updates, allow the same date if it's not in the past
      const selectedDate = new Date(value);
      const now = new Date();
      // Add 1 minute buffer to allow for slight time differences
      const bufferTime = new Date(now.getTime() + 60000);
      
      if (selectedDate <= bufferTime) {
        throw new Error('Closing date must be in the future');
      }
      return true;
    }),
  
  handleValidationErrors
];

/**
 * Validation rules for voting
 */
const voteValidation = [
  body('poll_id')
    .notEmpty()
    .withMessage('Poll ID is required')
    .isInt({ min: 1 })
    .withMessage('Invalid poll ID'),
  
  body('selected_option')
    .trim()
    .notEmpty()
    .withMessage('Selected option is required'),
  
  handleValidationErrors
];

/**
 * Validation rules for user profile updates
 */
const updateProfileValidation = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  registerValidation,
  loginValidation,
  createPollValidation,
  updatePollValidation,
  voteValidation,
  updateProfileValidation
}; 
