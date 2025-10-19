/**
 * Inventory helpers to compute next stock state consistently.
 */

/**
 * Given current stock level and a delta, returns the next stock level and inStock flag.
 * We do not clamp negative values here; callers may decide to clamp if needed.
 */
export function nextStockState(current: number, delta: number): { stockLevel: number; inStock: boolean } {
  const cur = Number.isFinite(current) ? current : 0
  const d = Number.isFinite(delta) ? delta : 0
  const stockLevel = cur + d
  return { stockLevel, inStock: stockLevel > 0 }
}

/**
 * Recompute inStock from a stockLevel.
 */
export function recomputeInStock(stockLevel: number): boolean {
  return (Number.isFinite(stockLevel) ? stockLevel : 0) > 0
}

/**
 * Recompute Product.inStock from its own stockLevel OR sum of variant stock levels.
 * Provide a Prisma client or transaction in `tx`.
 */
export async function recomputeProductInStock(tx: any, productId: string): Promise<boolean> {
  const [p, agg] = await Promise.all([
    tx.product.findUnique({ where: { id: productId }, select: { stockLevel: true } }),
    tx.variant.aggregate({ _sum: { stockLevel: true }, where: { productId } }),
  ])
  const base = (p?.stockLevel ?? 0) > 0
  const varSum = (agg?._sum?.stockLevel ?? 0) > 0
  const inStock = base || varSum
  await tx.product.update({ where: { id: productId }, data: { inStock } })
  return inStock
}