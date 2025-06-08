import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Moon, Sun, ShoppingCart, Heart, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const navItems = [
  { path: "/admin", label: "Admin Dashboard", adminOnly: true },
  { path: "/", label: "Storefront" },
  { path: "/cart", label: "Shopping Cart" },
  { path: "/profile", label: "User Profile" },
];

export function Navbar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const { data: cartItems = [] } = useQuery({
    queryKey: ["/api/cart"],
    enabled: !!user,
  });

  const { data: wishlistItems = [] } = useQuery({
    queryKey: ["/api/wishlist"],
    enabled: !!user,
  });

  const cartCount = cartItems?.length || 0;
  const wishlistCount = wishlistItems?.length || 0;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const filteredNavItems = navItems.filter(item => 
    !item.adminOnly || (item.adminOnly && user?.isAdmin)
  );

  return (
    <header className="bg-white dark:bg-card-dark shadow-sm border-b border-gray-200 dark:border-border-dark sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <Link href="/">
                <h1 className="text-2xl font-bold text-primary cursor-pointer">ShopMaster</h1>
              </Link>
            </div>
            <nav className="hidden md:flex space-x-8">
              {filteredNavItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant="ghost"
                    className={`text-neutral hover:text-primary border-b-2 border-transparent hover:border-primary pb-2 transition-colors rounded-none ${
                      location === item.path ? "text-primary border-primary" : ""
                    }`}
                  >
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {user && (
              <>
                <Link href="/wishlist">
                  <Button variant="ghost" size="icon" className="relative">
                    <Heart className="h-5 w-5" />
                    {wishlistCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-secondary text-white text-xs">
                        {wishlistCount}
                      </Badge>
                    )}
                  </Button>
                </Link>

                <Link href="/cart">
                  <Button variant="ghost" size="icon" className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-primary text-white text-xs">
                        {cartCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
              </>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary text-white text-sm font-medium">
                        {getInitials(user.firstName, user.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block">{user.firstName} {user.lastName}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  {user.isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">Admin Dashboard</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth">
                <Button>Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
