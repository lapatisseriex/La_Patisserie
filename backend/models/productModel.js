import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  weight: {
    type: Number,
    required: true,
    min: 1
  },
  weightUnit: {
    type: String,
    required: true,
    enum: ['g', 'kg'],
    default: 'g'
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  nutrition: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number
  }
}, {
  timestamps: true
});

// Index for better query performance
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ name: 'text', description: 'text' });

// Pre-save middleware to generate product ID
productSchema.pre('save', async function(next) {
  if (!this.id) {
    try {
      console.log('Generating ID for product:', this.name, 'Category:', this.category);
      
      // Get category name for ID generation
      const Category = mongoose.model('Category');
      const category = await Category.findById(this.category);
      
      if (!category) {
        console.error('Category not found:', this.category);
        return next(new Error('Category not found'));
      }
      
      console.log('Found category:', category.name);
      
      const categoryPrefix = category.name.toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9]/g, '');
      console.log('Category prefix:', categoryPrefix);
      
      // Find the last product with this category prefix
      const lastProduct = await this.constructor
        .findOne({ id: new RegExp(`^${categoryPrefix}-`) })
        .sort({ id: -1 })
        .exec();
      
      let nextNumber = 1;
      if (lastProduct) {
        console.log('Last product:', lastProduct.id);
        const match = lastProduct.id.match(/-(\d+)$/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      
      // Generate ID like CAKES-001, PASTRIES-002, etc.
      this.id = `${categoryPrefix}-${nextNumber.toString().padStart(3, '0')}`;
      console.log('Generated product ID:', this.id);
      
    } catch (error) {
      console.error('Error generating product ID:', error);
      return next(error);
    }
  }
  next();
});

const Product = mongoose.model('Product', productSchema);

export default Product;
