import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAddressSchema, insertOrderSchema } from "@shared/schema";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { 
  CreditCard, 
  MapPin, 
  Package, 
  Shield,
  CheckCircle,
  ArrowLeft
} from "lucide-react";

const checkoutSchema = z.object({
  shippingAddressId: z.string().min(1, "Please select a shipping address"),
  paymentMethod: z.enum(["credit_card", "paypal", "apple_pay"]),
  cardNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  cvv: z.string().optional(),
  cardName: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const [step, setStep] = useState(1);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>("");
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Fetch data
  const { data: cartItems = [] } = useQuery({
    queryKey: ["/api/cart"],
    enabled: !!user,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: addresses = [] } = useQuery({
    queryKey: ["/api/addresses"],
    enabled: !!user,
  });

  // Form
  const checkoutForm = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: "credit_card",
    },
  });

  // Get cart items with product details
  const cartItemsWithProducts = Array.isArray(cartItems)
    ? cartItems.map((item: any) => {
        const product = Array.isArray(products)
          ? products.find((p: any) => (p._id || p.id).toString() === item.productId.toString())
          : null;
        return { ...item, product };
      }).filter((item: any) => item.product)
    : [];

  // Calculate totals
  const subtotal = cartItemsWithProducts.reduce((sum: number, item: any) => {
    const price = parseFloat(item.product.salePrice || item.product.price);
    return sum + (price * item.quantity);
  }, 0);

  const tax = subtotal * 0.08; // 8% tax
  const shipping = subtotal > 50 ? 0 : 9.99;
  const total = subtotal + tax + shipping;

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (data: CheckoutFormData) => {
      const selectedAddress = Array.isArray(addresses) 
        ? addresses.find((addr: any) => (addr._id || addr.id).toString() === data.shippingAddressId)
        : null;
      
      const orderData = {
        userId: user!.id,
        status: "pending",
        subtotal: subtotal.toFixed(2),
        discount: "0.00",
        tax: tax.toFixed(2),
        total: total.toFixed(2),
        shippingAddress: `${selectedAddress?.street}, ${selectedAddress?.city}, ${selectedAddress?.state} ${selectedAddress?.zipCode}`,
        couponCode: null,
      };

      const res = await apiRequest("POST", "/api/orders", orderData);
      const order = await res.json();

      // Create order items
      for (const item of cartItemsWithProducts) {
        await apiRequest("POST", "/api/order-items", {
          orderId: order._id || order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.product.salePrice || item.product.price,
        });
      }

      // Clear cart
      await apiRequest("DELETE", "/api/cart/clear");

      return order;
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setOrderNumber(order.id.toString());
      setOrderPlaced(true);
      toast({ title: "Order placed successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to place order", variant: "destructive" });
    },
  });

  if (!user) {
    setLocation("/auth");
    return <div>Redirecting...</div>;
  }

  if (cartItemsWithProducts.length === 0) {
    setLocation("/cart");
    return <div>Redirecting...</div>;
  }

  const onSubmit = (data: CheckoutFormData) => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else {
      createOrderMutation.mutate(data);
    }
  };

  if (orderPlaced) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <CheckCircle className="h-16 w-16 text-success mx-auto mb-6" />
        <h1 className="text-3xl font-bold mb-4">Order Confirmed!</h1>
        <p className="text-neutral mb-6">
          Thank you for your purchase. Your order #{orderNumber} has been confirmed and will be processed shortly.
        </p>
        <div className="space-y-3">
          <Button onClick={() => setLocation("/profile")} className="w-full">
            View Order Details
          </Button>
          <Button variant="outline" onClick={() => setLocation("/storefront")} className="w-full">
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center mb-8">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/cart")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cart
        </Button>
      </div>

      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <form onSubmit={checkoutForm.handleSubmit(onSubmit)}>
            {/* Step Indicator */}
            <div className="flex items-center mb-8">
              {[1, 2, 3].map((stepNum) => (
                <div key={stepNum} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNum ? "bg-primary text-white" : "bg-gray-200 text-neutral"
                  }`}>
                    {stepNum}
                  </div>
                  {stepNum < 3 && (
                    <div className={`w-16 h-1 ${step > stepNum ? "bg-primary" : "bg-gray-200"}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Shipping Address */}
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!Array.isArray(addresses) || addresses.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-neutral mb-4">No addresses found. Please add a shipping address.</p>
                      <Button onClick={() => setLocation("/profile")}>
                        Add Address
                      </Button>
                    </div>
                  ) : (
                    <RadioGroup
                      value={checkoutForm.watch("shippingAddressId")}
                      onValueChange={(value) => checkoutForm.setValue("shippingAddressId", value)}
                    >
                      {Array.isArray(addresses) && addresses.map((address: any) => {
                        const addressId = (address._id || address.id).toString();
                        return (
                        <div key={addressId} className="flex items-start space-x-3 p-4 border rounded-lg">
                          <RadioGroupItem value={addressId} className="mt-1" />
                          <div className="flex-1">
                            <p className="font-medium">{address.firstName} {address.lastName}</p>
                            <p className="text-sm text-neutral">{address.street}</p>
                            <p className="text-sm text-neutral">{address.city}, {address.state} {address.zipCode}</p>
                          </div>
                        </div>
                        );
                      })}
                    </RadioGroup>
                  )}
                  <Button type="submit" className="w-full" disabled={!checkoutForm.watch("shippingAddressId")}>
                    Continue to Payment
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Payment Method */}
            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <RadioGroup
                    value={checkoutForm.watch("paymentMethod")}
                    onValueChange={(value) => checkoutForm.setValue("paymentMethod", value as any)}
                  >
                    <div className="flex items-center space-x-3 p-4 border rounded-lg">
                      <RadioGroupItem value="credit_card" />
                      <CreditCard className="h-5 w-5" />
                      <span>Credit/Debit Card</span>
                    </div>
                    <div className="flex items-center space-x-3 p-4 border rounded-lg">
                      <RadioGroupItem value="paypal" />
                      <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">P</span>
                      </div>
                      <span>PayPal</span>
                    </div>
                    <div className="flex items-center space-x-3 p-4 border rounded-lg">
                      <RadioGroupItem value="apple_pay" />
                      <div className="w-5 h-5 bg-black rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">A</span>
                      </div>
                      <span>Apple Pay</span>
                    </div>
                  </RadioGroup>

                  {checkoutForm.watch("paymentMethod") === "credit_card" && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input 
                          {...checkoutForm.register("cardNumber")}
                          placeholder="1234 5678 9012 3456"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiryDate">Expiry Date</Label>
                          <Input 
                            {...checkoutForm.register("expiryDate")}
                            placeholder="MM/YY"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvv">CVV</Label>
                          <Input 
                            {...checkoutForm.register("cvv")}
                            placeholder="123"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cardName">Name on Card</Label>
                        <Input 
                          {...checkoutForm.register("cardName")}
                          placeholder="John Doe"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <Button type="button" variant="outline" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button type="submit" className="flex-1">
                      Review Order
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Review Order */}
            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Review Your Order
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Order Items */}
                  <div className="space-y-4">
                    {cartItemsWithProducts.map((item: any) => (
                      <div key={item.id} className="flex items-center space-x-4 py-4 border-b">
                        <img
                          src={item.product.imageUrl || "https://via.placeholder.com/80x80"}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium">{item.product.name}</h4>
                          <p className="text-sm text-neutral">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            ${(parseFloat(item.product.salePrice || item.product.price) * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex space-x-3">
                    <Button type="button" variant="outline" onClick={() => setStep(2)}>
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={createOrderMutation.isPending}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      {createOrderMutation.isPending ? "Placing Order..." : "Place Order"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </form>
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
                  <span>Subtotal ({cartItemsWithProducts.length} items)</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
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

              <div className="text-center text-sm text-neutral pt-4 border-t space-y-2">
                <p className="flex items-center justify-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Secure SSL encryption
                </p>
                <p>🚚 Free shipping on orders over $50</p>
                <p>↩️ 30-day return policy</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}