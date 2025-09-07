import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    images: {
      type: [String], // Array of Cloudinary URLs
      default: []
    },
    videos: {
      type: [String], // Array of Cloudinary URLs for videos
      default: []
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
  }
);

// Virtual for getting featured image (first in the array)
categorySchema.virtual('featuredImage').get(function() {
  return this.images && this.images.length > 0 ? this.images[0] : null;
});

// Set the toJSON option to include virtuals
categorySchema.set('toJSON', { virtuals: true });
categorySchema.set('toObject', { virtuals: true });

const Category = mongoose.model('Category', categorySchema);

export default Category;
