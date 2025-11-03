import nodemailer from 'nodemailer';

/**
 * Simple test email function - No authentication required
 * This is for testing email configuration only
 */
export const sendTestEmail = async (recipientEmail) => {
  try {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📧 [TEST EMAIL] Starting test email send');
    console.log('✉️  Recipient:', recipientEmail);
    console.log('📮 SMTP User:', process.env.EMAIL_USER);
    console.log('═══════════════════════════════════════════════════════════════');

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Verify SMTP connection
    console.log('🔍 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');

    // Email content
    const mailOptions = {
      from: {
        name: 'La Patisserie - Test',
        address: process.env.EMAIL_USER
      },
      to: recipientEmail,
      subject: '✅ Test Email - La Patisserie Email System',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Test Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            
            <h1 style="color: #333; text-align: center; margin-bottom: 20px;">
              ✅ Email System Test Successful!
            </h1>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Congratulations! Your email system is working perfectly.
            </p>
            
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #0369a1; margin-top: 0;">✨ Test Details:</h3>
              <ul style="color: #666;">
                <li><strong>From:</strong> ${process.env.EMAIL_USER}</li>
                <li><strong>To:</strong> ${recipientEmail}</li>
                <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
                <li><strong>Status:</strong> <span style="color: #16a34a; font-weight: bold;">SUCCESS ✅</span></li>
              </ul>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              Your SMTP configuration is working correctly. You can now send emails for:
            </p>
            
            <ul style="color: #666; font-size: 14px;">
              <li>Order confirmations</li>
              <li>Password resets</li>
              <li>Newsletter subscriptions</li>
              <li>Contact form submissions</li>
            </ul>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #999; font-size: 12px;">
                This is an automated test email from La Patisserie<br>
                Sent at ${new Date().toLocaleString()}
              </p>
            </div>
            
          </div>
        </body>
        </html>
      `,
      text: `
        ✅ Email System Test Successful!
        
        Congratulations! Your email system is working perfectly.
        
        Test Details:
        - From: ${process.env.EMAIL_USER}
        - To: ${recipientEmail}
        - Time: ${new Date().toLocaleString()}
        - Status: SUCCESS ✅
        
        Your SMTP configuration is working correctly.
        
        This is an automated test email from La Patisserie.
      `
    };

    // Send email
    console.log('📤 Sending test email...');
    const result = await transporter.sendMail(mailOptions);

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ [SUCCESS] Test email sent!');
    console.log('📧 Message ID:', result.messageId);
    console.log('✉️  Delivered to:', recipientEmail);
    console.log('⏰ Time:', new Date().toLocaleString());
    console.log('═══════════════════════════════════════════════════════════════');

    return {
      success: true,
      messageId: result.messageId,
      recipient: recipientEmail,
      timestamp: new Date().toISOString(),
      message: 'Test email sent successfully! Check your inbox.'
    };

  } catch (error) {
    console.error('═══════════════════════════════════════════════════════════════');
    console.error('❌ [FAILED] Test email error!');
    console.error('📧 Error:', error.message);
    console.error('📧 Error Code:', error.code);
    console.error('✉️  Recipient:', recipientEmail);
    console.error('═══════════════════════════════════════════════════════════════');

    return {
      success: false,
      error: error.message,
      errorCode: error.code,
      recipient: recipientEmail,
      timestamp: new Date().toISOString(),
      message: 'Failed to send test email. Check server logs for details.'
    };
  }
};
