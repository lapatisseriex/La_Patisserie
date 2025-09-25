import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  user: {
    type: String, // Firebase UID
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  // Store product details at time of adding to cart (in case product changes)
  productSnapshot: {
    name: String,
    price: Number,
    image: String,
    category: String
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate items per user
cartItemSchema.index({ user: 1, product: 1 }, { unique: true });

// Virtual to calculate item total
cartItemSchema.virtual('itemTotal').get(function() {
  return this.quantity * (this.productSnapshot?.price || 0);
});

// Static method to get user's cart with populated product data
cartItemSchema.statics.getUserCart = async function(userId) {
  // Clean up any existing cart items with old ObjectId format for this user
  try {
    await this.deleteMany({ user: { $type: "objectId" } });
  } catch (err) {
    // Ignore cleanup errors
  }

  return this.find({ user: userId })
    .populate('product', 'name variants images category isActive')
    .sort({ createdAt: -1 });
};

// Static method to add or update cart item
cartItemSchema.statics.addOrUpdateItem = async function(userId, productId, quantity = 1) {
  // Clean up any existing cart items with old ObjectId format for this user
  try {
    await this.deleteMany({ user: { $type: "objectId" } });
  } catch (err) {
    // Ignore cleanup errors
    console.log('Cleaned up old cart format');
  }

  // First get product details
  const Product = mongoose.model('Product');
  const product = await Product.findById(productId);
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  if (!product.isActive) {
    throw new Error('Product is not available');
  }
  
  if (product.stock < quantity) {
    throw new Error('Insufficient stock');
  }

  // Get price from the first variant (assuming single variant for now)
  const productPrice = product.variants && product.variants.length > 0 
    ? product.variants[0].price 
    : 0;

  const productSnapshot = {
    name: product.name,
    price: productPrice,
    image: product.images && product.images.length > 0 ? product.images[0] : null,
    category: product.category
  };

  // Try to update existing item or create new one
  const existingItem = await this.findOne({ user: userId, product: productId });
  
  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;
    if (newQuantity > product.stock) {
      throw new Error('Insufficient stock');
    }
    
    existingItem.quantity = newQuantity;
    existingItem.productSnapshot = productSnapshot; // Update snapshot
    return await existingItem.save();
  } else {
    return await this.create({
      user: userId,
      product: productId,
      quantity,
      productSnapshot
    });
  }
};

// Static method to update item quantity
cartItemSchema.statics.updateItemQuantity = async function(userId, itemId, quantity) {
  const item = await this.findOne({ _id: itemId, user: userId }).populate('product');
  
  if (!item) {
    throw new Error('Cart item not found');
  }
  
  if (quantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }
  
  if (item.product && quantity > item.product.stock) {
    throw new Error('Insufficient stock');
  }
  
  item.quantity = quantity;
  return await item.save();
};

// Static method to remove item
cartItemSchema.statics.removeItem = async function(userId, itemId) {
  const result = await this.deleteOne({ _id: itemId, user: userId });
  
  if (result.deletedCount === 0) {
    throw new Error('Cart item not found');
  }
  
  return result;
};

// Static method to clear user's cart
cartItemSchema.statics.clearUserCart = async function(userId) {
  return await this.deleteMany({ user: userId });
};

// Static method to get cart summary
cartItemSchema.statics.getCartSummary = async function(userId) {
  const cartItems = await this.getUserCart(userId);
  
  const summary = {
    items: cartItems,
    itemCount: cartItems.length,
    totalQuantity: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: cartItems.reduce((sum, item) => {
      // Priority: productSnapshot.price > first variant price > 0
      const price = item.productSnapshot?.price || 
        (item.product?.variants?.[0]?.price) || 0;
      return sum + (item.quantity * price);
    }, 0)
  };
  
  return summary;
};

const CartItem = mongoose.model('CartItem', cartItemSchema);

export default CartItem;