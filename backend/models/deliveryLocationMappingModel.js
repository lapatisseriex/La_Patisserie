import mongoose from 'mongoose';

const deliveryLocationMappingSchema = new mongoose.Schema({
  deliveryLocation: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  hostelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true
  },
  hostelName: {
    type: String,
    required: true
  },
  mappingType: {
    type: String,
    enum: ['exact', 'partial', 'manual'],
    default: 'manual'
  },
  createdBy: {
    type: String,
    default: 'system'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster lookups
deliveryLocationMappingSchema.index({ deliveryLocation: 1 });
deliveryLocationMappingSchema.index({ hostelId: 1 });

const DeliveryLocationMapping = mongoose.model('DeliveryLocationMapping', deliveryLocationMappingSchema);

export default DeliveryLocationMapping;