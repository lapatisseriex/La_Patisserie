import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      trim: true,
    },
    dob: {
      type: Date,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true, // Allows multiple null values (not required)
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
    },
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
    },
    hostel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel',
    },
    favorites: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    }],
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
  },
  {
    timestamps: true,
  }
);

// Method to check if user is admin
userSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};

// Add pre-save middleware to assign admin role for specific phone numbers
userSchema.pre('save', function(next) {
  // If this is a new user or role is being modified
  if (this.isNew || this.isModified('phone')) {
    // Check for admin phone number
    if (this.phone === '+919500643892') {
      this.role = 'admin';
    } else if (this.phone === '+919361620860') {
      this.role = 'user';
    }
  }
  next();
});

const User = mongoose.model('User', userSchema);

export default User;
