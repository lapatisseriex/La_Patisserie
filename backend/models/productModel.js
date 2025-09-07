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
  discount: {
    type: { type: String, enum: ['flat', 'percentage', null], default: null },
    value: { type: Number, default: 0, min: 0 }
  },
  stock: { type: Number, default: 0, min: 0 },
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
    variants: { type: [variantSchema], default: [] },
    cancelOffer: { type: Boolean, default: false },
    importantField: {
      name: { type: String, trim: true },
      value: { type: String, trim: true }
    },
    extraFields: { type: Map, of: String, default: {} },
    isActive: { type: Boolean, default: true },
    badge: { type: String, trim: true }
  },
  { timestamps: true }
);

// Virtual for featured image
productSchema.virtual('featuredImage').get(function() {
  return this.images && this.images.length > 0 ? this.images[0] : null;
});

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

// Include virtuals in JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Product = mongoose.model('Product', productSchema);

export default Product;
