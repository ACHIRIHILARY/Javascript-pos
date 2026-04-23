import express from "express";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { authMiddleware } from "../../middleware/auth.js";
import { rbacMiddleware } from "../../middleware/rbac.js";
import { validateBody } from "../../middleware/validate.js";
import {
  AdjustStockSchema,
  CreateProductSchema,
  UpdateProductSchema,
} from "../../lib/validators/product.validator.js";
import { AppError } from "../../utils/AppError.js";

const router = express.Router();

router.use(authMiddleware);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { search, categoryId, lowStock } = req.query;
    let products = await prisma.product.findMany({
      where: {
        deletedAt: null,
        ...(search
          ? {
              OR: [
                { name: { contains: String(search), mode: "insensitive" } },
                { barcode: { contains: String(search), mode: "insensitive" } },
              ],
            }
          : {}),
        ...(categoryId ? { categoryId: String(categoryId) } : {}),
      },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });
    if (lowStock === "true") {
      products = products.filter(
        (product) => product.stock <= product.lowStockThreshold
      );
    }

    res.json({ success: true, data: products });
  })
);

router.post(
  "/",
  rbacMiddleware(["OWNER", "ADMIN"]),
  validateBody(CreateProductSchema),
  asyncHandler(async (req, res) => {
    const product = await prisma.product.create({
      data: req.validatedBody,
    });
    res.status(201).json({ success: true, data: product });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: {
        category: true,
        stockMovements: {
          take: 50,
          orderBy: { createdAt: "desc" },
          include: { user: { select: { id: true, name: true, role: true } } },
        },
      },
    });
    if (!product) {
      throw new AppError("Product not found.", 404, "PRODUCT_NOT_FOUND");
    }
    res.json({ success: true, data: product });
  })
);

router.patch(
  "/:id",
  rbacMiddleware(["OWNER", "ADMIN"]),
  validateBody(UpdateProductSchema),
  asyncHandler(async (req, res) => {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: req.validatedBody,
    });
    res.json({ success: true, data: product });
  })
);

router.delete(
  "/:id",
  rbacMiddleware(["OWNER", "ADMIN"]),
  asyncHandler(async (req, res) => {
    await prisma.product.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });
    res.json({ success: true, data: { message: "Product soft-deleted." } });
  })
);

router.post(
  "/:id/adjust",
  rbacMiddleware(["OWNER", "ADMIN"]),
  validateBody(AdjustStockSchema),
  asyncHandler(async (req, res) => {
    const { quantity, reason } = req.validatedBody;
    const productId = req.params.id;
    const userId = req.user.id;

    const updatedProduct = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
      });
      if (!product || product.deletedAt) {
        throw new AppError("Product not found.", 404, "PRODUCT_NOT_FOUND");
      }

      if (product.stock + quantity < 0) {
        throw new AppError(
          "Adjustment would result in negative stock.",
          409,
          "NEGATIVE_STOCK"
        );
      }

      const nextProduct = await tx.product.update({
        where: { id: productId },
        data: { stock: { increment: quantity } },
      });

      await tx.stockMovement.create({
        data: {
          productId,
          userId,
          type: "ADJUSTMENT",
          quantity,
          reason,
        },
      });

      return nextProduct;
    });

    res.json({ success: true, data: updatedProduct });
  })
);

export default router;
