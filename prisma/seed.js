import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const ownerPassword = await bcrypt.hash("owner12345", 12);
  const cashierPassword = await bcrypt.hash("cashier12345", 12);
  const generalCategory = await prisma.category.upsert({
    where: { name: "General" },
    update: {},
    create: { name: "General" },
  });

  const beverageCategory = await prisma.category.upsert({
    where: { name: "Beverages" },
    update: {},
    create: { name: "Beverages" },
  });

  await prisma.product.upsert({
    where: { barcode: "000000000002" },
    update: {},
    create: {
      name: "Orange Juice",
      barcode: "000000000002",
      sellingPrice: "4.50",
      stock: 50,
      lowStockThreshold: 8,
      categoryId: beverageCategory.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "owner@pos.local" },
    update: {},
    create: {
      name: "Owner Account",
      email: "owner@pos.local",
      password: ownerPassword,
      role: "OWNER",
      active: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "cashier@pos.local" },
    update: {},
    create: {
      name: "Cashier Account",
      email: "cashier@pos.local",
      password: cashierPassword,
      role: "CASHIER",
      active: true,
    },
  });

  await prisma.product.upsert({
    where: { barcode: "000000000001" },
    update: {},
    create: {
      name: "Sample Product",
      barcode: "000000000001",
      sellingPrice: "9.99",
      stock: 100,
      lowStockThreshold: 10,
      categoryId: generalCategory.id,
    },
  });

  console.log("Seed data inserted. Test accounts: owner@pos.local / owner12345, cashier@pos.local / cashier12345");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
