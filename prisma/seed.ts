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

async function seedProducts(list: ProductJson[]) {
  for (const p of list) {
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
        category: p.category,
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
        category: p.category,
      },
    })
  }
}

async function main() {
  await seedProducts(machined.products as ProductJson[])
  await seedProducts(metalwork.products as ProductJson[])
  await seedProducts(prints.products as ProductJson[])
  await seedProducts(custom.products as ProductJson[])
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