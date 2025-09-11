import { prisma } from "@/lib/db"
import { auth } from "@/auth"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { AccountOrderActions } from "@/components/account-order-actions"

async function getOrders() {
  const session = await auth()
  if (!session?.user) return null
  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        ...(session.user.email ? [{ email: session.user.email }] : []),
      ],
    },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: true } } },
  })
  return orders
}

export default async function OrdersPage() {
  const session = await auth()
  const orders = await getOrders()

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold">Your Orders</h1>
      <Separator className="my-4" />
      {!session?.user && (
        <div className="text-sm text-muted-foreground">
          <Link href="/api/auth/signin" className="underline">
            Sign in
          </Link>{" "}
          to see your orders.
        </div>
      )}
      {session?.user && orders && orders.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o: any) => (
                <TableRow key={o.id}>
                  <TableCell>{o.orderNumber}</TableCell>
                  <TableCell>{new Date(o.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="capitalize">
                    {o.status.toLowerCase()}
                    {o.refundStatus !== "NONE" && (
                      <span className="ml-2 text-xs text-muted-foreground">({o.refundStatus.toLowerCase()})</span>
                    )}
                  </TableCell>
                  <TableCell>${(o.total / 100).toFixed(2)}</TableCell>
                  <TableCell>
                    <AccountOrderActions order={o} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        session?.user && <div className="text-sm text-muted-foreground">No orders found.</div>
      )}
    </div>
  )
}