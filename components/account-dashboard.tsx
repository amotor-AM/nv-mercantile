"use client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, LogOut, Truck, CreditCard } from "lucide-react"
import { useUser, useClerk } from "@clerk/nextjs"
import { ProfileSettings } from "@/components/profile-settings"

export function AccountDashboard() {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()

  if (!isLoaded) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user) {
    router.push("/sign-in")
    return null
  }

  const handleLogout = () => {
    signOut(() => router.push("/"))
  }

  // Mock data for orders and favorites
  const recentOrders = [
    {
      id: "NK123456789",
      date: "2024-01-15",
      status: "Delivered",
      total: "$185.99",
      items: 2,
    },
    {
      id: "NK987654321",
      date: "2024-01-10",
      status: "Shipped",
      total: "$129.99",
      items: 1,
    },
  ]

  const favoriteItems = [
    {
      id: "1",
      name: "Air Jordan 1 Retro High OG",
      price: "$170",
      image: "/air-jordan-1-black-white-sneaker.png",
    },
    {
      id: "2",
      name: "Nike Air Force 1 '07",
      price: "$110",
      image: "/nike-air-force-1-white-sneaker.png",
    },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user.firstName || "Member"}!</h1>
          <p className="text-muted-foreground">Manage your Nike Member profile and preferences</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6 text-center">
            <Package className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">2</p>
            <p className="text-sm text-muted-foreground">Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <CreditCard className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">$315</p>
            <p className="text-sm text-muted-foreground">Total Spent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Badge className="mb-2">Member</Badge>
            <p className="text-sm text-muted-foreground">Since 2024</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Recent Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold">#{order.id}</p>
                        <p className="text-sm text-muted-foreground">{order.date}</p>
                        <p className="text-sm text-muted-foreground">{order.items} items</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={order.status === "Delivered" ? "default" : "secondary"}>{order.status}</Badge>
                        <p className="font-semibold mt-1">{order.total}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4 bg-transparent">
                  View All Orders
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-6 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-semibold">Order #{order.id}</p>
                        <p className="text-sm text-muted-foreground">Placed on {order.date}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.items} items • {order.total}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={order.status === "Delivered" ? "default" : "secondary"}>{order.status}</Badge>
                      <Button variant="outline" size="sm">
                        <Truck className="w-4 h-4 mr-2" />
                        Track
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <ProfileSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
