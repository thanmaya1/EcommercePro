import mongoose from "mongoose";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// MongoDB Schemas
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  firstName: String,
  lastName: String,
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: String, required: true },
  salePrice: String,
  sku: { type: String, required: true, unique: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  stock: { type: Number, default: 0 },
  imageUrl: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const reviewSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  total: { type: String, required: true },
  status: { type: String, default: 'pending' },
  shippingAddress: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const orderItemSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  price: { type: String, required: true }
});

const cartItemSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

const wishlistItemSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  createdAt: { type: Date, default: Date.now }
});

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  description: String,
  discountType: { type: String, required: true },
  discountValue: { type: String, required: true },
  minOrderAmount: String,
  maxDiscountAmount: String,
  expiresAt: Date,
  createdAt: { type: Date, default: Date.now }
});

const addressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Models
const User = mongoose.model('User', userSchema);
const Category = mongoose.model('Category', categorySchema);
const Product = mongoose.model('Product', productSchema);
const Review = mongoose.model('Review', reviewSchema);
const Order = mongoose.model('Order', orderSchema);
const OrderItem = mongoose.model('OrderItem', orderItemSchema);
const CartItem = mongoose.model('CartItem', cartItemSchema);
const WishlistItem = mongoose.model('WishlistItem', wishlistItemSchema);
const Coupon = mongoose.model('Coupon', couponSchema);
const Address = mongoose.model('Address', addressSchema);

interface IStorage {
  // User methods
  getUserByUsername(username: string): Promise<any>;
  getUserById(id: string): Promise<any>;
  createUser(user: any): Promise<any>;
  updateUser(id: string, updates: any): Promise<any>;
  deleteUser(id: string): Promise<boolean>;

  // Category methods
  getCategories(): Promise<any[]>;
  getCategory(id: string): Promise<any>;
  createCategory(category: any): Promise<any>;
  updateCategory(id: string, updates: any): Promise<any>;
  deleteCategory(id: string): Promise<boolean>;

  // Product methods
  getProducts(categoryId?: string, search?: string): Promise<any[]>;
  getProduct(id: string): Promise<any>;
  createProduct(product: any): Promise<any>;
  updateProduct(id: string, updates: any): Promise<any>;
  deleteProduct(id: string): Promise<boolean>;

  // Review methods
  getProductReviews(productId: string): Promise<any[]>;
  createReview(review: any): Promise<any>;
  updateReview(id: string, updates: any): Promise<any>;
  deleteReview(id: string): Promise<boolean>;

  // Order methods
  getOrders(): Promise<any[]>;
  getUserOrders(userId: string): Promise<any[]>;
  getOrder(id: string): Promise<any>;
  createOrder(order: any): Promise<any>;
  updateOrderStatus(id: string, status: string): Promise<any>;
  deleteOrder(id: string): Promise<boolean>;

  // Order item methods
  getOrderItems(orderId: string): Promise<any[]>;
  createOrderItem(orderItem: any): Promise<any>;
  updateOrderItem(id: string, updates: any): Promise<any>;
  deleteOrderItem(id: string): Promise<boolean>;

  // Cart methods
  getCartItems(userId: string): Promise<any[]>;
  addToCart(cartItem: any): Promise<any>;
  updateCartItem(id: string, quantity: number): Promise<any>;
  removeFromCart(id: string, userId: string): Promise<boolean>;
  clearCart(userId: string): Promise<void>;

  // Wishlist methods
  getWishlistItems(userId: string): Promise<any[]>;
  addToWishlist(wishlistItem: any): Promise<any>;
  removeFromWishlist(id: string, userId: string): Promise<boolean>;

  // Coupon methods
  getCoupons(): Promise<any[]>;
  getCoupon(id: string): Promise<any>;
  getCouponByCode(code: string): Promise<any>;
  createCoupon(coupon: any): Promise<any>;
  updateCoupon(id: string, updates: any): Promise<any>;
  deleteCoupon(id: string): Promise<boolean>;

  // Address methods
  getUserAddresses(userId: string): Promise<any[]>;
  getAddress(id: string): Promise<any>;
  createAddress(address: any): Promise<any>;
  updateAddress(id: string, updates: any): Promise<any>;
  deleteAddress(id: string, userId: string): Promise<boolean>;

  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is required");
    }

    this.connectToDatabase();

    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  private async connectToDatabase() {
    try {
      await mongoose.connect(process.env.MONGODB_URI!);
      console.log("Connected to MongoDB Atlas");
      await this.seedData();
    } catch (error) {
      console.error("MongoDB connection error:", error);
      throw error;
    }
  }

  private async seedData() {
    try {
      const existingCategories = await Category.countDocuments();
      if (existingCategories > 0) return;

      // Seed categories
      const categories = await Category.insertMany([
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
      ]);

      // Seed products
      await Product.insertMany([
        {
          name: "Premium Wireless Headphones",
          description: "High-quality wireless headphones with noise cancellation",
          price: "199.99",
          salePrice: "159.99",
          sku: "WH-001",
          categoryId: categories[0]._id,
          stock: 50,
          imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
        },
        {
          name: "Smart Watch",
          description: "Feature-rich smartwatch with health tracking",
          price: "299.99",
          sku: "SW-002",
          categoryId: categories[0]._id,
          stock: 30,
          imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
        },
        {
          name: "Designer T-Shirt",
          description: "Premium cotton t-shirt with unique design",
          price: "49.99",
          salePrice: "39.99",
          sku: "TS-003",
          categoryId: categories[1]._id,
          stock: 100,
          imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
        },
        {
          name: "Garden Tools Set",
          description: "Complete set of essential garden tools",
          price: "89.99",
          sku: "GT-004",
          categoryId: categories[2]._id,
          stock: 25,
          imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500",
        },
      ]);

      // Seed coupons
      await Coupon.insertMany([
        {
          code: "WELCOME10",
          description: "10% off for new customers",
          discountType: "percentage",
          discountValue: "10.00",
          minOrderAmount: "50.00",
          maxDiscountAmount: "20.00",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
  async getUserByUsername(username: string): Promise<any> {
    return await User.findOne({ username });
  }

  async getUserById(id: string): Promise<any> {
    return await User.findById(id);
  }

  async createUser(user: any): Promise<any> {
    const newUser = new User(user);
    return await newUser.save();
  }

  async updateUser(id: string, updates: any): Promise<any> {
    return await User.findByIdAndUpdate(id, updates, { new: true });
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await User.findByIdAndDelete(id);
    return !!result;
  }

  // Category methods
  async getCategories(): Promise<any[]> {
    return await Category.find().sort({ name: 1 });
  }

  async getCategory(id: string): Promise<any> {
    return await Category.findById(id);
  }

  async createCategory(category: any): Promise<any> {
    const newCategory = new Category(category);
    return await newCategory.save();
  }

  async updateCategory(id: string, updates: any): Promise<any> {
    return await Category.findByIdAndUpdate(id, updates, { new: true });
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await Category.findByIdAndDelete(id);
    return !!result;
  }

  // Product methods
  async getProducts(categoryId?: string, search?: string): Promise<any[]> {
    let query: any = {};

    if (categoryId) {
      query.categoryId = categoryId;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    return await Product.find(query).sort({ name: 1 });
  }

  async getProduct(id: string): Promise<any> {
    return await Product.findById(id);
  }

  async createProduct(product: any): Promise<any> {
    const newProduct = new Product(product);
    return await newProduct.save();
  }

  async updateProduct(id: string, updates: any): Promise<any> {
    return await Product.findByIdAndUpdate(id, updates, { new: true });
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await Product.findByIdAndDelete(id);
    return !!result;
  }

  // Review methods
  async getProductReviews(productId: string): Promise<any[]> {
    return await Review.find({ productId }).sort({ createdAt: -1 });
  }

  async createReview(review: any): Promise<any> {
    const newReview = new Review(review);
    return await newReview.save();
  }

  async updateReview(id: string, updates: any): Promise<any> {
    return await Review.findByIdAndUpdate(id, updates, { new: true });
  }

  async deleteReview(id: string): Promise<boolean> {
    const result = await Review.findByIdAndDelete(id);
    return !!result;
  }

  // Order methods
  async getOrders(): Promise<any[]> {
    return await Order.find().sort({ createdAt: -1 });
  }

  async getUserOrders(userId: string): Promise<any[]> {
    return await Order.find({ userId }).sort({ createdAt: -1 });
  }

  async getOrder(id: string): Promise<any> {
    return await Order.findById(id);
  }

  async createOrder(order: any): Promise<any> {
    const newOrder = new Order(order);
    return await newOrder.save();
  }

  async updateOrderStatus(id: string, status: string): Promise<any> {
    return await Order.findByIdAndUpdate(id, { status }, { new: true });
  }

  async deleteOrder(id: string): Promise<boolean> {
    const result = await Order.findByIdAndDelete(id);
    return !!result;
  }

  // Order item methods
  async getOrderItems(orderId: string): Promise<any[]> {
    return await OrderItem.find({ orderId });
  }

  async createOrderItem(orderItem: any): Promise<any> {
    const newOrderItem = new OrderItem(orderItem);
    return await newOrderItem.save();
  }

  async updateOrderItem(id: string, updates: any): Promise<any> {
    return await OrderItem.findByIdAndUpdate(id, updates, { new: true });
  }

  async deleteOrderItem(id: string): Promise<boolean> {
    const result = await OrderItem.findByIdAndDelete(id);
    return !!result;
  }

  // Cart methods
  async getCartItems(userId: string): Promise<any[]> {
    return await CartItem.find({ userId }).sort({ createdAt: 1 });
  }

  async addToCart(cartItemData: any) {
    try {
      const existingItem = await CartItem.findOne({
        userId: cartItemData.userId,
        productId: cartItemData.productId
      });

      if (existingItem) {
        existingItem.quantity += cartItemData.quantity;
        return await existingItem.save();
      } else {
        const cartItem = new CartItem(cartItemData);
        return await cartItem.save();
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      throw error;
    }
  }

  async updateCartItem(id: string, quantity: number): Promise<any> {
    return await CartItem.findByIdAndUpdate(id, { quantity }, { new: true });
  }

  async removeFromCart(id: string, userId: string): Promise<boolean> {
    const result = await CartItem.findOneAndDelete({ _id: id, userId });
    return !!result;
  }

  async clearCart(userId: string): Promise<void> {
    await CartItem.deleteMany({ userId });
  }

  // Wishlist methods
  async getWishlistItems(userId: string): Promise<any[]> {
    return await WishlistItem.find({ userId }).sort({ createdAt: 1 });
  }

  async addToWishlist(wishlistItem: any): Promise<any> {
    const newWishlistItem = new WishlistItem(wishlistItem);
    return await newWishlistItem.save();
  }

  async removeFromWishlist(id: string, userId: string): Promise<boolean> {
    const result = await WishlistItem.findOneAndDelete({ _id: id, userId });
    return !!result;
  }

  // Coupon methods
  async getCoupons(): Promise<any[]> {
    return await Coupon.find().sort({ code: 1 });
  }

  async getCoupon(id: string): Promise<any> {
    return await Coupon.findById(id);
  }

  async getCouponByCode(code: string): Promise<any> {
    return await Coupon.findOne({ code });
  }

  async createCoupon(coupon: any): Promise<any> {
    const newCoupon = new Coupon(coupon);
    return await newCoupon.save();
  }

  async updateCoupon(id: string, updates: any): Promise<any> {
    return await Coupon.findByIdAndUpdate(id, updates, { new: true });
  }

  async deleteCoupon(id: string): Promise<boolean> {
    const result = await Coupon.findByIdAndDelete(id);
    return !!result;
  }

  // Address methods
  async getUserAddresses(userId: string): Promise<any[]> {
    return await Address.find({ userId }).sort({ isDefault: -1, createdAt: 1 });
  }

  async getAddress(id: string): Promise<any> {
    return await Address.findById(id);
  }

  async createAddress(address: any): Promise<any> {
    const newAddress = new Address(address);
    return await newAddress.save();
  }

  async updateAddress(id: string, updates: any): Promise<any> {
    return await Address.findByIdAndUpdate(id, updates, { new: true });
  }

  async deleteAddress(id: string, userId: string): Promise<boolean> {
    const result = await Address.findOneAndDelete({ _id: id, userId });
    return !!result;
  }
}

export const storage = new DatabaseStorage();