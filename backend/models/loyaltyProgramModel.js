import mongoose from 'mongoose';

const loyaltyProgramSchema = new mongoose.Schema(
  {
    userId: {
      type: String, // Firebase UID
      required: true,
      unique: true,
    },
    currentMonth: {
      type: String, // Format: 'YYYY-MM'
      required: true,
    },
    orderDates: [{
      type: String, // Format: 'YYYY-MM-DD'
    }],
    uniqueDaysCount: {
      type: Number,
      default: 0,
    },
    freeProductEligible: {
      type: Boolean,
      default: false,
    },
    freeProductClaimed: {
      type: Boolean,
      default: false,
    },
    freeProductClaimedAt: {
      type: Date,
    },
    lastOrderDate: {
      type: Date,
    },
    totalOrdersThisMonth: {
      type: Number,
      default: 0,
    },
    history: [{
      month: String, // Format: 'YYYY-MM'
      uniqueDaysCount: Number,
      freeProductClaimed: Boolean,
      claimedAt: Date,
    }]
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
loyaltyProgramSchema.index({ userId: 1, currentMonth: 1 });

// Method to check and update loyalty status after an order
loyaltyProgramSchema.methods.updateAfterOrder = function(orderDate) {
  const orderDateStr = new Date(orderDate).toISOString().split('T')[0]; // YYYY-MM-DD
  const currentMonth = orderDateStr.substring(0, 7); // YYYY-MM

  // Reset if new month
  if (this.currentMonth !== currentMonth) {
    // Archive current month to history if needed
    if (this.uniqueDaysCount >= 10 || this.freeProductClaimed) {
      this.history.push({
        month: this.currentMonth,
        uniqueDaysCount: this.uniqueDaysCount,
        freeProductClaimed: this.freeProductClaimed,
        claimedAt: this.freeProductClaimedAt,
      });
    }

    // Reset for new month
    this.currentMonth = currentMonth;
    this.orderDates = [];
    this.uniqueDaysCount = 0;
    this.freeProductEligible = false;
    this.freeProductClaimed = false;
    this.freeProductClaimedAt = null;
    this.totalOrdersThisMonth = 0;
  }

  // Add order date if not already present
  if (!this.orderDates.includes(orderDateStr)) {
    this.orderDates.push(orderDateStr);
    this.uniqueDaysCount = this.orderDates.length;
  }

  this.totalOrdersThisMonth += 1;
  this.lastOrderDate = orderDate;

  // Check eligibility for free product (10 different days)
  if (this.uniqueDaysCount >= 10 && !this.freeProductClaimed) {
    this.freeProductEligible = true;
  }

  return this;
};

// Method to claim free product
loyaltyProgramSchema.methods.claimFreeProduct = function() {
  if (this.freeProductEligible && !this.freeProductClaimed) {
    this.freeProductClaimed = true;
    this.freeProductClaimedAt = new Date();
    this.freeProductEligible = false;
    return true;
  }
  return false;
};

// Method to get remaining days needed
loyaltyProgramSchema.methods.getRemainingDays = function() {
  if (this.uniqueDaysCount >= 10) {
    return 0;
  }
  return 10 - this.uniqueDaysCount;
};

// Static method to get or create loyalty record
loyaltyProgramSchema.statics.getOrCreate = async function(userId) {
  const currentMonth = new Date().toISOString().substring(0, 7);
  
  let loyalty = await this.findOne({ userId });
  
  if (!loyalty) {
    loyalty = new this({
      userId,
      currentMonth,
      orderDates: [],
      uniqueDaysCount: 0,
      freeProductEligible: false,
      freeProductClaimed: false,
      totalOrdersThisMonth: 0,
      history: []
    });
  } else {
    // Check if we need to reset for new month
    if (loyalty.currentMonth !== currentMonth) {
      // Archive current month
      if (loyalty.uniqueDaysCount >= 10 || loyalty.freeProductClaimed) {
        loyalty.history.push({
          month: loyalty.currentMonth,
          uniqueDaysCount: loyalty.uniqueDaysCount,
          freeProductClaimed: loyalty.freeProductClaimed,
          claimedAt: loyalty.freeProductClaimedAt,
        });
      }

      // Reset for new month
      loyalty.currentMonth = currentMonth;
      loyalty.orderDates = [];
      loyalty.uniqueDaysCount = 0;
      loyalty.freeProductEligible = false;
      loyalty.freeProductClaimed = false;
      loyalty.freeProductClaimedAt = null;
      loyalty.totalOrdersThisMonth = 0;
    } else {
      // Check if user should be eligible (in case it wasn't set before)
      if (loyalty.uniqueDaysCount >= 10 && !loyalty.freeProductClaimed && !loyalty.freeProductEligible) {
        loyalty.freeProductEligible = true;
      }
    }
  }
  
  return loyalty;
};

const LoyaltyProgram = mongoose.model('LoyaltyProgram', loyaltyProgramSchema);

export default LoyaltyProgram;
