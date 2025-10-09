import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  variantIndex: {
    type: Number,
    default: 0
  }
});

const orderSummarySchema = new mongoose.Schema({
  cartTotal: {
    type: Number,
    required: true
  },
  discountedTotal: {
    type: Number,
    required: true
  },
  deliveryCharge: {
    type: Number,
    required: true
  },
  freeCashDiscount: {
    type: Number,
    default: 0
  },
  grandTotal: {
    type: Number,
    required: true
  }
});

const userDetailsSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  city: String,
  pincode: String,
  country: {
    type: String,
    default: 'India'
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  razorpayOrderId: {
    type: String,
    sparse: true // Allow null values, but if present, must be unique
  },
  razorpayPaymentId: {
    type: String,
    sparse: true
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'cod'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'created', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  orderStatus: {
    type: String,
    enum: ['placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'placed'
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  cartItems: [orderItemSchema],
  userDetails: userDetailsSchema,
  deliveryLocation: {
    type: String,
    required: true
  },
  orderSummary: orderSummarySchema,
  notes: {
    type: String,
    trim: true
  },
  estimatedDeliveryTime: {
    type: Date
  },
  actualDeliveryTime: {
    type: Date
  },
  cancelReason: {
    type: String,
    trim: true
  },
  refundDetails: {
    refundId: String,
    refundAmount: Number,
    refundDate: Date,
    refundStatus: {
      type: String,
      enum: ['pending', 'processed', 'failed']
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance (some already defined as unique)
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdAt: -1 });

// Virtual for formatted order number display
orderSchema.virtual('displayOrderNumber').get(function() {
  return this.orderNumber.toUpperCase();
});

// Methods
orderSchema.methods.canBeCancelled = function() {
  return ['placed', 'confirmed', 'preparing'].includes(this.orderStatus) && 
         this.paymentStatus !== 'refunded';
};

orderSchema.methods.canBeRefunded = function() {
  return this.paymentStatus === 'paid' && 
         ['cancelled', 'delivered'].includes(this.orderStatus);
};

// Static methods
orderSchema.statics.getOrderByNumber = function(orderNumber) {
  return this.findOne({ orderNumber }).populate('userId', 'name email phone');
};

orderSchema.statics.getUserOrders = function(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'name email phone');
};

orderSchema.statics.getOrdersByStatus = function(status, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return this.find({ orderStatus: status })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'name email phone');
};

// Generate order number
orderSchema.statics.generateOrderNumber = function() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `ORD${timestamp}${random}`;
};

export default mongoose.model('Order', orderSchema);