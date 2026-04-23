import express from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { authMiddleware } from "../../middleware/auth.js";
import { rbacMiddleware } from "../../middleware/rbac.js";
import { validateBody } from "../../middleware/validate.js";
import {
  CreateUserSchema,
  UpdateUserSchema,
} from "../../lib/validators/user.validator.js";

const router = express.Router();

router.use(authMiddleware, rbacMiddleware(["OWNER", "ADMIN"]));

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });
    res.json({ success: true, data: users });
  })
);

router.post(
  "/",
  validateBody(CreateUserSchema),
  asyncHandler(async (req, res) => {
    const { password, ...rest } = req.validatedBody;
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { ...rest, password: hashedPassword },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });
    res.status(201).json({ success: true, data: user });
  })
);

router.patch(
  "/:id",
  validateBody(UpdateUserSchema),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: req.validatedBody,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });
    res.json({ success: true, data: user });
  })
);

export default router;
