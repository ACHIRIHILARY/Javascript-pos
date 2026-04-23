import express from "express";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { authMiddleware } from "../../middleware/auth.js";
import { rbacMiddleware } from "../../middleware/rbac.js";
import { AppError } from "../../utils/AppError.js";

const router = express.Router();

router.use(authMiddleware);

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: "asc" },
    });
    res.json({ success: true, data: categories });
  })
);

router.post(
  "/",
  rbacMiddleware(["OWNER", "ADMIN"]),
  asyncHandler(async (req, res) => {
    const name = String(req.body?.name || "").trim();
    if (!name) {
      throw new AppError("Category name is required.", 400, "VALIDATION_ERROR");
    }

    const category = await prisma.category.create({
      data: { name },
    });
    res.status(201).json({ success: true, data: category });
  })
);

export default router;
