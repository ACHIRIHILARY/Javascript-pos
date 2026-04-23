import { describe, expect, it } from "vitest";
import { CreateSaleSchema } from "../../src/lib/validators/sale.validator.js";

describe("CreateSaleSchema", () => {
  it("accepts a valid payload", () => {
    const parsed = CreateSaleSchema.parse({
      items: [{ productId: "ckx1q9d8u0000abcde1234567", quantity: 2, unitPrice: 10 }],
      paymentMethod: "CASH",
    });

    expect(parsed.items).toHaveLength(1);
    expect(parsed.paymentMethod).toBe("CASH");
  });

  it("rejects invalid payment method", () => {
    const result = CreateSaleSchema.safeParse({
      items: [{ productId: "ckx1q9d8u0000abcde1234567", quantity: 2, unitPrice: 10 }],
      paymentMethod: "BANK_TRANSFER",
    });

    expect(result.success).toBe(false);
  });
});
