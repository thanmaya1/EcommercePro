import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAddressSchema } from "@shared/schema";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { 
  User, 
  ShoppingBag, 
  Heart, 
  MapPin, 
  Settings,
  Plus,
  Edit,
  Trash2,
  Package,
  TrendingUp,
  Star,
  Calendar
} from "lucide-react";

type AddressFormData = z.infer<typeof insertAddressSchema>;

export default function UserProfile() {
  const [activeTab, setActiveTab] = useState("overview");
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();

  // Fetch data
  const { data: orders = [] } = useQuery({
    queryKey: ["/api/orders"],
    enabled: !!user,
  });

  const { data: wishlistItems = [] } = useQuery({
    queryKey: ["/api/wishlist"],
    enabled: !!user,
  });

  const { data: addresses = [] } = useQuery({
    queryKey: ["/api/addresses"],
    enabled: !!user,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  // Address form
  const addressForm = useForm<AddressFormData>({
    resolver: zodResolver(insertAddressSchema.omit({ userId: true })),
    defaultValues: {
      type: "shipping",
      firstName: "",
      lastName: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "United States",
      isDefault: false,
    },
  });

  // Mutations
  const createAddressMutation = useMutation({
    mutationFn: async (data: Omit<AddressFormData, "userId">) => {
      const res = await apiRequest("POST", "/api/addresses", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      addressForm.reset();
      toast({ title: "Address added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add address", variant: "destructive" });
    },
  });

  const removeWishlistItemMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/wishlist/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({ title: "Item removed from wishlist" });
    },
    onError: () => {
      toast({ title: "Failed to remove item", variant: "destructive" });
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: number; quantity: number }) => {
      const res = await apiRequest("POST", "/api/cart", { productId, quantity });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({ title: "Product added to cart" });
    },
    onError: () => {
      toast({ title: "Failed to add product to cart", variant: "destructive" });
    },
  });

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
          <p className="text-neutral mb-4">You need to be signed in to view your profile.</p>
          <Link href="/auth">
            <Button>Sign In</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Get wishlist items with product details
  const wishlistItemsWithProducts = wishlistItems.map((item: any) => {
    const product = products.find((p: any) => p.id === item.productId);
    return { ...item, product };
  }).filter((item: any) => item.product);

  // Calculate user stats
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum: number, order: any) => sum + parseFloat(order.total || 0), 0);
  const rewardPoints = Math.floor(totalSpent * 10); // 10 points per dollar

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "delivered": return "default";
      case "shipped": return "secondary";
      case "processing": return "outline";
      case "pending": return "destructive";
      default: return "outline";
    }
  };

  const onCreateAddress = (data: Omit<AddressFormData, "userId">) => {
    createAddressMutation.mutate(data);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Profile Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <div className="text-center mb-6">
              <Avatar className="w-20 h-20 mx-auto mb-3">
                <AvatarFallback className="bg-primary text-white text-2xl font-bold">
                  {getInitials(user.firstName, user.lastName)}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-semibold">{user.firstName} {user.lastName}</h3>
              <p className="text-neutral text-sm">{user.email}</p>
              {user.isAdmin && (
                <Badge className="mt-2">Admin</Badge>
              )}
            </div>
            <nav className="space-y-2">
              <Button
                variant={activeTab === "overview" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("overview")}
              >
                <User className="h-4 w-4 mr-3" />
                Overview
              </Button>
              <Button
                variant={activeTab === "orders" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("orders")}
              >
                <ShoppingBag className="h-4 w-4 mr-3" />
                Order History
              </Button>
              <Button
                variant={activeTab === "wishlist" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("wishlist")}
              >
                <Heart className="h-4 w-4 mr-3" />
                Wishlist
              </Button>
              <Button
                variant={activeTab === "addresses" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("addresses")}
              >
                <MapPin className="h-4 w-4 mr-3" />
                Addresses
              </Button>
              <Button
                variant={activeTab === "settings" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("settings")}
              >
                <Settings className="h-4 w-4 mr-3" />
                Settings
              </Button>
            </nav>
          </Card>
        </div>

        {/* Profile Content */}
        <div className="lg:col-span-3">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Account Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-2xl font-bold text-primary mb-1">{totalOrders}</div>
                      <div className="text-sm text-neutral">Total Orders</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-2xl font-bold text-secondary mb-1">${totalSpent.toFixed(2)}</div>
                      <div className="text-sm text-neutral">Total Spent</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-2xl font-bold text-success mb-1">{rewardPoints.toLocaleString()}</div>
                      <div className="text-sm text-neutral">Reward Points</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Orders */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center">
                      <Package className="h-5 w-5 mr-2" />
                      Recent Orders
                    </CardTitle>
                    <Button variant="outline" onClick={() => setActiveTab("orders")}>
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-neutral mx-auto mb-4" />
                      <p className="text-neutral">No orders yet</p>
                      <Link href="/storefront">
                        <Button className="mt-4">Start Shopping</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.slice(0, 3).map((order: any) => (
                        <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div>
                            <h4 className="font-medium">Order #{order.id}</h4>
                            <p className="text-sm text-neutral">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${order.total}</p>
                            <Badge variant={getStatusBadgeVariant(order.status)}>
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Order History Tab */}
          {activeTab === "orders" && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <ShoppingBag className="h-5 w-5 mr-2" />
                    Order History
                  </CardTitle>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Orders</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="h-16 w-16 text-neutral mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
                    <p className="text-neutral mb-6">When you place orders, they will appear here.</p>
                    <Link href="/storefront">
                      <Button>Start Shopping</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orders.map((order: any) => (
                      <div key={order.id} className="border border-gray-200 dark:border-border-dark rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-semibold">Order #{order.id}</h4>
                            <p className="text-sm text-neutral flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              Placed on {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant={getStatusBadgeVariant(order.status)}>
                              {order.status}
                            </Badge>
                            {order.status === "delivered" && (
                              <p className="text-sm text-neutral mt-1">
                                Delivered on {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-border-dark">
                          <div>
                            <span className="font-semibold">Total: ${order.total}</span>
                          </div>
                          <div className="flex space-x-3">
                            <Button variant="outline" size="sm">
                              Track Package
                            </Button>
                            <Button variant="outline" size="sm">
                              Buy Again
                            </Button>
                            <Button variant="outline" size="sm">
                              Leave Review
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Wishlist Tab */}
          {activeTab === "wishlist" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="h-5 w-5 mr-2" />
                  My Wishlist
                </CardTitle>
              </CardHeader>
              <CardContent>
                {wishlistItemsWithProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="h-16 w-16 text-neutral mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Your wishlist is empty</h3>
                    <p className="text-neutral mb-6">Save items you love for later.</p>
                    <Link href="/storefront">
                      <Button>Browse Products</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {wishlistItemsWithProducts.map((item: any) => (
                      <div key={item.id} className="border border-gray-200 dark:border-border-dark rounded-lg p-4">
                        <div className="flex space-x-4">
                          <img
                            src={item.product.imageUrl || "https://via.placeholder.com/120x120"}
                            alt={item.product.name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <Link href={`/product/${item.product.id}`}>
                              <h4 className="font-medium mb-1 hover:text-primary cursor-pointer">
                                {item.product.name}
                              </h4>
                            </Link>
                            <p className="text-sm text-neutral mb-2 line-clamp-2">
                              {item.product.description}
                            </p>
                            <p className="font-semibold mb-3">
                              ${item.product.salePrice || item.product.price}
                            </p>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => addToCartMutation.mutate({ productId: item.product.id, quantity: 1 })}
                                disabled={addToCartMutation.isPending}
                              >
                                Add to Cart
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeWishlistItemMutation.mutate(item.id)}
                                disabled={removeWishlistItemMutation.isPending}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Addresses Tab */}
          {activeTab === "addresses" && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Saved Addresses
                  </CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Address
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Address</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={addressForm.handleSubmit(onCreateAddress)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input {...addressForm.register("firstName")} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input {...addressForm.register("lastName")} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="address">Address</Label>
                          <Input {...addressForm.register("address")} />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input {...addressForm.register("city")} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="state">State</Label>
                            <Input {...addressForm.register("state")} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="zipCode">ZIP Code</Label>
                            <Input {...addressForm.register("zipCode")} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="type">Address Type</Label>
                          <Select onValueChange={(value) => addressForm.setValue("type", value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="shipping">Shipping</SelectItem>
                              <SelectItem value="billing">Billing</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit" disabled={createAddressMutation.isPending}>
                          Save Address
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {addresses.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className="h-16 w-16 text-neutral mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No addresses saved</h3>
                    <p className="text-neutral mb-6">Add addresses for faster checkout.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {addresses.map((address: any) => (
                      <div key={address.id} className="border border-gray-200 dark:border-border-dark rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{address.firstName} {address.lastName}</h4>
                          <div className="flex items-center space-x-2">
                            <Badge variant={address.type === "shipping" ? "default" : "secondary"}>
                              {address.type}
                            </Badge>
                            {address.isDefault && (
                              <Badge variant="outline">Default</Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-neutral text-sm mb-4">
                          {address.address}<br />
                          {address.city}, {address.state} {address.zipCode}<br />
                          {address.country}
                        </p>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Account Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-4">Account Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" defaultValue={user.firstName} />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" defaultValue={user.lastName} />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={user.email} />
                  </div>
                  <Button className="mt-4">Update Information</Button>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-4">Password</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input id="currentPassword" type="password" />
                    </div>
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input id="newPassword" type="password" />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input id="confirmPassword" type="password" />
                    </div>
                  </div>
                  <Button className="mt-4">Change Password</Button>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-4">Account Actions</h3>
                  <div className="space-y-4">
                    <Button 
                      variant="outline" 
                      onClick={() => logoutMutation.mutate()}
                      disabled={logoutMutation.isPending}
                    >
                      Sign Out
                    </Button>
                    <Button variant="destructive">
                      Delete Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
