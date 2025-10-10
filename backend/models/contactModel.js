import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    status: {
      type: String,
      enum: ['unread', 'read', 'resolved', 'archived'],
      default: 'unread'
    },
    adminReply: {
      type: String,
      trim: true
    },
    repliedAt: {
      type: Date
    },
    repliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isImportant: {
      type: Boolean,
      default: false
    },
    tags: [{
      type: String,
      trim: true
    }],
    userAgent: {
      type: String
    },
    ipAddress: {
      type: String
    }
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
contactSchema.index({ status: 1, createdAt: -1 });
contactSchema.index({ email: 1 });
contactSchema.index({ createdAt: -1 });
contactSchema.index({ isImportant: 1, status: 1 });

// Virtual for message preview (first 100 chars)
contactSchema.virtual('messagePreview').get(function() {
  return this.message.length > 100 ? this.message.substring(0, 100) + '...' : this.message;
});

// Method to mark as read
contactSchema.methods.markAsRead = function() {
  this.status = 'read';
  return this.save();
};

// Method to mark as resolved
contactSchema.methods.markAsResolved = function() {
  this.status = 'resolved';
  return this.save();
};

// Method to archive
contactSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

// Static method to get unread count
contactSchema.statics.getUnreadCount = function() {
  return this.countDocuments({ status: 'unread' });
};

// Static method to get contact statistics
contactSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const result = {
    total: 0,
    unread: 0,
    read: 0,
    resolved: 0,
    archived: 0
  };

  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
  });

  return result;
};

// Include virtuals in JSON
contactSchema.set('toJSON', { virtuals: true });
contactSchema.set('toObject', { virtuals: true });

const Contact = mongoose.model('Contact', contactSchema);

export default Contact;