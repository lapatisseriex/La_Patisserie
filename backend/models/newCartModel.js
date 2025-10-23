import mongoose from 'mongoose';

const newCartItemSchema = new mongoose.Schema({
  productId: {
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
  // Store complete product information for cart display
  productDetails: {
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    image: {
      type: String,
      required: true
    },
    category: {
      type: String
    },
    isActive: {
      type: Boolean,
      default: true
    },
    hasEgg: {
      type: Boolean,
      default: false
    },
    // Ensure we persist which variant is in the cart to adjust stock correctly
    variantIndex: {
      type: Number,
      default: 0
    },
    // Store variants array for free cash calculation
    variants: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    },
    // Quick access to selected variant
    selectedVariant: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const newCartSchema = new mongoose.Schema({
  userId: {
    type: String, // Firebase UID
    required: true,
    unique: true
  },
  items: [newCartItemSchema],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  optimisticConcurrency: true
});

// Include virtuals in JSON/Object outputs for convenience
newCartSchema.set('toJSON', { virtuals: true });
newCartSchema.set('toObject', { virtuals: true });

// Virtual to calculate cart total
newCartSchema.virtual('cartTotal').get(function() {
  return this.items.reduce((total, item) => {
    const price = parseFloat(item.productDetails?.price) || 0;
    const quantity = parseInt(item.quantity) || 0;
    return total + (price * quantity);
  }, 0);
});

// Virtual to calculate total items count
newCartSchema.virtual('cartCount').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Add indexes for faster lookups
newCartSchema.index({ userId: 1 });
newCartSchema.index({ 'items.productId': 1 });
newCartSchema.index({ lastUpdated: -1 });

// Instance method to add or update item
newCartSchema.methods.addOrUpdateItem = async function(productId, quantity, productDetails, { absolute = false } = {}) {
  const existingItemIndex = this.items.findIndex(
    item => item.productId.toString() === productId.toString()
  );

  if (existingItemIndex >= 0) {
    // Update existing item quantity
    if (absolute) {
      this.items[existingItemIndex].quantity = quantity;
    } else {
      this.items[existingItemIndex].quantity += quantity;
    }
    this.items[existingItemIndex].productDetails = productDetails; // Update product details
  } else {
    // Add new item
    this.items.push({
      productId,
      quantity,
      productDetails,
      addedAt: new Date()
    });
  }

  this.lastUpdated = new Date();
  return this.save();
};

// Instance method to update item quantity
newCartSchema.methods.updateItemQuantity = function(productId, quantity) {
  const item = this.items.find(item => item.productId.toString() === productId.toString());
  
  if (!item) {
    throw new Error('Item not found in cart');
  }

  if (quantity <= 0) {
    // Remove item if quantity is 0 or negative
    this.items = this.items.filter(item => item.productId.toString() !== productId.toString());
  } else {
    // Update quantity
    item.quantity = quantity;
  }

  this.lastUpdated = new Date();
  return this.save();
};

// Instance method to remove item
newCartSchema.methods.removeItem = function(productId) {
  const itemIndex = this.items.findIndex(item => item.productId.toString() === productId.toString());
  
  if (itemIndex === -1) {
    throw new Error('Item not found in cart');
  }

  this.items.splice(itemIndex, 1);
  this.lastUpdated = new Date();
  return this.save();
};

// Instance method to clear cart
newCartSchema.methods.clearCart = function() {
  this.items = [];
  this.lastUpdated = new Date();
  return this.save();
};

// Static method to get or create cart for user
newCartSchema.statics.getOrCreateCart = async function(userId) {
  let cart = await this.findOne({ userId });
  
  if (!cart) {
    cart = new this({
      userId,
      items: []
    });
    await cart.save();
  }
  
  return cart;
};

// Ensure indexes for better performance
// Note: userId already has unique: true which creates an index automatically
newCartSchema.index({ 'items.productId': 1 });

const NewCart = mongoose.model('NewCart', newCartSchema);

export default NewCart;