import { logger } from "../lib/logger.js";

export function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;
  const code = err.code || "INTERNAL_ERROR";
  const message = err.message || "An unexpected error occurred.";

  logger.error("request_error", {
    statusCode,
    code,
    message,
    stack: err.stack,
  });

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}
