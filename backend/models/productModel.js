import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    id: {
      type: String,
      unique: true,
      sparse: true // Allows multiple null values
    },
    description: {
      type: String,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    weight: {
      type: Number,
      min: 0
    },
    weightUnit: {
      type: String,
      default: 'g',
      enum: ['g', 'kg', 'lb', 'oz']
    },
    stock: {
      type: Number,
      default: 0,
      min: 0
    },
    images: {
      type: [String], // Array of Cloudinary URLs
      default: []
    },
    videos: {
      type: [String], // Array of Cloudinary URLs for videos
      default: []
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    tags: {
      type: [String],
      default: []
    },
    isVeg: {
      type: Boolean,
      default: true
    },
    discount: {
      type: {
        type: String,
        enum: ['flat', 'percentage', null],
        default: null
      },
      value: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    cancelOffer: {
      type: Boolean,
      default: false
    },
    importantField: {
      name: {
        type: String,
        trim: true
      },
      value: {
        type: String,
        trim: true
      }
    },
    extraFields: {
      type: Map,
      of: String,
      default: {}
    },
    isActive: {
      type: Boolean,
      default: true
    },
    badge: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
  }
);

// Virtual for getting featured image (first in the array)
productSchema.virtual('featuredImage').get(function() {
  return this.images && this.images.length > 0 ? this.images[0] : null;
});

// Virtual for calculating the discounted price
productSchema.virtual('discountedPrice').get(function() {
  if (this.cancelOffer || !this.discount.type) {
    return this.price;
  }
  
  if (this.discount.type === 'flat') {
    return Math.max(0, this.price - this.discount.value);
  }
  
  if (this.discount.type === 'percentage') {
    return this.price * (1 - this.discount.value / 100);
  }
  
  return this.price;
});

// Virtual for calculating discount percentage for display
productSchema.virtual('discountPercentage').get(function() {
  if (this.cancelOffer || !this.discount.type) {
    return 0;
  }
  
  if (this.discount.type === 'flat') {
    return Math.round((this.discount.value / this.price) * 100);
  }
  
  if (this.discount.type === 'percentage') {
    return this.discount.value;
  }
  
  return 0;
});

// Middleware to auto-generate a product ID before saving if not provided
productSchema.pre('save', async function(next) {
  // Only generate ID for new products that don't have an ID yet
  if (this.isNew && !this.id) {
    // Get category name first few characters
    const category = await mongoose.model('Category').findById(this.category);
    let prefix = 'PRD';
    
    if (category) {
      // Use first 5 chars of category name (uppercase)
      prefix = category.name.substring(0, 5).toUpperCase();
    }
    
    // Get count of products for numbering
    const count = await mongoose.model('Product').countDocuments();
    const paddedCount = String(count + 1).padStart(3, '0');
    
    // Set the ID format: CATEG-001
    this.id = `${prefix}-${paddedCount}`;
  }
  next();
});

// Set the toJSON option to include virtuals
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Product = mongoose.model('Product', productSchema);

export default Product;
