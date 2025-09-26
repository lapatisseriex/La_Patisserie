import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
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

const cartSchema = new mongoose.Schema({
  user: {
    type: String, // Firebase UID
    required: true,
    unique: true
  },
  items: [cartItemSchema]
}, {
  timestamps: true
});

// Virtual to calculate item total for individual cart items
cartItemSchema.virtual('itemTotal').get(function() {
  return this.quantity * (this.productSnapshot?.price || 0);
});

// Virtual to calculate cart total
cartSchema.virtual('total').get(function() {
  return this.items.reduce((sum, item) => sum + (item.quantity * (item.productSnapshot?.price || 0)), 0);
});

// Virtual to calculate total quantity
cartSchema.virtual('totalQuantity').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Static method to get user's cart with populated product data
cartSchema.statics.getUserCart = async function(userId) {
  // Clean up any old CartItem documents from previous schema
  try {
    const CartItem = mongoose.models.CartItem;
    if (CartItem) {
      await CartItem.deleteMany({ user: userId });
    }
  } catch (error) {
    // Ignore cleanup errors
    console.log('Cleaned up old cart items for user:', userId);
  }

  let cart = await this.findOne({ user: userId })
    .populate('items.product', 'name variants images category isActive');
  
  if (!cart) {
    // Create empty cart if doesn't exist
    cart = await this.create({ user: userId, items: [] });
  }
  
  return cart;
};

// Static method to add or update cart item
cartSchema.statics.addOrUpdateItem = async function(userId, productId, quantity = 1) {
  console.log('🛒 addOrUpdateItem called:', { userId, productId, quantity });
  
  // First get product details
  const Product = mongoose.model('Product');
  const product = await Product.findById(productId);
  
  console.log('📦 Product found:', product ? product.name : 'Not found');
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  if (!product.isActive) {
    throw new Error('Product is not available');
  }
  
  // Calculate total stock from variants (matching frontend logic)
  const totalStock = product.variants && product.variants.length > 0 
    ? product.variants[0].stock 
    : 0;
    
  console.log('📊 Stock check:', { productName: product.name, totalStock, requestedQuantity: quantity });
  
  if (totalStock < quantity) {
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

  // Get or create cart
  let cart = await this.findOne({ user: userId });
  console.log('🛒 Existing cart:', cart ? `Found with ${cart.items.length} items` : 'Not found, creating new');
  
  if (!cart) {
    cart = await this.create({ user: userId, items: [] });
    console.log('✅ Created new cart for user:', userId);
  }

  // Check if item already exists in cart
  const existingItemIndex = cart.items.findIndex(item => 
    item.product.toString() === productId.toString()
  );
  
  console.log('🔍 Existing item index:', existingItemIndex);
  
  if (existingItemIndex >= 0) {
    const newQuantity = cart.items[existingItemIndex].quantity + quantity;
    if (newQuantity > totalStock) {
      throw new Error('Insufficient stock');
    }
    
    cart.items[existingItemIndex].quantity = newQuantity;
    cart.items[existingItemIndex].productSnapshot = productSnapshot; // Update snapshot
    console.log('🔄 Updated existing item quantity');
  } else {
    cart.items.push({
      product: productId,
      quantity,
      productSnapshot
    });
    console.log('➕ Added new item to cart');
  }

  const savedCart = await cart.save();
  console.log('💾 Cart saved successfully, total items:', savedCart.items.length);
  return savedCart;
};

// Static method to update item quantity
cartSchema.statics.updateItemQuantity = async function(userId, itemId, quantity) {
  const cart = await this.findOne({ user: userId }).populate('items.product');
  
  if (!cart) {
    throw new Error('Cart not found');
  }
  
  const item = cart.items.find(item => item._id.toString() === itemId.toString());
  
  if (!item) {
    throw new Error('Cart item not found');
  }
  
  if (quantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }
  
  // Calculate total stock from variants (matching frontend logic)
  const totalStock = item.product && item.product.variants && item.product.variants.length > 0 
    ? item.product.variants[0].stock 
    : 0;
    
  if (quantity > totalStock) {
    throw new Error('Insufficient stock');
  }
  
  item.quantity = quantity;
  return await cart.save();
};

// Static method to remove item
cartSchema.statics.removeItem = async function(userId, itemId) {
  const cart = await this.findOne({ user: userId });
  
  if (!cart) {
    throw new Error('Cart not found');
  }
  
  const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId.toString());
  
  if (itemIndex === -1) {
    throw new Error('Cart item not found');
  }
  
  cart.items.splice(itemIndex, 1);
  return await cart.save();
};

// Static method to clear user's cart
cartSchema.statics.clearUserCart = async function(userId) {
  const cart = await this.findOne({ user: userId });
  
  if (!cart) {
    return null;
  }
  
  cart.items = [];
  return await cart.save();
};

// Static method to get cart summary
cartSchema.statics.getCartSummary = async function(userId) {
  const cart = await this.getUserCart(userId);
  
  const summary = {
    items: cart.items,
    itemCount: cart.items.length,
    totalQuantity: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: cart.items.reduce((sum, item) => {
      // Priority: productSnapshot.price > first variant price > 0
      const price = item.productSnapshot?.price || 
        (item.product?.variants?.[0]?.price) || 0;
      return sum + (item.quantity * price);
    }, 0)
  };
  
  return summary;
};

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;