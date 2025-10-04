import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    city: {
      type: String,
      required: true,
    },
    area: {
      type: String,
      required: true,
    },
    pincode: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true
    },
    deliveryCharge: {
      type: Number,
      required: true,
      default: 49,
      min: 0
    }
  },
  {
    timestamps: true,
  }
);

// Virtual for full address
locationSchema.virtual('fullAddress').get(function() {
  return `${this.area}, ${this.city} - ${this.pincode}`;
});

// Set the toJSON option to include virtuals
locationSchema.set('toJSON', { virtuals: true });
locationSchema.set('toObject', { virtuals: true });

const Location = mongoose.model('Location', locationSchema);

export default Location;
