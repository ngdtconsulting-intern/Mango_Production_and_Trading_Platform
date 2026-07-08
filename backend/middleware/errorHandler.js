import logger from '../utils/logger.js';

export const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // Wrong MongoDB ID Error
  if (err.name === 'CastError') {
    const message = `Resource not found. Invalid: ${err.path}`;
    err.statusCode = 400;
    err.message = message;
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const message = `Duplicate field value entered`;
    err.statusCode = 409;
    err.message = message;
  }

  // JWT Error
  if (err.name === 'JsonWebTokenError') {
    const message = `JSON Web Token is invalid, try again`;
    err.statusCode = 401;
    err.message = message;
  }

  // JWT Expired Error
  if (err.name === 'TokenExpiredError') {
    const message = `JSON Web Token is expired, try again`;
    err.statusCode = 401;
    err.message = message;
  }

  // Validation Error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    err.statusCode = 422;
    err.message = message;
  }

  logger.error(`Error: ${err.message}`);

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default { globalErrorHandler, asyncHandler };