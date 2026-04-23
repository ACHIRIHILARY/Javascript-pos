import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../../src/utils/AppError.js";

const tx = {
  $queryRaw: vi.fn(),
  sale: {
    create: vi.fn(),
    findUniqueOrThrow: vi.fn(),
  },
  saleItem: { create: vi.fn() },
  product: { update: vi.fn() },
  stockMovement: { create: vi.fn() },
};

vi.mock("../../src/lib/prisma.js", () => ({
  prisma: {
    $transaction: vi.fn(async (fn) => fn(tx)),
  },
}));

describe("createSale service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws INSUFFICIENT_STOCK when requested quantity exceeds stock", async () => {
    tx.$queryRaw.mockResolvedValueOnce([{ stock: 1 }]);
    const { createSale } = await import("../../src/lib/services/sale.service.js");

    await expect(
      createSale(
        {
          items: [{ productId: "cuid123", quantity: 2, unitPrice: 10 }],
          paymentMethod: "CASH",
        },
        "user_1"
      )
    ).rejects.toMatchObject({ code: "INSUFFICIENT_STOCK" });
  });

  it("creates sale, items, stock movement, and decrements stock", async () => {
    tx.$queryRaw.mockResolvedValueOnce([{ stock: 10 }]);
    tx.sale.create.mockResolvedValueOnce({ id: "sale_1" });
    tx.sale.findUniqueOrThrow.mockResolvedValueOnce({ id: "sale_1", saleItems: [] });
    const { createSale } = await import("../../src/lib/services/sale.service.js");

    const result = await createSale(
      {
        items: [{ productId: "cuid123", quantity: 2, unitPrice: 10 }],
        paymentMethod: "CASH",
      },
      "user_1"
    );

    expect(result.id).toBe("sale_1");
    expect(tx.product.update).toHaveBeenCalledWith({
      where: { id: "cuid123" },
      data: { stock: { decrement: 2 } },
    });
    expect(tx.stockMovement.create).toHaveBeenCalled();
  });

  it("throws PRODUCT_NOT_FOUND when a product cannot be locked", async () => {
    tx.$queryRaw.mockResolvedValueOnce([]);
    const { createSale } = await import("../../src/lib/services/sale.service.js");

    await expect(
      createSale(
        {
          items: [{ productId: "missing", quantity: 1, unitPrice: 10 }],
          paymentMethod: "CASH",
        },
        "user_1"
      )
    ).rejects.toBeInstanceOf(AppError);
  });
});
