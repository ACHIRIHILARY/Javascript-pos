import { AppError } from "../utils/AppError.js";

export function rbacMiddleware(allowedRoles) {
  return (req, _res, next) => {
    const role = req.user?.role;
    if (!role || !allowedRoles.includes(role)) {
      return next(new AppError("Forbidden.", 403, "FORBIDDEN"));
    }
    next();
  };
}
