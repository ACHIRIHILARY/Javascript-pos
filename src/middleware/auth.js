import { verifyToken } from "../lib/auth.js";
import { AppError } from "../utils/AppError.js";

export function authMiddleware(req, _res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : undefined;

  if (!token) {
    return next(new AppError("Authentication token is required.", 401, "UNAUTHORIZED"));
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (_error) {
    next(new AppError("Invalid or expired token.", 401, "INVALID_TOKEN"));
  }
}
