import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductSchema, insertCategorySchema, insertCouponSchema } from "@shared/schema";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  ShoppingCart, 
  DollarSign, 
  Package, 
  Users, 
  Plus, 
  Edit, 
  Trash2,
  TrendingUp,
  ArrowUp
} from "lucide-react";

type ProductFormData = z.infer<typeof insertProductSchema>;
type CategoryFormData = z.infer<typeof insertCategorySchema>;
type CouponFormData = z.infer<typeof insertCouponSchema>;

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("products");
  const { toast } = useToast();

  // Fetch data
  const { data: products = [] } = useQuery({ queryKey: ["/api/products"] });
  const { data: categories = [] } = useQuery({ queryKey: ["/api/categories"] });
  const { data: orders = [] } = useQuery({ queryKey: ["/api/orders"] });
  const { data: coupons = [] } = useQuery({ queryKey: ["/api/coupons"] });

  // Stats calculations
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum: number, order: any) => sum + parseFloat(order.total || 0), 0);
  const totalProducts = products.length;

  // Forms
  const productForm = useForm<ProductFormData>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      salePrice: "",
      sku: "",
      categoryId: undefined,
      stock: 0,
      imageUrl: "",
      isActive: true,
    },
  });

  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(insertCategorySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const couponForm = useForm<CouponFormData>({
    resolver: zodResolver(insertCouponSchema),
    defaultValues: {
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: "",
      minOrderAmount: "",
      maxDiscountAmount: "",
      isActive: true,
    },
  });

  // Mutations
  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const res = await apiRequest("POST", "/api/products", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      productForm.reset();
      toast({ title: "Product created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create product", variant: "destructive" });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const res = await apiRequest("POST", "/api/categories", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      categoryForm.reset();
      toast({ title: "Category created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create category", variant: "destructive" });
    },
  });

  const createCouponMutation = useMutation({
    mutationFn: async (data: CouponFormData) => {
      const res = await apiRequest("POST", "/api/coupons", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coupons"] });
      couponForm.reset();
      toast({ title: "Coupon created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create coupon", variant: "destructive" });
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PUT", `/api/orders/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Order status updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update order status", variant: "destructive" });
    },
  });

  const onCreateProduct = (data: ProductFormData) => {
    createProductMutation.mutate(data);
  };

  const onCreateCategory = (data: CategoryFormData) => {
    createCategoryMutation.mutate(data);
  };

  const onCreateCoupon = (data: CouponFormData) => {
    createCouponMutation.mutate(data);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Admin Dashboard</h2>
        <p className="text-neutral">Manage your e-commerce platform with comprehensive admin tools</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral mb-1">Total Orders</p>
                <p className="text-2xl font-bold">{totalOrders}</p>
                <p className="text-sm text-success flex items-center">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  +12% from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral mb-1">Revenue</p>
                <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
                <p className="text-sm text-success flex items-center">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  +8% from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-secondary bg-opacity-10 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral mb-1">Products</p>
                <p className="text-2xl font-bold">{totalProducts}</p>
                <p className="text-sm text-neutral">Active products</p>
              </div>
              <div className="w-12 h-12 bg-success bg-opacity-10 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral mb-1">Categories</p>
                <p className="text-2xl font-bold">{categories.length}</p>
                <p className="text-sm text-neutral">Product categories</p>
              </div>
              <div className="w-12 h-12 bg-purple-500 bg-opacity-10 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Tabs */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b border-gray-200 dark:border-border-dark">
            <TabsList className="w-full justify-start px-6">
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="coupons">Coupons</TabsTrigger>
            </TabsList>
          </div>

          {/* Products Tab */}
          <TabsContent value="products" className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Product Management</h3>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={productForm.handleSubmit(onCreateProduct)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Product Name</Label>
                        <Input {...productForm.register("name")} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sku">SKU</Label>
                        <Input {...productForm.register("sku")} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea {...productForm.register("description")} />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">Price</Label>
                        <Input {...productForm.register("price")} placeholder="99.99" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="salePrice">Sale Price</Label>
                        <Input {...productForm.register("salePrice")} placeholder="79.99" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="stock">Stock</Label>
                        <Input type="number" {...productForm.register("stock", { valueAsNumber: true })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="categoryId">Category</Label>
                        <Select onValueChange={(value) => productForm.setValue("categoryId", parseInt(value))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category: any) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="imageUrl">Image URL</Label>
                        <Input {...productForm.register("imageUrl")} placeholder="https://..." />
                      </div>
                    </div>
                    <Button type="submit" disabled={createProductMutation.isPending}>
                      Create Product
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product: any) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <img
                            src={product.imageUrl || "https://via.placeholder.com/64"}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-neutral">SKU: {product.sku}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {categories.find((cat: any) => (cat._id || cat.id).toString() === product.categoryId.toString())?.name || "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">${product.salePrice || product.price}</span>
                          {product.salePrice && (
                            <span className="text-sm text-neutral line-through">${product.price}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{product.stock}</TableCell>
                      <TableCell>
                        <Badge variant={product.isActive ? "default" : "secondary"}>
                          {product.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Category Management</h3>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Category</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={categoryForm.handleSubmit(onCreateCategory)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Category Name</Label>
                      <Input {...categoryForm.register("name")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea {...categoryForm.register("description")} />
                    </div>
                    <Button type="submit" disabled={createCategoryMutation.isPending}>
                      Create Category
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category: any) => (
                <Card key={category.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-neutral mb-4">{category.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral">
                        {products.filter((p: any) => p.categoryId === category.id).length} products
                      </span>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Order Management</h3>
              <Select defaultValue="all">
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              {orders.map((order: any) => (
                <Card key={order.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium">Order #{order.id}</h4>
                        <p className="text-sm text-neutral">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right flex items-center space-x-3">
                        <Badge variant={getStatusBadgeVariant(order.status)}>
                          {order.status}
                        </Badge>
                        <Select
                          value={order.status}
                          onValueChange={(value) => updateOrderStatusMutation.mutate({ id: order.id, status: value })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-neutral">Total: ${order.total}</p>
                      <p className="font-semibold">${order.total}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Coupons Tab */}
          <TabsContent value="coupons" className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Coupon Management</h3>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Coupon
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Coupon</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={couponForm.handleSubmit(onCreateCoupon)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="code">Coupon Code</Label>
                        <Input {...couponForm.register("code")} placeholder="SAVE20" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="discountType">Discount Type</Label>
                        <Select onValueChange={(value) => couponForm.setValue("discountType", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage</SelectItem>
                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input {...couponForm.register("description")} />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="discountValue">Discount Value</Label>
                        <Input {...couponForm.register("discountValue")} placeholder="20" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="minOrderAmount">Min Order</Label>
                        <Input {...couponForm.register("minOrderAmount")} placeholder="50" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxDiscountAmount">Max Discount</Label>
                        <Input {...couponForm.register("maxDiscountAmount")} placeholder="100" />
                      </div>
                    </div>
                    <Button type="submit" disabled={createCouponMutation.isPending}>
                      Create Coupon
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coupons.map((coupon: any) => (
                <Card key={coupon.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{coupon.code}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-neutral mb-2">{coupon.description}</p>
                    <p className="font-medium mb-2">
                      {coupon.discountType === "percentage" ? `${coupon.discountValue}%` : `$${coupon.discountValue}`} off
                    </p>
                    <div className="flex justify-between items-center">
                      <Badge variant={coupon.isActive ? "default" : "secondary"}>
                        {coupon.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
