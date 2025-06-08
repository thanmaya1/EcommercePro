import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Heart, 
  Star, 
  Filter,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export default function Storefront() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch data
  const { data: products = [] } = useQuery({
    queryKey: ["/api/products", selectedCategory, searchQuery],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append("categoryId", selectedCategory);
      if (searchQuery) params.append("search", searchQuery);
      return fetch(`/api/products?${params}`, { credentials: "include" }).then(res => res.json());
    },
  });

  const { data: categories = [] } = useQuery({ queryKey: ["/api/categories"] });

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

  const filteredProducts = products.filter((product: any) => {
    const price = parseFloat(product.salePrice || product.price);
    const minPrice = priceRange.min ? parseFloat(priceRange.min) : 0;
    const maxPrice = priceRange.max ? parseFloat(priceRange.max) : Infinity;
    return price >= minPrice && price <= maxPrice;
  });

  const itemsPerPage = 9;
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">Shop Products</h2>
          <p className="text-neutral">Discover our curated collection of premium products</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-64"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-neutral" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-24">
            <h3 className="font-semibold mb-4 flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </h3>
            
            {/* Category Filter */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Categories</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="all-categories"
                    checked={selectedCategory === ""}
                    onCheckedChange={() => setSelectedCategory("")}
                  />
                  <Label htmlFor="all-categories" className="text-sm">All Categories</Label>
                </div>
                {categories.map((category: any) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category.id}`}
                      checked={selectedCategory === category.id.toString()}
                      onCheckedChange={() => setSelectedCategory(
                        selectedCategory === category.id.toString() ? "" : category.id.toString()
                      )}
                    />
                    <Label htmlFor={`category-${category.id}`} className="text-sm">
                      {category.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="my-6" />

            {/* Price Filter */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Price Range</h4>
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                    className="w-full"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                    className="w-full"
                  />
                </div>
                <Button
                  onClick={() => setPriceRange({ min: "", max: "" })}
                  variant="outline"
                  className="w-full"
                >
                  Clear Price Filter
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Product Grid */}
        <div className="lg:col-span-3">
          <div className="flex justify-between items-center mb-6">
            <p className="text-neutral">Showing {filteredProducts.length} products</p>
            <Select defaultValue="featured">
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Sort by: Featured</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Customer Rating</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {paginatedProducts.map((product: any) => (
              <Card key={product.id} className="group hover:shadow-md transition-shadow">
                <div className="relative">
                  <img
                    src={product.imageUrl || "https://via.placeholder.com/400x300"}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-t-xl"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => user && addToWishlistMutation.mutate(product.id)}
                    disabled={!user}
                    className="absolute top-3 right-3 rounded-full bg-white dark:bg-card-dark shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                  {product.salePrice && (
                    <Badge className="absolute top-3 left-3 bg-secondary text-white">
                      {calculateDiscount(product.price, product.salePrice)}% OFF
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
                  <Link href={`/product/${product.id}`}>
                    <h3 className="font-medium mb-2 hover:text-primary cursor-pointer">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-sm text-neutral mb-3 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold">
                        ${product.salePrice || product.price}
                      </span>
                      {product.salePrice && (
                        <span className="text-sm text-neutral line-through">
                          ${product.price}
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => user && addToCartMutation.mutate({ productId: product.id, quantity: 1 })}
                      disabled={!user || addToCartMutation.isPending}
                    >
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <nav className="flex space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="icon"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
