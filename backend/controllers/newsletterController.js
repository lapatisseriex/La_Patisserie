import Newsletter from '../models/newsletterModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// @desc    Subscribe to newsletter
// @route   POST /api/newsletter/subscribe
// @access  Public
const subscribe = asyncHandler(async (req, res) => {
  const { email, source = 'footer' } = req.body;

  if (!email) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email is required' 
    });
  }

  // Check if email already exists
  let subscriber = await Newsletter.findOne({ email: email.toLowerCase() });

  if (subscriber) {
    // If user was previously unsubscribed, resubscribe them
    if (subscriber.status === 'unsubscribed') {
      await subscriber.resubscribe();
      return res.status(200).json({
        success: true,
        message: 'Welcome back! You have been resubscribed to our newsletter.',
        data: subscriber
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'This email is already subscribed to our newsletter.'
    });
  }

  // Create new subscriber
  subscriber = await Newsletter.create({
    email: email.toLowerCase(),
    source
  });

  res.status(201).json({
    success: true,
    message: 'Thank you for subscribing! You will receive updates about our delicious desserts.',
    data: subscriber
  });
});

// @desc    Unsubscribe from newsletter
// @route   POST /api/newsletter/unsubscribe
// @access  Public
const unsubscribe = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email is required' 
    });
  }

  const subscriber = await Newsletter.findOne({ email: email.toLowerCase() });

  if (!subscriber) {
    return res.status(404).json({
      success: false,
      message: 'Email not found in our subscriber list.'
    });
  }

  if (subscriber.status === 'unsubscribed') {
    return res.status(400).json({
      success: false,
      message: 'This email is already unsubscribed.'
    });
  }

  await subscriber.unsubscribe();

  res.status(200).json({
    success: true,
    message: 'You have been successfully unsubscribed from our newsletter.'
  });
});

// @desc    Get all subscribers (Admin)
// @route   GET /api/newsletter/subscribers
// @access  Private/Admin
const getAllSubscribers = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 50 } = req.query;

  const query = status ? { status } : {};
  
  const subscribers = await Newsletter.find(query)
    .sort({ subscribedAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Newsletter.countDocuments(query);
  const activeCount = await Newsletter.countDocuments({ status: 'active' });
  const unsubscribedCount = await Newsletter.countDocuments({ status: 'unsubscribed' });

  res.status(200).json({
    success: true,
    data: subscribers,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      totalSubscribers: count,
      activeSubscribers: activeCount,
      unsubscribedCount: unsubscribedCount
    }
  });
});

// @desc    Add subscriber manually (Admin)
// @route   POST /api/newsletter/admin/add
// @access  Private/Admin
const addSubscriberManually = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email is required' 
    });
  }

  // Check if email already exists
  let subscriber = await Newsletter.findOne({ email: email.toLowerCase() });

  if (subscriber) {
    if (subscriber.status === 'unsubscribed') {
      await subscriber.resubscribe();
      return res.status(200).json({
        success: true,
        message: 'Subscriber reactivated successfully.',
        data: subscriber
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'This email is already an active subscriber.'
    });
  }

  // Create new subscriber
  subscriber = await Newsletter.create({
    email: email.toLowerCase(),
    source: 'admin'
  });

  res.status(201).json({
    success: true,
    message: 'Subscriber added successfully.',
    data: subscriber
  });
});

// @desc    Update subscriber (Admin)
// @route   PUT /api/newsletter/admin/:id
// @access  Private/Admin
const updateSubscriber = asyncHandler(async (req, res) => {
  const { email, status } = req.body;

  const subscriber = await Newsletter.findById(req.params.id);

  if (!subscriber) {
    return res.status(404).json({
      success: false,
      message: 'Subscriber not found.'
    });
  }

  if (email) {
    subscriber.email = email.toLowerCase();
  }

  if (status) {
    if (status === 'unsubscribed') {
      await subscriber.unsubscribe();
    } else if (status === 'active') {
      await subscriber.resubscribe();
    }
  } else {
    await subscriber.save();
  }

  res.status(200).json({
    success: true,
    message: 'Subscriber updated successfully.',
    data: subscriber
  });
});

// @desc    Delete subscriber (Admin)
// @route   DELETE /api/newsletter/admin/:id
// @access  Private/Admin
const deleteSubscriber = asyncHandler(async (req, res) => {
  const subscriber = await Newsletter.findById(req.params.id);

  if (!subscriber) {
    return res.status(404).json({
      success: false,
      message: 'Subscriber not found.'
    });
  }

  await subscriber.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Subscriber deleted successfully.'
  });
});

// @desc    Get newsletter statistics (Admin)
// @route   GET /api/newsletter/admin/stats
// @access  Private/Admin
const getNewsletterStats = asyncHandler(async (req, res) => {
  const totalSubscribers = await Newsletter.countDocuments();
  const activeSubscribers = await Newsletter.countDocuments({ status: 'active' });
  const unsubscribedCount = await Newsletter.countDocuments({ status: 'unsubscribed' });
  
  // Get recent subscribers (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentSubscribers = await Newsletter.countDocuments({
    subscribedAt: { $gte: thirtyDaysAgo },
    status: 'active'
  });

  // Get subscribers by source
  const subscribersBySource = await Newsletter.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: '$source', count: { $sum: 1 } } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalSubscribers,
      activeSubscribers,
      unsubscribedCount,
      recentSubscribers,
      subscribersBySource
    }
  });
});

export {
  subscribe,
  unsubscribe,
  getAllSubscribers,
  addSubscriberManually,
  updateSubscriber,
  deleteSubscriber,
  getNewsletterStats
};
