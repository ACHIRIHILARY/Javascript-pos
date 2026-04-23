import express from "express";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { authMiddleware } from "../../middleware/auth.js";
import { rbacMiddleware } from "../../middleware/rbac.js";

const router = express.Router();

router.use(authMiddleware, rbacMiddleware(["OWNER", "ADMIN"]));

router.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const period = String(req.query.period || "day");
    const now = new Date();
    const from = new Date(now);

    if (period === "week") from.setDate(now.getDate() - 7);
    else if (period === "month") from.setMonth(now.getMonth() - 1);
    else from.setHours(0, 0, 0, 0);

    const sales = await prisma.sale.findMany({
      where: { createdAt: { gte: from, lte: now } },
      select: { id: true, total: true },
    });

    const revenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      select: { stock: true, lowStockThreshold: true },
    });
    const lowStockCount = products.filter(
      (product) => product.stock <= product.lowStockThreshold
    ).length;

    res.json({
      success: true,
      data: {
        period,
        from,
        to: now,
        totalRevenue: revenue,
        transactionCount: sales.length,
        lowStockProducts: lowStockCount,
      },
    });
  })
);

router.get(
  "/top-products",
  asyncHandler(async (_req, res) => {
    const grouped = await prisma.saleItem.groupBy({
      by: ["productId"],
      _sum: {
        quantity: true,
        subtotal: true,
      },
      orderBy: {
        _sum: { quantity: "desc" },
      },
      take: 10,
    });

    const products = await prisma.product.findMany({
      where: { id: { in: grouped.map((entry) => entry.productId) } },
      select: { id: true, name: true, barcode: true, categoryId: true },
    });

    const byId = new Map(products.map((product) => [product.id, product]));
    const data = grouped.map((entry) => ({
      product: byId.get(entry.productId) || null,
      quantitySold: entry._sum.quantity || 0,
      revenue: Number(entry._sum.subtotal || 0),
    }));

    res.json({ success: true, data });
  })
);
router.get(
  "/summary/export/csv",
  asyncHandler(async (req, res) => {
    const period = String(req.query.period || "day");
    const now = new Date();
    const from = new Date(now);

    if (period === "week") from.setDate(now.getDate() - 7);
    else if (period === "month") from.setMonth(now.getMonth() - 1);
    else from.setHours(0, 0, 0, 0);

    const sales = await prisma.sale.findMany({
      where: { createdAt: { gte: from, lte: now } },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const lines = [
      "saleId,createdAt,userId,userName,userEmail,paymentMethod,subtotal,total,note",
      ...sales.map((sale) =>
        [
          sale.id,
          sale.createdAt.toISOString(),
          sale.user.id,
          sale.user.name,
          sale.user.email,
          sale.paymentMethod,
          Number(sale.subtotal),
          Number(sale.total),
          (sale.note || "").replaceAll(",", " "),
        ].join(",")
      ),
    ];

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=sales-summary-${period}.csv`);
    res.status(200).send(lines.join("\n"));
  })
);

export default router;
