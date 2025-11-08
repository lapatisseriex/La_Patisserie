import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
  // User Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Allow null for guest donations
  },
  userEmail: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userPhone: {
    type: String,
    required: true
  },
  
  // Donation Details
  donationAmount: {
    type: Number,
    required: true,
    min: 1
  },
  donationCurrency: {
    type: String,
    default: 'INR'
  },
  
  // Order Information
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  orderNumber: {
    type: String,
    required: true
  },
  
  // Payment Information
  paymentMethod: {
    type: String,
    enum: ['cod', 'razorpay', 'online'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },
  
  // Educational Initiative Details
  initiativeName: {
    type: String,
    default: 'கற்பிப்போம் பயிலகம் - Education Initiative'
  },
  initiativeDescription: {
    type: String,
    default: 'Supporting student education and learning resources'
  },
  
  // Location Information
  deliveryLocation: {
    type: String,
    required: true
  },
  hostelName: {
    type: String,
    default: null
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
donationSchema.index({ userId: 1, createdAt: -1 }); // User donations sorted by date
donationSchema.index({ userEmail: 1, createdAt: -1 }); // Email-based lookup
donationSchema.index({ orderId: 1 }); // Order-based lookup
donationSchema.index({ paymentMethod: 1, createdAt: -1 }); // Payment method analytics
donationSchema.index({ createdAt: -1 }); // Admin dashboard sorting

// Virtual for user total donations
donationSchema.statics.getUserTotalDonations = async function(userId, userEmail) {
  const match = userId ? { userId } : { userEmail };
  
  const result = await this.aggregate([
    { $match: { ...match, paymentStatus: 'completed' } },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$donationAmount' },
        donationCount: { $sum: 1 },
        lastDonation: { $max: '$createdAt' }
      }
    }
  ]);
  
  return result[0] || { totalAmount: 0, donationCount: 0, lastDonation: null };
};

// Static method for user total donations with delivery status filtering
donationSchema.statics.getUserTotalDonationsFiltered = async function(userId, userEmail) {
  const Order = mongoose.model('Order');
  const match = userId ? { userId } : { userEmail };
  
  // Get all completed donations with order info
  const donations = await this.find({ ...match, paymentStatus: 'completed' })
    .populate('orderId', 'orderStatus');
  
  // Filter based on payment method and delivery status
  const filteredDonations = donations.filter(donation => {
    if (donation.paymentMethod === 'razorpay') {
      return true; // Show all verified razorpay donations
    }
    if (donation.paymentMethod === 'cod') {
      return donation.orderId?.orderStatus === 'delivered'; // Show COD only when delivered
    }
    return false;
  });
  
  // Calculate stats from filtered donations
  const totalAmount = filteredDonations.reduce((sum, d) => sum + d.donationAmount, 0);
  const donationCount = filteredDonations.length;
  const lastDonation = filteredDonations.length > 0 
    ? filteredDonations.sort((a, b) => b.createdAt - a.createdAt)[0].createdAt 
    : null;
  
  return { totalAmount, donationCount, lastDonation };
};

// Static method for admin analytics
donationSchema.statics.getAdminStats = async function(startDate, endDate) {
  const match = { paymentStatus: 'completed' };
  if (startDate && endDate) {
    match.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }
  
  // Get all donations with order info
  const donations = await this.find(match).populate('orderId', 'orderStatus');
  
  // Filter based on payment method and delivery status
  const filteredDonations = donations.filter(donation => {
    if (donation.paymentMethod === 'razorpay') {
      return true; // Show all verified razorpay donations
    }
    if (donation.paymentMethod === 'cod') {
      return donation.orderId?.orderStatus === 'delivered'; // Show COD only when delivered
    }
    return false;
  });
  
  // Calculate stats from filtered donations
  const totalAmount = filteredDonations.reduce((sum, d) => sum + d.donationAmount, 0);
  const donationCount = filteredDonations.length;
  const avgDonation = donationCount > 0 ? totalAmount / donationCount : 0;
  const amounts = filteredDonations.map(d => d.donationAmount);
  const minDonation = amounts.length > 0 ? Math.min(...amounts) : 0;
  const maxDonation = amounts.length > 0 ? Math.max(...amounts) : 0;
  
  // Calculate payment method stats
  const paymentMethodStats = {};
  filteredDonations.forEach(donation => {
    const method = donation.paymentMethod;
    if (!paymentMethodStats[method]) {
      paymentMethodStats[method] = { _id: method, count: 0, totalAmount: 0 };
    }
    paymentMethodStats[method].count++;
    paymentMethodStats[method].totalAmount += donation.donationAmount;
  });
  
  return {
    overall: { totalAmount, donationCount, avgDonation, minDonation, maxDonation },
    byPaymentMethod: Object.values(paymentMethodStats)
  };
};

const Donation = mongoose.model('Donation', donationSchema);

export default Donation;