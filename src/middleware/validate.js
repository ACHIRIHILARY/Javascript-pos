import { AppError } from "../utils/AppError.js";

export function validateBody(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(
        new AppError(
          result.error.issues.map((issue) => issue.message).join("; "),
          400,
          "VALIDATION_ERROR"
        )
      );
    }
    req.validatedBody = result.data;
    next();
  };
}
