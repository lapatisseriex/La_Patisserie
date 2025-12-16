import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: function() {
        // uid is not required for temporary OTP verification records
        return !this.isTemp;
      },
      unique: true,
      sparse: true, // Allow multiple null values for temp users
    },
    email: {
      type: String,
      required: function() {
        // Email is not required if user signed up with phone only
        return !this.phone || this.phoneVerified === false;
      },
      unique: true,
      sparse: true, // Allow multiple null values
      trim: true,
      lowercase: true,
    },
    // Email verification flags
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerifiedAt: {
      type: Date,
    },
    name: {
      type: String,
      trim: true,
    },
    dob: {
      type: Date,
    },
    anniversary: {
      type: Date,
    },
    city: {
      type: String,
      trim: true,
    },
    pincode: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
      default: 'India',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
    },
    // User's precise address (sublocation) - full Google autocomplete data
    userAddress: {
      fullAddress: { type: String, default: '' }, // Full formatted address from Google
      area: { type: String, default: '' }, // Sublocation area (e.g., SITRA)
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
      coordinates: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null }
      }
    },
    hostel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel',
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', ''],
      default: ''
    },
    phone: {
      type: String,
      trim: true,
    },
    // Phone verification flags
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerifiedAt: {
      type: Date,
    },
    profilePhoto: {
      url: { type: String, default: '' },
      public_id: { type: String, default: '' }
    },
    recentlyViewed: [{
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      viewedAt: {
        type: Date,
        default: Date.now
      }
    }],
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    lastPasswordChange: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Temporary user flag for OTP verification
    isTemp: {
      type: Boolean,
      default: false,
    },
    // Password reset OTP fields
    passwordResetOTP: {
      type: String,
    },
    passwordResetOTPExpires: {
      type: Date,
    },
    passwordResetAttempts: {
      type: Number,
      default: 0,
    },
    passwordResetBlockedUntil: {
      type: Date,
    },
    // Signup OTP fields
    signupOTP: {
      type: String,
    },
    signupOTPExpires: {
      type: Date,
    },
    // Monthly reward system fields
    monthlyOrderDays: [{
      date: {
        type: Date,
        required: true
      },
      month: {
        type: Number, // 1-12
        required: true
      },
      year: {
        type: Number,
        required: true
      }
    }],
    freeProductEligible: {
      type: Boolean,
      default: false
    },
    selectedFreeProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null
    },
    lastRewardMonth: {
      type: String, // Format: "YYYY-MM"
      default: null
    },
    freeProductUsed: {
      type: Boolean,
      default: false
    },
    freeProductClaimHistory: [{
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      productName: String,
      claimedAt: {
        type: Date,
        default: Date.now
      },
      month: String, // Format: "YYYY-MM"
      orderNumber: String
    }]
  },
  {
    timestamps: true,
  }
);

// Remove any duplicate indexes that might be causing warnings
// Only use field-level index definitions (unique: true) instead of schema.index()

// Method to check if user is admin
userSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};

// Add pre-save middleware to assign admin role for specific emails
userSchema.pre('save', function(next) {
  // If this is a new user or email is being modified
  if (this.isNew || this.isModified('email')) {
    // Check for admin email (update this to your actual admin email)
    if (this.email === 'admin@lapatisserie.com') {
      this.role = 'admin';
    }
  }
  next();
});

const User = mongoose.model('User', userSchema);

export default User;
