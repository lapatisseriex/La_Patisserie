import { asyncHandler } from '../utils/asyncHandler.js';
import { sendTestEmail } from '../utils/testEmailService.js';

/**
 * @desc    Send a test email (NO AUTHENTICATION REQUIRED - FOR TESTING ONLY)
 * @route   GET /api/test-email?email=your@email.com
 * @access  Public (Remove this in production!)
 */
export const sendTestEmailHandler = asyncHandler(async (req, res) => {
  const { email } = req.query;

  // Validate email
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Please provide an email address using ?email=your@email.com'
    });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    });
  }

  console.log('📧 Test email request received for:', email);

  // Send test email
  const result = await sendTestEmail(email);

  // Return response
  if (result.success) {
    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        recipient: result.recipient,
        messageId: result.messageId,
        timestamp: result.timestamp
      }
    });
  } else {
    res.status(500).json({
      success: false,
      message: result.message,
      error: result.error,
      errorCode: result.errorCode
    });
  }
});
