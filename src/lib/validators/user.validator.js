import { z } from "zod";

export const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["OWNER", "ADMIN", "CASHIER"]).default("CASHIER"),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(["OWNER", "ADMIN", "CASHIER"]).optional(),
  active: z.boolean().optional(),
});
