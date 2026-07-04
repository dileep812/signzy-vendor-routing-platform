export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const status = statusCode >= 500 ? "FAILED" : "ERROR";

  // Specific format for RoutingError (POST /route errors)
  if (err.name === 'RoutingError' || err.statusCode === 502) {
    return res.status(502).json({
      status: "FAILED",
      vendorUsed: "NONE",
      routingReason: err.message
    });
  }

  // General standard format
  return res.status(statusCode).json({
    status,
    message: err.message,
    ...(err.extra || {})
  });
}
