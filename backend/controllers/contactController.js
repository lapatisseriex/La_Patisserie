import asyncHandler from 'express-async-handler';
import Contact from '../models/contactModel.js';
import User from '../models/userModel.js';
import { sendContactNotificationEmail, sendContactReplyEmail } from '../utils/contactEmailService.js';

// @desc    Submit contact form
// @route   POST /api/contact
// @access  Public
export const submitContact = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;

  // Validate required fields
  if (!name || !email || !subject || !message) {
    res.status(400);
    throw new Error('All fields are required');
  }

  // Get user info from request (IP, User-Agent)
  const userAgent = req.get('User-Agent') || '';
  const ipAddress = req.ip || req.connection.remoteAddress || '';

  try {
    // Create contact entry
    const contact = await Contact.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      userAgent,
      ipAddress
    });

    console.log(`📧 New contact message received from ${email}: ${subject}`);

    // Send email notification to admin asynchronously - Execute immediately
    (async () => {
      try {
        const adminUsers = await User.find({ role: 'admin', isActive: true }).select('email name');
        
        if (adminUsers.length > 0) {
          const adminEmails = adminUsers.map(admin => admin.email).filter(Boolean);
          
          if (adminEmails.length > 0) {
            console.log(`📬 Sending contact notification to ${adminEmails.length} admin(s)`);
            
            const emailResult = await sendContactNotificationEmail(contact, adminEmails);
            
            if (emailResult.success) {
              console.log('✅ Contact notification email sent successfully:', emailResult.messageId);
            } else {
              console.error('❌ Failed to send contact notification email:', emailResult.error);
            }
          } else {
            console.log('⚠️ No admin emails found for contact notification');
          }
        } else {
          console.log('⚠️ No admin users found for contact notification');
        }
      } catch (emailError) {
        console.error('❌ Error sending contact notification email:', emailError.message);
      }
    })().catch(err => console.error('❌ Contact email error:', err));

    res.status(201).json({
      success: true,
      message: 'Thank you for your message! We will get back to you soon.',
      contactId: contact._id
    });
  } catch (error) {
    console.error('❌ Error submitting contact form:', error);
    res.status(500);
    throw new Error('Failed to submit contact form. Please try again.');
  }
});

// @desc    Get all contacts (admin only)
// @route   GET /api/contact
// @access  Admin
export const getContacts = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    status, 
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build filter object
  const filter = {};
  
  if (status && status !== 'all') {
    filter.status = status;
  }
  
  if (search) {
    const searchRegex = new RegExp(search, 'i');
    filter.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { subject: searchRegex },
      { message: searchRegex }
    ];
  }

  // Build sort object
  const sortObj = {};
  sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Calculate pagination
  const skip = (page - 1) * limit;

  try {
    // Execute query
    const contacts = await Contact.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('repliedBy', 'name email')
      .lean();

    // Get total count for pagination
    const total = await Contact.countDocuments(filter);

    // Get statistics
    const stats = await Contact.getStats();

    res.status(200).json({
      success: true,
      contacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      },
      stats
    });
  } catch (error) {
    console.error('❌ Error fetching contacts:', error);
    res.status(500);
    throw new Error('Failed to fetch contacts');
  }
});

// @desc    Get single contact (admin only)
// @route   GET /api/contact/:id
// @access  Admin
export const getContact = asyncHandler(async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate('repliedBy', 'name email');

    if (!contact) {
      res.status(404);
      throw new Error('Contact not found');
    }

    res.status(200).json({
      success: true,
      contact
    });
  } catch (error) {
    console.error('❌ Error fetching contact:', error);
    res.status(500);
    throw new Error('Failed to fetch contact');
  }
});

// @desc    Update contact status (admin only)
// @route   PUT /api/contact/:id/status
// @access  Admin
export const updateContactStatus = asyncHandler(async (req, res) => {
  const { status, isImportant, tags } = req.body;
  
  const validStatuses = ['unread', 'read', 'resolved', 'archived'];
  
  if (status && !validStatuses.includes(status)) {
    res.status(400);
    throw new Error('Invalid status. Must be: unread, read, resolved, or archived');
  }

  try {
    const updateData = {};
    
    if (status) updateData.status = status;
    if (isImportant !== undefined) updateData.isImportant = isImportant;
    if (tags) updateData.tags = Array.isArray(tags) ? tags : [];

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('repliedBy', 'name email');

    if (!contact) {
      res.status(404);
      throw new Error('Contact not found');
    }

    console.log(`📝 Contact ${contact._id} status updated to: ${status || 'unchanged'}`);

    res.status(200).json({
      success: true,
      message: 'Contact status updated successfully',
      contact
    });
  } catch (error) {
    console.error('❌ Error updating contact status:', error);
    res.status(500);
    throw new Error('Failed to update contact status');
  }
});

// @desc    Reply to contact (admin only)
// @route   POST /api/contact/:id/reply
// @access  Admin
export const replyToContact = asyncHandler(async (req, res) => {
  const { reply, markAsResolved = false } = req.body;

  if (!reply || reply.trim().length === 0) {
    res.status(400);
    throw new Error('Reply message is required');
  }

  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      res.status(404);
      throw new Error('Contact not found');
    }

    // Update contact with reply
    contact.adminReply = reply.trim();
    contact.repliedAt = new Date();
    contact.repliedBy = req.user._id;
    
    if (markAsResolved) {
      contact.status = 'resolved';
    } else if (contact.status === 'unread') {
      contact.status = 'read';
    }

    await contact.save();

    // Send reply email to user - Execute immediately
    (async () => {
      try {
        const admin = await User.findById(req.user._id).select('name email');
        
        console.log(`📤 Sending reply email to ${contact.email}`);
        
        const emailResult = await sendContactReplyEmail(contact, reply, admin);
        
        if (emailResult.success) {
          console.log('✅ Reply email sent successfully:', emailResult.messageId);
        } else {
          console.error('❌ Failed to send reply email:', emailResult.error);
        }
      } catch (emailError) {
        console.error('❌ Error sending reply email:', emailError.message);
      }
    })().catch(err => console.error('❌ Reply email error:', err));

    // Populate the updated contact
    const updatedContact = await Contact.findById(contact._id)
      .populate('repliedBy', 'name email');

    console.log(`💬 Admin ${req.user.name} replied to contact from ${contact.email}`);

    res.status(200).json({
      success: true,
      message: 'Reply sent successfully',
      contact: updatedContact
    });
  } catch (error) {
    console.error('❌ Error replying to contact:', error);
    res.status(500);
    throw new Error('Failed to send reply');
  }
});

// @desc    Delete contact (admin only)
// @route   DELETE /api/contact/:id
// @access  Admin
export const deleteContact = asyncHandler(async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      res.status(404);
      throw new Error('Contact not found');
    }

    await contact.deleteOne();

    console.log(`🗑️ Contact ${req.params.id} deleted by admin ${req.user.name}`);

    res.status(200).json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting contact:', error);
    res.status(500);
    throw new Error('Failed to delete contact');
  }
});

// @desc    Bulk update contacts (admin only)
// @route   POST /api/contact/bulk-update
// @access  Admin
export const bulkUpdateContacts = asyncHandler(async (req, res) => {
  const { contactIds, action, status } = req.body;

  if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
    res.status(400);
    throw new Error('Contact IDs array is required');
  }

  if (!action || !['updateStatus', 'delete', 'archive'].includes(action)) {
    res.status(400);
    throw new Error('Invalid action. Must be: updateStatus, delete, or archive');
  }

  try {
    let result;

    switch (action) {
      case 'updateStatus':
        if (!status) {
          res.status(400);
          throw new Error('Status is required for updateStatus action');
        }
        
        result = await Contact.updateMany(
          { _id: { $in: contactIds } },
          { status }
        );
        break;

      case 'delete':
        result = await Contact.deleteMany({ _id: { $in: contactIds } });
        break;

      case 'archive':
        result = await Contact.updateMany(
          { _id: { $in: contactIds } },
          { status: 'archived' }
        );
        break;
    }

    console.log(`📊 Bulk ${action} performed on ${result.modifiedCount || result.deletedCount} contacts by admin ${req.user.name}`);

    res.status(200).json({
      success: true,
      message: `Bulk ${action} completed successfully`,
      affected: result.modifiedCount || result.deletedCount
    });
  } catch (error) {
    console.error('❌ Error in bulk update:', error);
    res.status(500);
    throw new Error('Failed to perform bulk update');
  }
});

// @desc    Get contact statistics (admin only)
// @route   GET /api/contact/stats
// @access  Admin
export const getContactStats = asyncHandler(async (req, res) => {
  try {
    const stats = await Contact.getStats();
    
    // Get recent contacts (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentCount = await Contact.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Get today's contacts
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayCount = await Contact.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    });

    res.status(200).json({
      success: true,
      stats: {
        ...stats,
        recent: recentCount,
        today: todayCount
      }
    });
  } catch (error) {
    console.error('❌ Error fetching contact stats:', error);
    res.status(500);
    throw new Error('Failed to fetch statistics');
  }
});

// @desc    Get contact messages by user email (for admin)
// @route   GET /api/admin/contacts/user/:email
// @access  Admin
export const getContactsByUser = asyncHandler(async (req, res) => {
  const { email } = req.params;

  try {
    const contacts = await Contact.find({ email: email.toLowerCase() })
      .sort('-createdAt')
      .limit(10);

    res.status(200).json({
      success: true,
      data: contacts
    });
  } catch (error) {
    console.error('❌ Error fetching user contacts:', error);
    res.status(500);
    throw new Error('Failed to fetch user contacts');
  }
});