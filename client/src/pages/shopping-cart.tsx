import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart,
  CreditCard,
  Tag,
  ArrowLeft
} from "lucide-react";

export default function ShoppingCartPage() {
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch data
  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ["/api/cart"],
    enabled: !!user,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  // Mutations
  const updateCartItemMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      const res = await apiRequest("PUT", `/api/cart/${id}`, { quantity });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: () => {
      toast({ title: "Failed to update cart item", variant: "destructive" });
    },
  });

  const removeCartItemMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/cart/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({ title: "Item removed from cart" });
    },
    onError: () => {
      toast({ title: "Failed to remove item", variant: "destructive" });
    },
  });

  const applyCouponMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await fetch(`/api/coupons/${code}/validate`, { credentials: "include" });
      if (!res.ok) throw new Error("Invalid coupon code");
      return res.json();
    },
    onSuccess: (coupon) => {
      setAppliedCoupon(coupon);
      toast({ title: `Coupon "${coupon.code}" applied successfully!` });
    },
    onError: () => {
      toast({ title: "Invalid or expired coupon code", variant: "destructive" });
    },
  });

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
          <p className="text-neutral mb-4">You need to be signed in to view your cart.</p>
          <Link href="/auth">
            <Button>Sign In</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ShoppingCart className="h-12 w-12 text-neutral mx-auto mb-4" />
          <p>Loading your cart...</p>
        </div>
      </div>
    );
  }

  // Get cart items with product details
  const cartItemsWithProducts = Array.isArray(cartItems) 
    ? cartItems.map((item: any) => {
        const product = Array.isArray(products) 
          ? products.find((p: any) => (p.id || p._id) === item.productId || (p.id || p._id) === (item.productId?._id || item.productId))
          : null;
        return { ...item, product };
      }).filter((item: any) => item.product)
    : [];

  const subtotal = cartItemsWithProducts.reduce((sum: number, item: any) => {
    const price = parseFloat(item.product.salePrice || item.product.price || "0");
    return sum + (price * (item.quantity || 1));
  }, 0);

  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeCartItemMutation.mutate(id);
    } else {
      updateCartItemMutation.mutate({ id, quantity });
    }
  };

  const applyCoupon = () => {
    if (couponCode.trim()) {
      applyCouponMutation.mutate(couponCode.trim());
    }
  };

  if (cartItemsWithProducts.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-16">
          <ShoppingCart className="h-24 w-24 text-neutral mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Your cart is empty</h2>
          <p className="text-neutral mb-8">Looks like you haven't added any items to your cart yet.</p>
          <Link href="/storefront">
            <Button size="lg">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center mb-8">
        <Link href="/storefront">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Button>
        </Link>
      </div>

      <h2 className="text-3xl font-bold mb-8">Shopping Cart</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Cart Items ({cartItemsWithProducts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {cartItemsWithProducts.map((item: any) => (
                <div key={item.id} className="flex items-start space-x-4 pb-6 border-b border-gray-100 dark:border-border-dark last:border-b-0">
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
                    <p className="text-sm text-neutral mb-2">SKU: {item.product.sku}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center border border-gray-200 dark:border-border-dark rounded-lg">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={updateCartItemMutation.isPending}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="px-3 py-1 border-l border-r border-gray-200 dark:border-border-dark text-sm">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={updateCartItemMutation.isPending || item.quantity >= item.product.stock}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => removeCartItemMutation.mutate(item.id)}
                          disabled={removeCartItemMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          ${(parseFloat(item.product.salePrice || item.product.price) * item.quantity).toFixed(2)}
                        </p>
                        <p className="text-sm text-neutral">
                          ${item.product.salePrice || item.product.price} each
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Coupon Section */}
          <Card className="mt-6">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center">
                <Tag className="h-4 w-4 mr-2" />
                Apply Coupon
              </h3>
              <div className="flex space-x-3">
                <Input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1"
                />
                <Button 
                  onClick={applyCoupon}
                  disabled={!couponCode.trim() || applyCouponMutation.isPending}
                >
                  Apply
                </Button>
              </div>
              {appliedCoupon && (
                <div className="mt-3 flex items-center justify-between p-3 bg-success bg-opacity-10 rounded-lg">
                  <p className="text-sm text-success">
                    ✓ Coupon "{appliedCoupon.code}" applied - {appliedCoupon.description}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAppliedCoupon(null)}
                    className="text-neutral hover:text-red-500"
                  >
                    Remove
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-success">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-success">Free</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <Link href="/checkout">
                <Button className="w-full" size="lg">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Proceed to Checkout
                </Button>
              </Link>

              <div className="text-center pt-4">
                <p className="text-sm text-neutral mb-3">Secure checkout with</p>
                <div className="flex justify-center space-x-3 text-neutral">
                  <div className="w-8 h-6 bg-blue-600 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">V</span>
                  </div>
                  <div className="w-8 h-6 bg-red-600 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">M</span>
                  </div>
                  <div className="w-8 h-6 bg-blue-500 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">P</span>
                  </div>
                  <div className="w-8 h-6 bg-black rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">A</span>
                  </div>
                </div>
              </div>

              <div className="text-center text-sm text-neutral pt-4 border-t">
                <p>🚚 Free shipping on orders over $50</p>
                <p>↩️ 30-day return policy</p>
                <p>🔒 Secure checkout with SSL encryption</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}