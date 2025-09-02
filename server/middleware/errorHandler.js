export const errorHandler = (err, req, res, next) => {
  // Log for debugging during development
  console.error(err);

  // Determine status
  let status = 500;
  if (err.name === 'CastError') status = 404;
  else if (err.code === 11000) status = 409;
  else if (err.name === 'ValidationError') status = 400;
  else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') status = 401;

  // Build simple, student-friendly message
  const message = buildFriendlyMessage(err, req);

  res.status(status).json({
    success: false,
    message
  });
};

function buildFriendlyMessage(err, req) {
  // Duplicate key specific messages
  if (err && err.code === 11000) {
    const keys = Object.keys(err.keyValue || err.keyPattern || {});
    if (keys.includes('email')) return 'User already exists with this email';
    if (keys.includes('employeeId')) return 'Teacher already exists with this employee ID';
    if (keys.includes('code')) return 'Record already exists with this code';
    return 'Duplicate value entered';
  }

  if (err && err.name === 'ValidationError') {
    const msgs = Object.values(err.errors || {}).map(e => e.message);
    return msgs.length ? msgs.join(', ') : 'Validation failed';
  }

  if (err && err.name === 'CastError') {
    return 'Resource not found';
  }

  if (err && (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError')) {
    return 'Not authorized, token invalid or expired';
  }

  return err?.message || 'Server Error';
}
