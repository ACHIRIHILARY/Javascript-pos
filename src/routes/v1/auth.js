import express from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateBody } from "../../middleware/validate.js";
import { LoginSchema } from "../../lib/validators/auth.validator.js";
import { signToken } from "../../lib/auth.js";
import { AppError } from "../../utils/AppError.js";
import { authMiddleware } from "../../middleware/auth.js";

const router = express.Router();

router.post(
  "/login",
  validateBody(LoginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.validatedBody;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.active) {
      throw new AppError("Invalid credentials.", 401, "INVALID_CREDENTIALS");
    }

    const matches = await bcrypt.compare(password, user.password);
    if (!matches) {
      throw new AppError("Invalid credentials.", 401, "INVALID_CREDENTIALS");
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          active: user.active,
        },
      },
    });
  })
);

router.post(
  "/refresh",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const token = signToken({
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      name: req.user.name,
    });

    res.json({
      success: true,
      data: { token },
    });
  })
);

router.post(
  "/logout",
  authMiddleware,
  asyncHandler(async (_req, res) => {
    res.json({
      success: true,
      data: { message: "Logged out." },
    });
  })
);

export default router;
