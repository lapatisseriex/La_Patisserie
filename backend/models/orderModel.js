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
  },
  variantLabel: {
    type: String,
    trim: true,
    default: ''
  },
  variant: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  dispatchStatus: {
    type: String,
    enum: ['pending', 'dispatched', 'delivered'],
    default: 'pending'
  },
  dispatchedAt: {
    type: Date,
    default: null
  },
  isFreeProduct: {
    type: Boolean,
    default: false
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
  },
  // User's precise address (sublocation from Google autocomplete)
  userAddress: {
    fullAddress: { type: String, default: '' },
    area: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' },
    coordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null }
    }
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
    enum: ['pending', 'created', 'paid', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'],
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
    // Removed index: true to avoid duplicate index warning
  },
  hostelName: {
    type: String,
    trim: true
  },
  hostelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel'
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
  cancelledAt: {
    type: Date,
    default: null
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
orderSchema.index({ cancelledAt: 1 }, { partialFilterExpression: { cancelledAt: { $type: 'date' } } });
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

// Calculate order status based on item dispatch statuses
orderSchema.methods.calculateOrderStatus = function() {
  if (!this.cartItems || this.cartItems.length === 0) {
    return this.orderStatus;
  }

  const dispatchedItems = this.cartItems.filter(item => item.dispatchStatus === 'dispatched');
  const deliveredItems = this.cartItems.filter(item => item.dispatchStatus === 'delivered');
  const totalItems = this.cartItems.length;

  // If all items are delivered
  if (deliveredItems.length === totalItems) {
    return 'delivered';
  }
  
  // If some items are dispatched but not all delivered
  if (dispatchedItems.length > 0) {
    return 'out_for_delivery';
  }
  
  // Default to current status if no items dispatched
  return this.orderStatus;
};

// Get dispatch progress information
orderSchema.methods.getDispatchProgress = function() {
  if (!this.cartItems || this.cartItems.length === 0) {
    return { total: 0, dispatched: 0, delivered: 0, pending: 0 };
  }

  const total = this.cartItems.length;
  const dispatched = this.cartItems.filter(item => item.dispatchStatus === 'dispatched').length;
  const delivered = this.cartItems.filter(item => item.dispatchStatus === 'delivered').length;
  const pending = this.cartItems.filter(item => item.dispatchStatus === 'pending').length;

  return { total, dispatched, delivered, pending };
};

// Static methods
orderSchema.statics.getOrderByNumber = function(orderNumber) {
  return this.findOne({ orderNumber }).populate('userId', 'name email phone');
};

orderSchema.statics.getUserOrders = function(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return this.find({ 
    userId,
    orderStatus: { $in: ['placed', 'out_for_delivery', 'delivered'] }
  })
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

orderSchema.pre('save', function(next) {
  if (this.isModified('orderStatus')) {
    if (this.orderStatus === 'cancelled') {
      this.cancelledAt = this.cancelledAt || new Date();
    } else {
      this.cancelledAt = null;
    }
  }
  next();
});

export default mongoose.model('Order', orderSchema);