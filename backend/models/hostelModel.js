import mongoose from 'mongoose';

const hostelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true
    },
    address: {
      type: String,
      trim: true
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

// Index for better query performance
hostelSchema.index({ locationId: 1, isActive: 1 });

// Virtual for location details
hostelSchema.virtual('location', {
  ref: 'Location',
  localField: 'locationId',
  foreignField: '_id',
  justOne: true
});

// Set the toJSON option to include virtuals
hostelSchema.set('toJSON', { virtuals: true });
hostelSchema.set('toObject', { virtuals: true });

const Hostel = mongoose.model('Hostel', hostelSchema);

export default Hostel;
