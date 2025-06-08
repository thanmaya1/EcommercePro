import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReviewSchema } from "@shared/schema";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Star, 
  Heart, 
  ShoppingCart, 
  Plus, 
  Minus,
  Truck,
  RotateCcw,
  Shield,
  ChevronRight
} from "lucide-react";

type ReviewFormData = z.infer<typeof insertReviewSchema>;

export default function ProductDetail() {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch product data
  const { data: product, isLoading } = useQuery({
    queryKey: ["/api/products", id],
    queryFn: () => fetch(`/api/products/${id}`, { credentials: "include" }).then(res => res.json()),
    enabled: !!id,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["/api/products", id, "reviews"],
    queryFn: () => fetch(`/api/products/${id}/reviews`, { credentials: "include" }).then(res => res.json()),
    enabled: !!id,
  });

  const { data: categories = [] } = useQuery({ queryKey: ["/api/categories"] });

  // Review form
  const reviewForm = useForm<ReviewFormData>({
    resolver: zodResolver(insertReviewSchema.omit({ productId: true, userId: true })),
    defaultValues: {
      rating: 5,
      title: "",
      content: "",
    },
  });

  // Mutations
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

  const addToWishlistMutation = useMutation({
    mutationFn: async (productId: number) => {
      const res = await apiRequest("POST", "/api/wishlist", { productId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({ title: "Product added to wishlist" });
    },
    onError: () => {
      toast({ title: "Failed to add product to wishlist", variant: "destructive" });
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: async (data: Omit<ReviewFormData, "productId" | "userId">) => {
      const res = await apiRequest("POST", `/api/products/${id}/reviews`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", id, "reviews"] });
      reviewForm.reset();
      toast({ title: "Review added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add review", variant: "destructive" });
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!product) {
    return <div className="flex items-center justify-center min-h-screen">Product not found</div>;
  }

  const category = categories.find((cat: any) => cat.id === product.categoryId);
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length 
    : 5;

  const renderStars = (rating: number, size: string = "h-4 w-4") => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`${size} ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ));
  };

  const calculateDiscount = (price: string, salePrice?: string | null) => {
    if (!salePrice) return 0;
    const original = parseFloat(price);
    const sale = parseFloat(salePrice);
    return Math.round(((original - sale) / original) * 100);
  };

  // Mock images for demonstration
  const productImages = [
    product.imageUrl || "https://via.placeholder.com/600x600",
    "https://images.unsplash.com/photo-1583394838336-acd977736f90?ixlib=rb-4.0.3&w=150&h=150&fit=crop",
    "https://images.unsplash.com/photo-1484704849700-f032a568e944?ixlib=rb-4.0.3&w=150&h=150&fit=crop",
    "https://images.unsplash.com/photo-1546435770-a3e426bf472b?ixlib=rb-4.0.3&w=150&h=150&fit=crop",
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex mb-8" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          <li><a href="/" className="text-neutral hover:text-primary">Home</a></li>
          <ChevronRight className="h-4 w-4 text-neutral" />
          <li><a href="/storefront" className="text-neutral hover:text-primary">Shop</a></li>
          <ChevronRight className="h-4 w-4 text-neutral" />
          <li><span className="text-neutral">{category?.name}</span></li>
          <ChevronRight className="h-4 w-4 text-neutral" />
          <li><span className="text-primary">{product.name}</span></li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Images */}
        <div>
          <div className="mb-4">
            <img
              src={productImages[selectedImage]}
              alt={product.name}
              className="w-full h-96 object-cover rounded-xl shadow-lg"
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {productImages.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`${product.name} - View ${index + 1}`}
                className={`w-full h-20 object-cover rounded-lg cursor-pointer border-2 transition-colors ${
                  selectedImage === index ? "border-primary" : "border-transparent hover:border-gray-300"
                }`}
                onClick={() => setSelectedImage(index)}
              />
            ))}
          </div>
        </div>

        {/* Product Information */}
        <div>
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <div className="flex mr-2">
                {renderStars(averageRating)}
              </div>
              <span className="text-sm text-neutral">
                {averageRating.toFixed(1)} ({reviews.length} reviews)
              </span>
            </div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <p className="text-neutral mb-4">SKU: {product.sku}</p>
          </div>

          <div className="mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <span className="text-3xl font-bold">
                ${product.salePrice || product.price}
              </span>
              {product.salePrice && (
                <>
                  <span className="text-xl text-neutral line-through">
                    ${product.price}
                  </span>
                  <Badge className="bg-secondary text-white">
                    {calculateDiscount(product.price, product.salePrice)}% OFF
                  </Badge>
                </>
              )}
            </div>
            <p className="text-success font-medium">
              ✓ In Stock ({product.stock} available)
            </p>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-3">Description</h3>
            <p className="text-neutral leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Add to Cart Section */}
          <div className="border-t border-gray-200 dark:border-border-dark pt-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center border border-gray-200 dark:border-border-dark rounded-lg">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="px-4 py-2 border-l border-r border-gray-200 dark:border-border-dark">
                  {quantity}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button
                className="flex-1"
                onClick={() => user && addToCartMutation.mutate({ productId: product.id, quantity })}
                disabled={!user || addToCartMutation.isPending}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => user && addToWishlistMutation.mutate(product.id)}
                disabled={!user}
              >
                <Heart className="h-4 w-4" />
              </Button>
            </div>
            <Button className="w-full bg-secondary hover:bg-orange-600 text-white mb-4">
              Buy Now
            </Button>
            <div className="text-sm text-neutral space-y-1">
              <p className="flex items-center">
                <Truck className="h-4 w-4 mr-2" />
                Free shipping on orders over $50
              </p>
              <p className="flex items-center">
                <RotateCcw className="h-4 w-4 mr-2" />
                30-day return policy
              </p>
              <p className="flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Secure checkout with SSL encryption
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-16">
        <Separator className="mb-8" />
        <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Review Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <div className="text-center mb-4">
                <div className="text-4xl font-bold mb-2">{averageRating.toFixed(1)}</div>
                <div className="flex justify-center mb-2">
                  {renderStars(averageRating)}
                </div>
                <p className="text-neutral">Based on {reviews.length} reviews</p>
              </div>
              
              {user && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">Write a Review</h3>
                  <form onSubmit={reviewForm.handleSubmit((data) => createReviewMutation.mutate(data))} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Rating</label>
                      <Select onValueChange={(value) => reviewForm.setValue("rating", parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select rating" />
                        </SelectTrigger>
                        <SelectContent>
                          {[5, 4, 3, 2, 1].map((rating) => (
                            <SelectItem key={rating} value={rating.toString()}>
                              <div className="flex items-center">
                                <span className="mr-2">{rating}</span>
                                {renderStars(rating, "h-3 w-3")}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Title</label>
                      <input
                        {...reviewForm.register("title")}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-border-dark rounded-lg"
                        placeholder="Review title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Review</label>
                      <Textarea
                        {...reviewForm.register("content")}
                        placeholder="Write your review..."
                        rows={4}
                      />
                    </div>
                    <Button type="submit" disabled={createReviewMutation.isPending}>
                      Submit Review
                    </Button>
                  </form>
                </div>
              )}
            </Card>
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-6">
            {reviews.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-neutral">No reviews yet. Be the first to review this product!</p>
              </Card>
            ) : (
              reviews.map((review: any) => (
                <Card key={review.id} className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center mb-2">
                        <div className="flex mr-2">
                          {renderStars(review.rating)}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          Verified Purchase
                        </Badge>
                      </div>
                      <h4 className="font-medium">Anonymous User</h4>
                    </div>
                    <span className="text-sm text-neutral">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-medium mb-2">{review.title}</h3>
                  <p className="text-neutral">{review.content}</p>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
