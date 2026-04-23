import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const generalCategory = await prisma.category.upsert({
    where: { name: "General" },
    update: {},
    create: { name: "General" },
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

  console.log("Seed data inserted.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
