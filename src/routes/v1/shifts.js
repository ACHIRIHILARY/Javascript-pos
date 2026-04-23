import express from "express";
import { prisma } from "../../lib/prisma.js";
import { authMiddleware } from "../../middleware/auth.js";
import { rbacMiddleware } from "../../middleware/rbac.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = express.Router();

router.use(authMiddleware);

router.post(
  "/end",
  rbacMiddleware(["OWNER", "ADMIN", "CASHIER"]),
  asyncHandler(async (req, res) => {
    const cashierId = String(req.body?.cashierId || req.user.id);
    const startAt = req.body?.startAt ? new Date(req.body.startAt) : new Date(new Date().setHours(0, 0, 0, 0));
    const endAt = req.body?.endAt ? new Date(req.body.endAt) : new Date();

    const sales = await prisma.sale.findMany({
      where: {
        userId: cashierId,
        createdAt: { gte: startAt, lte: endAt },
      },
      include: { saleItems: true },
      orderBy: { createdAt: "asc" },
    });

    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const totalItems = sales.reduce(
      (sum, sale) => sum + sale.saleItems.reduce((inner, item) => inner + item.quantity, 0),
      0
    );

    res.json({
      success: true,
      data: {
        cashierId,
        startAt,
        endAt,
        transactionCount: sales.length,
        totalRevenue,
        totalItems,
        sales,
      },
    });
  })
);

router.get(
  "/report",
  rbacMiddleware(["OWNER", "ADMIN"]),
  asyncHandler(async (req, res) => {
    const from = req.query.from ? new Date(String(req.query.from)) : new Date(new Date().setHours(0, 0, 0, 0));
    const to = req.query.to ? new Date(String(req.query.to)) : new Date();

    const sales = await prisma.sale.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    });

    const byCashier = new Map();
    for (const sale of sales) {
      const key = sale.userId;
      const current = byCashier.get(key) || {
        user: sale.user,
        transactionCount: 0,
        totalRevenue: 0,
      };
      current.transactionCount += 1;
      current.totalRevenue += Number(sale.total);
      byCashier.set(key, current);
    }

    res.json({
      success: true,
      data: {
        from,
        to,
        shifts: Array.from(byCashier.values()),
      },
    });
  })
);

export default router;
