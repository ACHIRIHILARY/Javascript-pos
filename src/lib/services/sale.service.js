import { Prisma } from "@prisma/client";
import { prisma } from "../prisma.js";
import { AppError } from "../../utils/AppError.js";

export async function createSale(payload, userId) {
  const items = [...payload.items].sort((a, b) =>
    a.productId.localeCompare(b.productId)
  );

  return prisma.$transaction(
    async (tx) => {
      for (const item of items) {
        const rows = await tx.$queryRaw(
          Prisma.sql`
            SELECT stock
            FROM "Product"
            WHERE id = ${item.productId}
              AND "deletedAt" IS NULL
            FOR UPDATE
          `
        );

        if (!rows.length) {
          throw new AppError(`Product ${item.productId} not found.`, 404, "PRODUCT_NOT_FOUND");
        }
        if (rows[0].stock < item.quantity) {
          throw new AppError(
            `Insufficient stock for product ${item.productId}. Available: ${rows[0].stock}, Requested: ${item.quantity}.`,
            409,
            "INSUFFICIENT_STOCK"
          );
        }
      }

      const subtotal = items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0
      );

      const sale = await tx.sale.create({
        data: {
          userId,
          subtotal,
          total: subtotal,
          paymentMethod: payload.paymentMethod,
          note: payload.note,
        },
      });

      for (const item of items) {
        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.unitPrice * item.quantity,
          },
        });

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            userId,
            type: "SALE",
            quantity: -item.quantity,
            referenceId: sale.id,
            reason: `Sale #${sale.id}`,
          },
        });
      }

      return tx.sale.findUniqueOrThrow({
        where: { id: sale.id },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          saleItems: {
            include: {
              product: { select: { id: true, name: true, barcode: true } },
            },
          },
        },
      });
    },
    {
      timeout: 10_000,
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    }
  );
}
