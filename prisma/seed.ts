import { prisma } from "../lib/db"
import index from "../products/index.json"
import machined from "../products/machined-parts.json"
import metalwork from "../products/metalwork.json"
import prints from "../products/3d-prints.json"
import custom from "../products/custom-orders.json"

type ProductJson = {
  id: string
  name: string
  subtitle: string
  price: number
  rating: number
  reviewCount: number
  material: string
  finish?: string
  tolerance?: string
  dimensions: string
  weight: string
  image: string
  description: string
  specifications: Record<string, any>
  applications: string[]
  leadTime: string
  minimumOrder: number
  inStock: boolean
  category: string
}

async function seedCategories() {
  const categories: Array<{ id: string; name: string; description?: string }> = (index as any)?.categories ?? []
  for (let i = 0; i < categories.length; i++) {
    const c = categories[i]
    await prisma.category.upsert({
      where: { slug: c.id },
      update: {
        name: c.name,
        description: c.description ?? null,
        isVisible: true,
        order: i,
      },
      create: {
        slug: c.id,
        name: c.name,
        description: c.description ?? null,
        isVisible: true,
        order: i,
      },
    })
  }
}

async function getCategoryId(slug: string): Promise<string | null> {
  const cat = await prisma.category.findUnique({ where: { slug } })
  return cat?.id ?? null
}

async function seedProducts(list: ProductJson[]) {
  for (const p of list) {
    const categoryId = await getCategoryId(p.category)
    await prisma.product.upsert({
      where: { slug: p.id },
      update: {
        name: p.name,
        subtitle: p.subtitle,
        price: p.price,
        rating: p.rating,
        reviewCount: p.reviewCount,
        material: p.material,
        finish: p.finish,
        tolerance: p.tolerance,
        dimensions: p.dimensions,
        weight: p.weight,
        image: p.image,
        description: p.description,
        specifications: p.specifications as any,
        applications: p.applications,
        leadTime: p.leadTime,
        minimumOrder: p.minimumOrder,
        inStock: p.inStock,
        stockLevel: { set: 100 },
        safetyStock: { set: 20 },
        reorderPoint: { set: 40 },
        categoryId,
      },
      create: {
        slug: p.id,
        name: p.name,
        subtitle: p.subtitle,
        price: p.price,
        rating: p.rating,
        reviewCount: p.reviewCount,
        material: p.material,
        finish: p.finish,
        tolerance: p.tolerance,
        dimensions: p.dimensions,
        weight: p.weight,
        image: p.image,
        description: p.description,
        specifications: p.specifications as any,
        applications: p.applications,
        leadTime: p.leadTime,
        minimumOrder: p.minimumOrder,
        inStock: p.inStock,
        stockLevel: 100,
        safetyStock: 20,
        reorderPoint: 40,
        categoryId,
      },
    })
  }
}

async function seedNavigation() {
  // Seed header navigation for categories if not present
  const items = await prisma.navigationItem.findMany({ where: { location: "HEADER" } })
  if (items.length === 0) {
    const cats = await prisma.category.findMany({ orderBy: { order: "asc" } })
    for (let i = 0; i < cats.length; i++) {
      const c = cats[i]
      await prisma.navigationItem.create({
        data: {
          location: "HEADER",
          key: c.slug,
          label: c.name,
          url: `/category/${c.slug}`,
          order: i,
          isVisible: true,
        },
      })
    }
  }
  // Seed footer basic links if empty
  const footerItems = await prisma.navigationItem.findMany({ where: { location: "FOOTER" } })
  if (footerItems.length === 0) {
    const cats = await prisma.category.findMany({ orderBy: { order: "asc" } })
    for (let i = 0; i < cats.length; i++) {
      const c = cats[i]
      await prisma.navigationItem.create({
        data: {
          location: "FOOTER",
          key: `products-${c.slug}`,
          label: c.name,
          url: `/category/${c.slug}`,
          order: i,
          isVisible: true,
        },
      })
    }
  }
}

async function seedAttributes() {
  // Collect materials and lead times from product JSONs
  const allProducts = [
    ...(machined.products as ProductJson[]),
    ...(metalwork.products as ProductJson[]),
    ...(prints.products as ProductJson[]),
    ...(custom.products as ProductJson[]),
  ]
  const materials = Array.from(new Set(allProducts.map((p) => p.material).filter(Boolean))).sort()
  const leadTimes = Array.from(new Set(allProducts.map((p) => p.leadTime).filter(Boolean))).sort()
  const tolerances = [
    'High Precision (±0.001")',
    'Standard (±0.005")',
    'General (±0.01")',
  ]

  await prisma.allowedAttribute.upsert({
    where: { key: "material" },
    update: { label: "Material", type: "STRING", options: materials, isActive: true },
    create: { key: "material", label: "Material", type: "STRING", options: materials, isActive: true },
  })
  await prisma.allowedAttribute.upsert({
    where: { key: "leadTime" },
    update: { label: "Lead Time", type: "STRING", options: leadTimes, isActive: true },
    create: { key: "leadTime", label: "Lead Time", type: "STRING", options: leadTimes, isActive: true },
  })
  await prisma.allowedAttribute.upsert({
    where: { key: "tolerance" },
    update: { label: "Tolerance", type: "STRING", options: tolerances, isActive: true },
    create: { key: "tolerance", label: "Tolerance", type: "STRING", options: tolerances, isActive: true },
  })
}

async function main() {
  const mode = (process.env.SEED_MODE || "full").toLowerCase()
  await seedCategories()
  if (mode === "ci" || mode === "minimal") {
    // Seed a minimal set required for tests
    const firstMachined = (machined.products as ProductJson[]).slice(0, 1)
    await seedProducts(firstMachined)
  } else {
    await seedProducts(machined.products as ProductJson[])
    await seedProducts(metalwork.products as ProductJson[])
    await seedProducts(prints.products as ProductJson[])
    await seedProducts(custom.products as ProductJson[])
  }
  await seedNavigation()
  await seedAttributes()
  console.log("Seeded products:", await prisma.product.count())
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