import { prisma } from "../lib/db"

async function main() {
  // Minimal categories
  const cat = await prisma.category.upsert({
    where: { slug: "staging" },
    update: { name: "Staging Category", isVisible: true, order: 1 },
    create: { slug: "staging", name: "Staging Category", isVisible: true, order: 1 },
  })

  // Minimal product
  await prisma.product.upsert({
    where: { slug: "staging-product" },
    update: {
      name: "Staging Product",
      subtitle: "Test item",
      price: 100,
      rating: 0,
      reviewCount: 0,
      material: "Aluminum",
      tolerance: "Standard (±0.005\")",
      dimensions: "10x10x10 cm",
      weight: "1kg",
      image: "https://placehold.co/600x400.png",
      description: "Minimal product for staging",
      specifications: {},
      applications: ["Test"],
      leadTime: "2-3 days",
      minimumOrder: 1,
      inStock: true,
      stockLevel: 10,
      safetyStock: 2,
      reorderPoint: 5,
      categoryId: cat.id,
    },
    create: {
      slug: "staging-product",
      name: "Staging Product",
      subtitle: "Test item",
      price: 100,
      rating: 0,
      reviewCount: 0,
      material: "Aluminum",
      tolerance: "Standard (±0.005\")",
      dimensions: "10x10x10 cm",
      weight: "1kg",
      image: "https://placehold.co/600x400.png",
      description: "Minimal product for staging",
      specifications: {},
      applications: ["Test"],
      leadTime: "2-3 days",
      minimumOrder: 1,
      inStock: true,
      stockLevel: 10,
      safetyStock: 2,
      reorderPoint: 5,
      categoryId: cat.id,
    },
  })

  // Navigation
  await prisma.navigationItem.upsert({
    where: { location_key: { location: "HEADER", key: "staging" } } as any,
    update: { label: "Staging", url: "/category/staging", order: 1, isVisible: true },
    create: { location: "HEADER", key: "staging", label: "Staging", url: "/category/staging", order: 1, isVisible: true },
  } as any)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })