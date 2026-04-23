import express from "express";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { authMiddleware } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { CreateSaleSchema } from "../../lib/validators/sale.validator.js";
import { createSale } from "../../lib/services/sale.service.js";
import { AppError } from "../../utils/AppError.js";

const router = express.Router();

router.use(authMiddleware);

router.post(
  "/",
  validateBody(CreateSaleSchema),
  asyncHandler(async (req, res) => {
    const sale = await createSale(req.validatedBody, req.user.id);
    res.status(201).json({ success: true, data: sale });
  })
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const skip = (page - 1) * limit;

    const [total, sales] = await Promise.all([
      prisma.sale.count(),
      prisma.sale.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          saleItems: true,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        items: sales,
      },
    });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const sale = await prisma.sale.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        saleItems: {
          include: {
            product: { select: { id: true, name: true, barcode: true } },
          },
        },
      },
    });
    if (!sale) {
      throw new AppError("Sale not found.", 404, "SALE_NOT_FOUND");
    }
    res.json({ success: true, data: sale });
  })
);

export default router;
