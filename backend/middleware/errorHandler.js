function notFound(req, res, next) {
  res.status(404);
  res.json({ message: `Not Found - ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  const status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(status).json({
    message: err?.message || 'Server Error',
    stack: process.env.NODE_ENV === 'production' ? undefined : (err?.stack || '')
  });
}

module.exports = { notFound, errorHandler };
