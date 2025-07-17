/**
 * Success response helper
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {*} data - Response data
 */
const successResponse = (res, statusCode = 200, message = 'Success', data = null) => {
  const response = {
    success: true,
    message,
    ...(data && { data })
  };

  return res.status(statusCode).json(response);
};

/**
 * Error response helper
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {*} error - Error details (optional)
 */
const errorResponse = (res, statusCode = 500, message = 'Something went wrong', error = null) => {
  const response = {
    success: false,
    message,
    ...(error && process.env.NODE_ENV === 'development' && { error })
  };

  return res.status(statusCode).json(response);
};

/**
 * Validation error response helper
 * @param {Object} res - Express response object
 * @param {Array} errors - Validation errors array
 */
const validationErrorResponse = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors
  });
};

/**
 * Not found response helper
 * @param {Object} res - Express response object
 * @param {string} resource - Resource name
 */
const notFoundResponse = (res, resource = 'Resource') => {
  return res.status(404).json({
    success: false,
    message: `${resource} not found`
  });
};

/**
 * Unauthorized response helper
 * @param {Object} res - Express response object
 * @param {string} message - Unauthorized message
 */
const unauthorizedResponse = (res, message = 'Unauthorized') => {
  return res.status(401).json({
    success: false,
    message
  });
};

/**
 * Forbidden response helper
 * @param {Object} res - Express response object
 * @param {string} message - Forbidden message
 */
const forbiddenResponse = (res, message = 'Access denied') => {
  return res.status(403).json({
    success: false,
    message
  });
};

module.exports = {
  successResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse
}; 
