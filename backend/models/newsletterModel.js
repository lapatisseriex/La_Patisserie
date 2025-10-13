import mongoose from 'mongoose';

const newsletterSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function(email) {
          // Email validation regex
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: 'Please provide a valid email address'
      }
    },
    status: {
      type: String,
      enum: ['active', 'unsubscribed'],
      default: 'active'
    },
    source: {
      type: String,
      enum: ['footer', 'admin', 'checkout', 'other'],
      default: 'footer'
    },
    subscribedAt: {
      type: Date,
      default: Date.now
    },
    unsubscribedAt: {
      type: Date,
      default: null
    },
    lastEmailSent: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
newsletterSchema.index({ email: 1 });
newsletterSchema.index({ status: 1 });

// Method to unsubscribe
newsletterSchema.methods.unsubscribe = function() {
  this.status = 'unsubscribed';
  this.unsubscribedAt = new Date();
  return this.save();
};

// Method to resubscribe
newsletterSchema.methods.resubscribe = function() {
  this.status = 'active';
  this.unsubscribedAt = null;
  return this.save();
};

// Static method to get active subscribers
newsletterSchema.statics.getActiveSubscribers = function() {
  return this.find({ status: 'active' }).select('email');
};

// Static method to get subscriber count
newsletterSchema.statics.getSubscriberCount = function() {
  return this.countDocuments({ status: 'active' });
};

const Newsletter = mongoose.model('Newsletter', newsletterSchema);

export default Newsletter;
