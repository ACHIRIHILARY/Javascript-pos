import { z } from "zod";

export const CreateProductSchema = z.object({
  name: z.string().min(1),
  barcode: z.string().min(1).optional(),
  categoryId: z.string().cuid(),
  sellingPrice: z.coerce.number().positive(),
  stock: z.coerce.number().int().nonnegative().default(0),
  lowStockThreshold: z.coerce.number().int().nonnegative().default(5),
});

export const UpdateProductSchema = z.object({
  name: z.string().min(1).optional(),
  barcode: z.string().min(1).optional(),
  categoryId: z.string().cuid().optional(),
  sellingPrice: z.coerce.number().positive().optional(),
  stock: z.coerce.number().int().nonnegative().optional(),
  lowStockThreshold: z.coerce.number().int().nonnegative().optional(),
});

export const AdjustStockSchema = z.object({
  quantity: z.coerce.number().int(),
  reason: z.string().min(2).max(500),
});
