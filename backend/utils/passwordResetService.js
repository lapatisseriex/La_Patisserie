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
      </head>
      <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background: #f5f5f5; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 30px; border: 1px solid #ddd;">
          
          <h1 style="color: #333; margin-bottom: 20px;">Password Reset Request</h1>
          
          <p style="margin-bottom: 15px;">Hello,</p>
          
          <p style="margin-bottom: 15px;">You requested to reset your password for your La Pâtisserie account. Use the OTP code below:</p>
          
          <div style="background: #f5f5f5; border: 2px dashed #333; padding: 20px; text-align: center; margin: 20px 0;">
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; font-family: 'Courier New', monospace;">${otp}</div>
          </div>
          
          <p style="margin-bottom: 15px;">This code will expire in <strong>10 minutes</strong>.</p>
          
          <div style="background: #f5f5f5; border: 1px solid #ddd; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #333;"><strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
          </div>
          
          <p style="margin-bottom: 5px;">Best regards,</p>
          <p style="margin-bottom: 20px;"><strong>La Pâtisserie Team</strong></p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          
          <p style="font-size: 12px; color: #666; margin: 0; text-align: center;">
            This is an automated email. Please do not reply to this message.<br>
            La Pâtisserie | lapatisserielapatisserie@gmail.com
          </p>
          
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