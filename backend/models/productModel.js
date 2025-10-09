import mongoose from 'mongoose';

// Variant schema
const variantSchema = new mongoose.Schema({
  quantity: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  measuringUnit: { 
    type: String, 
    enum: ['g', 'kg', 'lb', 'oz'], 
    default: 'g' 
  },
  price: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  // New pricing calculator fields
  costPrice: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  profitWanted: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  freeCashExpected: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  // Discount percentage for calculation
  discountPercentage: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
  },
  discount: {
    type: { type: String, enum: ['flat', 'percentage', null], default: null },
    value: { type: Number, default: 0, min: 0 }
  },
  stock: { type: Number, default: 0, min: 0 },
  // Per-variant stock tracking toggle
  isStockActive: { type: Boolean, default: false },
}, { _id: false });

// Product schema
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    id: { type: String, unique: true },
    description: { type: String, trim: true },
    images: { type: [String], default: [] },
    videos: { type: [String], default: [] },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    tags: { type: [String], default: [] },
    isVeg: { type: Boolean, default: true },
    hasEgg: { type: Boolean, default: false }, // New field for egg/non-egg indicator
    variants: { type: [variantSchema], default: [] },
    cancelOffer: { type: Boolean, default: false },
    importantField: {
      name: { type: String, trim: true },
      value: { type: String, trim: true }
    },
    extraFields: { type: Map, of: String, default: {} },
    isActive: { type: Boolean, default: true },
    badge: { type: String, trim: true },
    // Track total number of times this product has been ordered
    totalOrderCount: { type: Number, default: 0, min: 0 },
    // Track when the count was last updated
    lastOrderCountUpdate: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Virtual for featured image
productSchema.virtual('featuredImage').get(function() {
  return this.images && this.images.length > 0 ? this.images[0] : null;
});

// Removed product-level stock tracking; tracking is strictly per-variant now.

// Virtual for total stock (sum of all variant stocks)
productSchema.virtual('stock').get(function() {
  if (!this.variants || this.variants.length === 0) return 0;
  return this.variants.reduce((total, variant) => total + (variant.stock || 0), 0);
});

// Method to calculate MRP for a variant using correct admin pricing logic
productSchema.methods.calculateMRP = function(variantIndex = 0) {
  const variant = this.variants[variantIndex];
  if (!variant) return 0;

  const { costPrice = 0, profitWanted = 0, freeCashExpected = 0, discount = {} } = variant;
  
  // Calculate base selling price (what seller gets)
  const baseSelling = costPrice + profitWanted;
  
  // Calculate final price (what customer pays before discount)
  const finalPrice = baseSelling + freeCashExpected;
  
  // Calculate MRP based on discount type
  if (discount.type === 'flat') {
    return finalPrice + (discount.value || 0);
  } else if (discount.type === 'percentage') {
    const discountPercentage = discount.value || 0;
    // Prevent division by zero and cap at 99%
    const safeDiscountPercentage = Math.min(Math.max(0, discountPercentage), 99);
    if (safeDiscountPercentage > 0) {
      return finalPrice / (1 - safeDiscountPercentage / 100);
    }
    return finalPrice;
  } else {
    return finalPrice; // No discount
  }
};

// Method to calculate safe selling price for a variant (legacy support)
productSchema.methods.calculateSafeSellingPrice = function(variantIndex = 0) {
  // For backward compatibility, return MRP
  return this.calculateMRP(variantIndex);
};

// Method to get complete pricing breakdown for a variant
productSchema.methods.getVariantPricingBreakdown = function(variantIndex = 0) {
  const variant = this.variants[variantIndex];
  if (!variant) return null;

  const { 
    costPrice = 0, 
    profitWanted = 0, 
    freeCashExpected = 0, 
    price = 0, 
    discount = {} 
  } = variant;
  
  // Calculate using corrected pricing logic
  const baseSelling = costPrice + profitWanted; // What seller gets
  const finalPrice = baseSelling + freeCashExpected; // What customer pays before discount
  let mrp = finalPrice;
  let effectiveDiscountPercentage = 0;
  
  if (discount.type === 'flat') {
    const discountValue = Math.max(0, discount.value || 0);
    mrp = finalPrice + discountValue;
    effectiveDiscountPercentage = mrp > 0 ? Math.round((discountValue / mrp) * 100) : 0;
  } else if (discount.type === 'percentage') {
    const discountPercentage = Math.min(Math.max(0, discount.value || 0), 99); // Cap at 99%
    if (discountPercentage > 0) {
      mrp = finalPrice / (1 - discountPercentage / 100);
    }
    effectiveDiscountPercentage = discountPercentage;
  }
  
  // Legacy discount calculation for backward compatibility (using variant.price)
  let actualDiscount = 0;
  let discountedPrice = price;
  
  if (discount.type && !this.cancelOffer) {
    if (discount.type === 'percentage') {
      actualDiscount = discount.value || 0;
      discountedPrice = price * (1 - actualDiscount / 100);
    } else if (discount.type === 'flat') {
      const flatDiscount = discount.value || 0;
      discountedPrice = Math.max(0, price - flatDiscount);
      actualDiscount = price > 0 ? Math.round((flatDiscount / price) * 100) : 0;
    }
  }

  return {
    costPrice,
    profitWanted,
    freeCashExpected,
    discountType: discount.type || null,
    discountValue: discount.value || 0,
    effectiveDiscountPercentage,
    baseSelling, // What seller gets
    finalPrice, // What customer pays (base selling + free cash)
    mrp,
    safeSellingPrice: mrp, // Legacy field
    originalPrice: price,
    actualDiscountPercentage: actualDiscount,
    finalCustomerPrice: discountedPrice,
    sellerReturn: baseSelling, // Renamed for clarity
    // Add a flag to indicate if this product has the new pricing system
    hasPricingCalculator: (costPrice > 0 || profitWanted > 0 || freeCashExpected > 0)
  };
};

// Method to get discounted price of a variant
productSchema.methods.getVariantPrice = function(variantIndex = 0) {
  const variant = this.variants[variantIndex];
  if (!variant) return 0;

  if (!variant.discount.type || this.cancelOffer) return variant.price;

  if (variant.discount.type === 'flat') return Math.max(0, variant.price - variant.discount.value);
  if (variant.discount.type === 'percentage') return variant.price * (1 - variant.discount.value / 100);

  return variant.price;
};

// Method to get discount percentage of a variant
productSchema.methods.getVariantDiscountPercentage = function(variantIndex = 0) {
  const variant = this.variants[variantIndex];
  if (!variant || !variant.discount.type || this.cancelOffer) return 0;

  if (variant.discount.type === 'flat') return Math.round((variant.discount.value / variant.price) * 100);
  if (variant.discount.type === 'percentage') return variant.discount.value;

  return 0;
};

// Method to check if this product is a best seller
productSchema.methods.isBestSeller = function() {
  return this.totalOrderCount >= 4;
};

// Method to increment order count
productSchema.methods.incrementOrderCount = function(quantity = 1) {
  this.totalOrderCount = (this.totalOrderCount || 0) + quantity;
  this.lastOrderCountUpdate = new Date();
  return this.save();
};

// Virtual to get best seller status
productSchema.virtual('bestSeller').get(function() {
  return this.isBestSeller();
});

// Middleware to auto-generate product ID
productSchema.pre('save', async function(next) {
  if (this.isNew && !this.id) {
    const category = await mongoose.model('Category').findById(this.category);
    let prefix = 'PRD';
    if (category) prefix = category.name.substring(0, 5).toUpperCase();

    const count = await mongoose.model('Product').countDocuments();
    const paddedCount = String(count + 1).padStart(3, '0');
    this.id = `${prefix}-${paddedCount}`;
  }
  next();
});

// Add indexes to improve query performance
productSchema.index({ category: 1 }); // For category-based queries
productSchema.index({ isActive: 1 }); // For active status filtering
productSchema.index({ createdAt: -1 }); // For sorting by newest
productSchema.index({ name: 'text', description: 'text' }); // For text search
productSchema.index({ category: 1, isActive: 1 }); // Compound index for common queries
productSchema.index({ isActive: 1, createdAt: -1 }); // For active products sorted by date
productSchema.index({ 'variants.price': 1 }); // For price range queries
productSchema.index({ tags: 1 }); // For tag-based queries
productSchema.index({ totalOrderCount: -1 }); // For best seller queries and sorting
productSchema.index({ totalOrderCount: -1, isActive: 1 }); // For best seller + active products

// Include virtuals in JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Product = mongoose.model('Product', productSchema);

export default Product;
