import { asyncHandler } from '../utils/asyncHandler.js';
import Donation from '../models/donationModel.js';
import User from '../models/userModel.js';

// @desc    Get user's donation history
// @route   GET /api/donations/user
// @access  Private (User)
export const getUserDonations = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 10 } = req.query;
  
  try {
    // Query donations with populated order data
    const donations = await Donation.find({
      $or: [
        { userId },
        { userEmail: req.user.email }
      ],
      paymentStatus: 'completed'
    })
    .populate('orderId', 'orderNumber createdAt orderStatus')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    // Filter donations: 
    // - Razorpay: show immediately after payment verified
    // - COD: show only when order is delivered
    const filteredDonations = donations.filter(donation => {
      if (donation.paymentMethod === 'razorpay') {
        return true; // Show all verified razorpay donations
      }
      if (donation.paymentMethod === 'cod') {
        return donation.orderId?.orderStatus === 'delivered'; // Show COD only when delivered
      }
      return false;
    });

    // Get user's total donation statistics (with same filtering logic)
    const stats = await Donation.getUserTotalDonationsFiltered(userId, req.user.email);

    res.json({
      success: true,
      data: {
        donations: filteredDonations,
        stats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredDonations.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user donations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donation history'
    });
  }
});

// @desc    Get user's donation summary
// @route   GET /api/donations/user/summary
// @access  Private (User)
export const getUserDonationSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  try {
    const stats = await Donation.getUserTotalDonations(userId, req.user.email);
    
    // Get monthly donation breakdown for current year
    const currentYear = new Date().getFullYear();
    const monthlyDonations = await Donation.aggregate([
      {
        $match: {
          $or: [
            { userId },
            { userEmail: req.user.email }
          ],
          paymentStatus: 'completed',
          createdAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lt: new Date(`${currentYear + 1}-01-01`)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          totalAmount: { $sum: '$donationAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Get recent donations
    const recentDonations = await Donation.find({
      $or: [
        { userId },
        { userEmail: req.user.email }
      ],
      paymentStatus: 'completed'
    })
    .populate('orderId', 'orderNumber')
    .sort({ createdAt: -1 })
    .limit(5)
    .select('donationAmount createdAt orderNumber initiativeName');

    res.json({
      success: true,
      data: {
        totalStats: stats,
        monthlyBreakdown: monthlyDonations,
        recentDonations,
        year: currentYear
      }
    });
  } catch (error) {
    console.error('Error fetching user donation summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donation summary'
    });
  }
});

// @desc    Get all donations (Admin)
// @route   GET /api/donations/admin/all
// @access  Private (Admin)
export const getAllDonations = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    startDate, 
    endDate, 
    paymentMethod, 
    paymentStatus,
    search 
  } = req.query;

  try {
    // Build filter object
    const filter = {};
    
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }
    
    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }
    
    if (search) {
      filter.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } },
        { orderNumber: { $regex: search, $options: 'i' } },
        { userPhone: { $regex: search, $options: 'i' } }
      ];
    }

    const donations = await Donation.find(filter)
      .populate('userId', 'name email phone')
      .populate('orderId', 'orderNumber orderStatus createdAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Filter donations based on payment method and delivery status
    // - Razorpay: show immediately after payment verified
    // - COD: show only when order is delivered
    const filteredDonations = donations.filter(donation => {
      if (donation.paymentMethod === 'razorpay') {
        return true; // Show all verified razorpay donations
      }
      if (donation.paymentMethod === 'cod') {
        return donation.orderId?.orderStatus === 'delivered'; // Show COD only when delivered
      }
      return false;
    });

    const total = filteredDonations.length;

    res.json({
      success: true,
      data: {
        donations: filteredDonations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching admin donations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donations'
    });
  }
});

// @desc    Get donation statistics for admin dashboard
// @route   GET /api/donations/admin/stats
// @access  Private (Admin)
export const getDonationStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    // Get overall stats
    const overallStats = await Donation.getAdminStats(startDate, endDate);

    // Get top donors
    const topDonors = await Donation.aggregate([
      {
        $match: {
          paymentStatus: 'completed',
          ...(startDate && endDate ? {
            createdAt: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          } : {})
        }
      },
      {
        $group: {
          _id: {
            userId: '$userId',
            userEmail: '$userEmail',
            userName: '$userName'
          },
          totalDonations: { $sum: '$donationAmount' },
          donationCount: { $sum: 1 },
          lastDonation: { $max: '$createdAt' }
        }
      },
      { $sort: { totalDonations: -1 } },
      { $limit: 10 }
    ]);

    // Get daily donation trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailyTrends = await Donation.aggregate([
      {
        $match: {
          paymentStatus: 'completed',
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalAmount: { $sum: '$donationAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Get location-wise donations
    const locationStats = await Donation.aggregate([
      {
        $match: {
          paymentStatus: 'completed',
          ...(startDate && endDate ? {
            createdAt: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          } : {})
        }
      },
      {
        $group: {
          _id: '$deliveryLocation',
          totalAmount: { $sum: '$donationAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        overallStats,
        topDonors,
        dailyTrends,
        locationStats
      }
    });
  } catch (error) {
    console.error('Error fetching donation statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donation statistics'
    });
  }
});

// @desc    Update donation status
// @route   PATCH /api/donations/admin/:id
// @access  Private (Admin)
export const updateDonationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { paymentStatus, notes } = req.body;

  try {
    const donation = await Donation.findById(id);
    
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    if (paymentStatus) {
      donation.paymentStatus = paymentStatus;
    }

    if (notes) {
      donation.adminNotes = notes;
    }

    donation.updatedAt = new Date();
    await donation.save();

    res.json({
      success: true,
      data: donation,
      message: 'Donation updated successfully'
    });
  } catch (error) {
    console.error('Error updating donation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update donation'
    });
  }
});

// @desc    Export donations as CSV
// @route   GET /api/donations/admin/export
// @access  Private (Admin)
export const exportDonations = asyncHandler(async (req, res) => {
  const { startDate, endDate, paymentMethod, paymentStatus } = req.query;

  try {
    // Build filter
    const filter = {};
    
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const donations = await Donation.find(filter)
      .populate('orderId', 'orderNumber')
      .sort({ createdAt: -1 });

    // Convert to CSV format
    const csvHeaders = [
      'Date',
      'Order Number', 
      'Donor Name',
      'Email',
      'Phone',
      'Donation Amount',
      'Payment Method',
      'Payment Status',
      'Initiative',
      'Location',
      'Hostel'
    ];

    const csvRows = donations.map(donation => [
      donation.createdAt.toISOString().split('T')[0],
      donation.orderNumber,
      donation.userName,
      donation.userEmail,
      donation.userPhone,
      donation.donationAmount,
      donation.paymentMethod,
      donation.paymentStatus,
      donation.initiativeName,
      donation.deliveryLocation,
      donation.hostelName || 'N/A'
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field || ''}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=donations-export.csv');
    res.send(csvContent);

  } catch (error) {
    console.error('Error exporting donations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export donations'
    });
  }
});