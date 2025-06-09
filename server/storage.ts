
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and, desc, ilike, or } from "drizzle-orm";
import {
  users,
  categories,
  products,
  reviews,
  orders,
  orderItems,
  cartItems,
  wishlistItems,
  coupons,
  addresses,
  type User,
  type InsertUser,
  type Category,
  type InsertCategory,
  type Product,
  type InsertProduct,
  type Review,
  type InsertReview,
  type Order,
  type InsertOrder,
  type OrderItem,
  type CartItem,
  type InsertCartItem,
  type WishlistItem,
  type InsertWishlistItem,
  type Coupon,
  type InsertCoupon,
  type Address,
  type InsertAddress,
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

interface IStorage {
  // User methods
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Category methods
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, updates: Partial<Category>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  // Product methods
  getProducts(categoryId?: number, search?: string): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, updates: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;

  // Review methods
  getProductReviews(productId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: number, updates: Partial<Review>): Promise<Review | undefined>;
  deleteReview(id: number): Promise<boolean>;

  // Order methods
  getOrders(): Promise<Order[]>;
  getUserOrders(userId: number): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<boolean>;

  // Order item methods
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrderItem(orderItem: any): Promise<OrderItem>;
  updateOrderItem(id: number, updates: Partial<OrderItem>): Promise<OrderItem | undefined>;
  deleteOrderItem(id: number): Promise<boolean>;

  // Cart methods
  getCartItems(userId: number): Promise<CartItem[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: number, userId: number): Promise<boolean>;
  clearCart(userId: number): Promise<void>;

  // Wishlist methods
  getWishlistItems(userId: number): Promise<WishlistItem[]>;
  addToWishlist(wishlistItem: InsertWishlistItem): Promise<WishlistItem>;
  removeFromWishlist(id: number, userId: number): Promise<boolean>;

  // Coupon methods
  getCoupons(): Promise<Coupon[]>;
  getCoupon(id: number): Promise<Coupon | undefined>;
  getCouponByCode(code: string): Promise<Coupon | undefined>;
  createCoupon(coupon: InsertCoupon): Promise<Coupon>;
  updateCoupon(id: number, updates: Partial<Coupon>): Promise<Coupon | undefined>;
  deleteCoupon(id: number): Promise<boolean>;

  // Address methods
  getUserAddresses(userId: number): Promise<Address[]>;
  getAddress(id: number): Promise<Address | undefined>;
  createAddress(address: InsertAddress): Promise<Address>;
  updateAddress(id: number, updates: Partial<Address>): Promise<Address | undefined>;
  deleteAddress(id: number, userId: number): Promise<boolean>;

  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  private db: any;
  sessionStore: any;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required");
    }

    const sql = neon(process.env.DATABASE_URL);
    this.db = drizzle(sql);

    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    this.seedData();
  }

  private async seedData() {
    try {
      // Check if data already exists
      const existingCategories = await this.db.select().from(categories).limit(1);
      if (existingCategories.length > 0) return;

      // Seed categories
      const [electronicsCategory, fashionCategory, homeCategory] = await this.db
        .insert(categories)
        .values([
          {
            name: "Electronics",
            description: "Electronic devices and accessories",
          },
          {
            name: "Fashion",
            description: "Clothing and accessories",
          },
          {
            name: "Home & Garden",
            description: "Home improvement and garden supplies",
          },
        ])
        .returning();

      // Seed products
      await this.db.insert(products).values([
        {
          name: "Premium Wireless Headphones",
          description: "High-quality wireless headphones with noise cancellation",
          price: "199.99",
          salePrice: "159.99",
          sku: "WH-001",
          categoryId: electronicsCategory.id,
          stock: 50,
          imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
        },
        {
          name: "Smart Watch",
          description: "Feature-rich smartwatch with health tracking",
          price: "299.99",
          sku: "SW-002",
          categoryId: electronicsCategory.id,
          stock: 30,
          imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
        },
        {
          name: "Designer T-Shirt",
          description: "Premium cotton t-shirt with unique design",
          price: "49.99",
          salePrice: "39.99",
          sku: "TS-003",
          categoryId: fashionCategory.id,
          stock: 100,
          imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
        },
        {
          name: "Garden Tools Set",
          description: "Complete set of essential garden tools",
          price: "89.99",
          sku: "GT-004",
          categoryId: homeCategory.id,
          stock: 25,
          imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500",
        },
      ]);

      // Seed coupons
      await this.db.insert(coupons).values([
        {
          code: "WELCOME10",
          description: "10% off for new customers",
          discountType: "percentage",
          discountValue: "10.00",
          minOrderAmount: "50.00",
          maxDiscountAmount: "20.00",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
        {
          code: "SAVE20",
          description: "$20 off orders over $100",
          discountType: "fixed",
          discountValue: "20.00",
          minOrderAmount: "100.00",
        },
      ]);
    } catch (error) {
      console.error("Error seeding data:", error);
    }
  }

  // User methods
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    return result[0];
  }

  async getUserById(id: number): Promise<User | undefined> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const result = await this.db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await this.db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return await this.db.select().from(categories).orderBy(categories.name);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const result = await this.db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    return result[0];
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const result = await this.db.insert(categories).values(category).returning();
    return result[0];
  }

  async updateCategory(id: number, updates: Partial<Category>): Promise<Category | undefined> {
    const result = await this.db
      .update(categories)
      .set(updates)
      .where(eq(categories.id, id))
      .returning();
    return result[0];
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await this.db.delete(categories).where(eq(categories.id, id));
    return result.rowCount > 0;
  }

  // Product methods
  async getProducts(categoryId?: number, search?: string): Promise<Product[]> {
    let query = this.db.select().from(products);

    if (categoryId) {
      query = query.where(eq(products.categoryId, categoryId));
    }

    if (search) {
      const searchTerm = `%${search}%`;
      query = query.where(
        or(
          ilike(products.name, searchTerm),
          ilike(products.description, searchTerm)
        )
      );
    }

    return await query.orderBy(products.name);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const result = await this.db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    return result[0];
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const result = await this.db.insert(products).values(product).returning();
    return result[0];
  }

  async updateProduct(id: number, updates: Partial<Product>): Promise<Product | undefined> {
    const result = await this.db
      .update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();
    return result[0];
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await this.db.delete(products).where(eq(products.id, id));
    return result.rowCount > 0;
  }

  // Review methods
  async getProductReviews(productId: number): Promise<Review[]> {
    return await this.db
      .select()
      .from(reviews)
      .where(eq(reviews.productId, productId))
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const result = await this.db.insert(reviews).values(review).returning();
    return result[0];
  }

  async updateReview(id: number, updates: Partial<Review>): Promise<Review | undefined> {
    const result = await this.db
      .update(reviews)
      .set(updates)
      .where(eq(reviews.id, id))
      .returning();
    return result[0];
  }

  async deleteReview(id: number): Promise<boolean> {
    const result = await this.db.delete(reviews).where(eq(reviews.id, id));
    return result.rowCount > 0;
  }

  // Order methods
  async getOrders(): Promise<Order[]> {
    return await this.db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getUserOrders(userId: number): Promise<Order[]> {
    return await this.db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const result = await this.db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);
    return result[0];
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const result = await this.db.insert(orders).values(order).returning();
    return result[0];
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const result = await this.db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return result[0];
  }

  async deleteOrder(id: number): Promise<boolean> {
    const result = await this.db.delete(orders).where(eq(orders.id, id));
    return result.rowCount > 0;
  }

  // Order item methods
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await this.db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(orderItem: any): Promise<OrderItem> {
    const result = await this.db.insert(orderItems).values(orderItem).returning();
    return result[0];
  }

  async updateOrderItem(id: number, updates: Partial<OrderItem>): Promise<OrderItem | undefined> {
    const result = await this.db
      .update(orderItems)
      .set(updates)
      .where(eq(orderItems.id, id))
      .returning();
    return result[0];
  }

  async deleteOrderItem(id: number): Promise<boolean> {
    const result = await this.db.delete(orderItems).where(eq(orderItems.id, id));
    return result.rowCount > 0;
  }

  // Cart methods
  async getCartItems(userId: number): Promise<CartItem[]> {
    return await this.db
      .select()
      .from(cartItems)
      .where(eq(cartItems.userId, userId))
      .orderBy(cartItems.createdAt);
  }

  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const existing = await this.db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.userId, cartItem.userId),
          eq(cartItems.productId, cartItem.productId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update quantity if item exists
      const result = await this.db
        .update(cartItems)
        .set({ quantity: existing[0].quantity + cartItem.quantity })
        .where(eq(cartItems.id, existing[0].id))
        .returning();
      return result[0];
    } else {
      // Insert new item
      const result = await this.db.insert(cartItems).values(cartItem).returning();
      return result[0];
    }
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem | undefined> {
    const result = await this.db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    return result[0];
  }

  async removeFromCart(id: number, userId: number): Promise<boolean> {
    const result = await this.db
      .delete(cartItems)
      .where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)));
    return result.rowCount > 0;
  }

  async clearCart(userId: number): Promise<void> {
    await this.db.delete(cartItems).where(eq(cartItems.userId, userId));
  }

  // Wishlist methods
  async getWishlistItems(userId: number): Promise<WishlistItem[]> {
    return await this.db
      .select()
      .from(wishlistItems)
      .where(eq(wishlistItems.userId, userId))
      .orderBy(wishlistItems.createdAt);
  }

  async addToWishlist(wishlistItem: InsertWishlistItem): Promise<WishlistItem> {
    const result = await this.db.insert(wishlistItems).values(wishlistItem).returning();
    return result[0];
  }

  async removeFromWishlist(id: number, userId: number): Promise<boolean> {
    const result = await this.db
      .delete(wishlistItems)
      .where(and(eq(wishlistItems.id, id), eq(wishlistItems.userId, userId)));
    return result.rowCount > 0;
  }

  // Coupon methods
  async getCoupons(): Promise<Coupon[]> {
    return await this.db.select().from(coupons).orderBy(coupons.code);
  }

  async getCoupon(id: number): Promise<Coupon | undefined> {
    const result = await this.db
      .select()
      .from(coupons)
      .where(eq(coupons.id, id))
      .limit(1);
    return result[0];
  }

  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    const result = await this.db
      .select()
      .from(coupons)
      .where(eq(coupons.code, code))
      .limit(1);
    return result[0];
  }

  async createCoupon(coupon: InsertCoupon): Promise<Coupon> {
    const result = await this.db.insert(coupons).values(coupon).returning();
    return result[0];
  }

  async updateCoupon(id: number, updates: Partial<Coupon>): Promise<Coupon | undefined> {
    const result = await this.db
      .update(coupons)
      .set(updates)
      .where(eq(coupons.id, id))
      .returning();
    return result[0];
  }

  async deleteCoupon(id: number): Promise<boolean> {
    const result = await this.db.delete(coupons).where(eq(coupons.id, id));
    return result.rowCount > 0;
  }

  // Address methods
  async getUserAddresses(userId: number): Promise<Address[]> {
    return await this.db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, userId))
      .orderBy(addresses.isDefault, addresses.createdAt);
  }

  async getAddress(id: number): Promise<Address | undefined> {
    const result = await this.db
      .select()
      .from(addresses)
      .where(eq(addresses.id, id))
      .limit(1);
    return result[0];
  }

  async createAddress(address: InsertAddress): Promise<Address> {
    const result = await this.db.insert(addresses).values(address).returning();
    return result[0];
  }

  async updateAddress(id: number, updates: Partial<Address>): Promise<Address | undefined> {
    const result = await this.db
      .update(addresses)
      .set(updates)
      .where(eq(addresses.id, id))
      .returning();
    return result[0];
  }

  async deleteAddress(id: number, userId: number): Promise<boolean> {
    const result = await this.db
      .delete(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId)));
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
