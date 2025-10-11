import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Create transporter for sending emails
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 20000, // 20 seconds
    rateLimit: 5 // max 5 messages per rateDelta
  });
};

// Generate a 6-digit OTP
export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Generate OTP expiry time (10 minutes from now)
export const generateOTPExpiry = () => {
  return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
};

// Email template for password reset OTP
const getPasswordResetEmailTemplate = (otp, userEmail) => {
  return {
    subject: 'Reset Your Password - La Pâtisserie',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset OTP</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background-color: #f8f9fa;
            margin: 0;
            padding: 0;
          }
          .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background: white; 
            border-radius: 10px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header { 
            background: linear-gradient(135deg, #e91e63, #f06292); 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
          }
          .header h1 { 
            margin: 0; 
            font-size: 24px; 
            font-weight: 600;
          }
          .content { 
            padding: 30px 20px; 
          }
          .otp-box { 
            background: #f8f9fa; 
            border: 2px dashed #e91e63; 
            border-radius: 8px; 
            padding: 20px; 
            text-align: center; 
            margin: 20px 0; 
          }
          .otp-code { 
            font-size: 32px; 
            font-weight: bold; 
            color: #e91e63; 
            letter-spacing: 4px; 
            margin: 10px 0;
            font-family: 'Courier New', monospace;
          }
          .warning { 
            background: #fff3cd; 
            border: 1px solid #ffeaa7; 
            border-radius: 5px; 
            padding: 15px; 
            margin: 20px 0; 
            color: #856404;
          }
          .footer { 
            background: #f8f9fa; 
            padding: 20px; 
            text-align: center; 
            color: #666; 
            font-size: 14px; 
            border-top: 1px solid #eee;
          }
          .logo { 
            font-size: 18px; 
            font-weight: bold; 
            color: #e91e63; 
            margin-bottom: 10px; 
          }
          @media (max-width: 600px) {
            .container { margin: 10px; }
            .content { padding: 20px 15px; }
            .otp-code { font-size: 28px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🧁 La Pâtisserie</div>
            <h1>Password Reset Request</h1>
          </div>
          
          <div class="content">
            <p>Hello,</p>
            <p>We received a request to reset your password for your La Pâtisserie account associated with <strong>${userEmail}</strong>.</p>
            
            <div class="otp-box">
              <p style="margin: 0; font-size: 16px; color: #666;">Your verification code is:</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 0; font-size: 14px; color: #999;">Enter this code to reset your password</p>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important Security Information:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>This code is valid for <strong>10 minutes only</strong></li>
                <li>Never share this code with anyone</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>For security, your account will be temporarily locked after multiple failed attempts</li>
              </ul>
            </div>
            
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            
            <p>Need help? Contact our support team at <a href="mailto:support@lapatisserie.com" style="color: #e91e63;">support@lapatisserie.com</a></p>
          </div>
          
          <div class="footer">
            <p><strong>La Pâtisserie</strong><br>
            Sweet moments, delivered fresh<br>
            <a href="mailto:support@lapatisserie.com" style="color: #e91e63;">support@lapatisserie.com</a></p>
            <p style="font-size: 12px; color: #999; margin-top: 15px;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  };
};

// Send password reset OTP email
export const sendPasswordResetOTP = async (userEmail, otp) => {
  try {
    const transporter = createTransporter();
    const emailTemplate = getPasswordResetEmailTemplate(otp, userEmail);
    
    const mailOptions = {
      from: {
        name: 'La Pâtisserie',
        address: process.env.EMAIL_USER
      },
      to: userEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      headers: {
        'X-Password-Reset': 'true',
        'X-Priority': 'high',
        'X-Mailer': 'La-Patisserie-Auth-System'
      }
    };

    console.log(`Sending password reset OTP to ${userEmail}`);
    const result = await transporter.sendMail(mailOptions);
    
    console.log(`Password reset OTP sent successfully to ${userEmail}:`, result.messageId);
    return {
      success: true,
      messageId: result.messageId
    };
    
  } catch (error) {
    console.error('Error sending password reset OTP:', error);
    throw new Error('Failed to send password reset email. Please try again later.');
  }
};

// Rate limiting constants
export const PASSWORD_RESET_LIMITS = {
  MAX_ATTEMPTS: 5,
  BLOCK_DURATION: 15 * 60 * 1000, // 15 minutes
  OTP_VALIDITY: 10 * 60 * 1000, // 10 minutes
};