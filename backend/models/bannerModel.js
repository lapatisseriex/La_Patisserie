import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100
  },
  subtitle: {
    type: String,
    required: true,
    trim: true,
    maxLength: 200
  },
  description: {
    type: String,
    trim: true,
    maxLength: 500
  },
  type: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },
  src: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  leftContent: {
    features: [{
      type: String,
      trim: true,
      maxLength: 100
    }]
  },
  metadata: {
    fileSize: Number,
    duration: Number, // for videos
    dimensions: {
      width: Number,
      height: Number
    }
  }
}, {
  timestamps: true
});

// Index for ordering and active status
bannerSchema.index({ order: 1, isActive: 1 });

const Banner = mongoose.model('Banner', bannerSchema);

export default Banner;
