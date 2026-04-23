import { z } from "zod";

export const SaleItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().positive(),
});

export const CreateSaleSchema = z.object({
  items: z.array(SaleItemSchema).min(1),
  paymentMethod: z.enum(["CASH", "CARD", "MOBILE_MONEY"]),
  note: z.string().max(500).optional(),
});
