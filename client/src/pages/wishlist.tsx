import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { 
  Heart, 
  ShoppingCart, 
  Star, 
  Trash2,
  ArrowLeft
} from "lucide-react";

export default function WishlistPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch data
  const { data: wishlistItems = [], isLoading } = useQuery({
    queryKey: ["/api/wishlist"],
    enabled: !!user,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  // Mutations
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
          <p className="text-neutral mb-4">You need to be signed in to view your wishlist.</p>
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
          <Heart className="h-12 w-12 text-neutral mx-auto mb-4" />
          <p>Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  // Get wishlist items with product details
  const wishlistItemsWithProducts = Array.isArray(wishlistItems) 
    ? wishlistItems.map((item: any) => {
        const product = Array.isArray(products) 
          ? products.find((p: any) => p.id === item.productId)
          : null;
        return { ...item, product };
      }).filter((item: any) => item.product)
    : [];

  const renderStars = (rating: number = 5) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ));
  };

  const calculateDiscount = (price: string, salePrice?: string | null) => {
    if (!salePrice) return 0;
    const original = parseFloat(price);
    const sale = parseFloat(salePrice);
    return Math.round(((original - sale) / original) * 100);
  };

  if (wishlistItemsWithProducts.length === 0) {
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

        <div className="text-center py-16">
          <Heart className="h-24 w-24 text-neutral mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Your wishlist is empty</h2>
          <p className="text-neutral mb-8">Save items you love for later by adding them to your wishlist.</p>
          <Link href="/storefront">
            <Button size="lg">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Start Shopping
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

      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">My Wishlist</h2>
          <p className="text-neutral">Items you've saved for later</p>
        </div>
        <div className="text-neutral">
          {wishlistItemsWithProducts.length} item{wishlistItemsWithProducts.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {wishlistItemsWithProducts.map((item: any) => (
          <Card key={item.id} className="group hover:shadow-md transition-shadow">
            <div className="relative">
              <img
                src={item.product.imageUrl || "https://via.placeholder.com/400x300"}
                alt={item.product.name}
                className="w-full h-48 object-cover rounded-t-xl"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeWishlistItemMutation.mutate(item.id)}
                disabled={removeWishlistItemMutation.isPending}
                className="absolute top-3 right-3 rounded-full bg-white dark:bg-card-dark shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              {item.product.salePrice && (
                <Badge className="absolute top-3 left-3 bg-secondary text-white">
                  {calculateDiscount(item.product.price, item.product.salePrice)}% OFF
                </Badge>
              )}
            </div>
            <CardContent className="p-4">
              <div className="flex items-center mb-2">
                <div className="flex mr-2">
                  {renderStars(5)}
                </div>
                <span className="text-sm text-neutral">(124 reviews)</span>
              </div>
              <Link href={`/product/${(item.product._id || item.product.id).toString()}`}>
                <h3 className="font-medium mb-2 hover:text-primary cursor-pointer">
                  {item.product.name}
                </h3>
              </Link>
              <p className="text-sm text-neutral mb-3 line-clamp-2">
                {item.product.description}
              </p>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold">
                    ${item.product.salePrice || item.product.price}
                  </span>
                  {item.product.salePrice && (
                    <span className="text-sm text-neutral line-through">
                      ${item.product.price}
                    </span>
                  )}
                </div>
                {item.product.stock > 0 ? (
                  <Badge variant="secondary" className="text-xs bg-success text-white">
                    In Stock
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    Out of Stock
                  </Badge>
                )}
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => addToCartMutation.mutate({ productId: item.product.id, quantity: 1 })}
                  disabled={addToCartMutation.isPending || item.product.stock <= 0}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
                <Link href={`/product/${item.product.id}`}>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}