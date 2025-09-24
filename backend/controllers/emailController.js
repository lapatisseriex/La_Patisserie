import nodemailer from 'nodemailer';
import User from '../models/userModel.js';

// Create transporter (you'll need to configure with your email service)
const createTransporter = () => {
  // For development, you can use Gmail or any SMTP service
  // Make sure to set up environment variables for production
  return nodemailer.createTransport({
    service: 'gmail', // or your email service
    auth: {
      user: process.env.EMAIL_USER ,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Store OTPs temporarily (in production, use Redis or database)
const otpStore = new Map();

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP to email
export const sendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const userId = req.user.uid;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check if email is already verified by another user
    const existingUser = await User.findOne({ 
      email: email,
      isEmailVerified: true,
      uid: { $ne: userId }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'This email is already verified by another user' });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiryTime = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP with expiry
    otpStore.set(`${userId}_${email}`, {
      otp,
      expiryTime,
      attempts: 0
    });

    // For development, log the OTP (remove in production)
    console.log(`OTP for ${email}: ${otp}`);

    try {
      // Send email (comment out if you don't have email configured)
      const transporter = createTransporter();
      
      const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@lapatisserie.com',
        to: email,
        subject: 'Email Verification OTP - La Patisserie',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Email Verification</h2>
            <p>Hello,</p>
            <p>Your OTP for email verification is:</p>
            <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0;">
              ${otp}
            </div>
            <p style="color: #666;">This OTP is valid for 10 minutes.</p>
            <p>If you didn't request this verification, please ignore this email.</p>
            <p>Best regards,<br>La Patisserie Team</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`OTP email sent to ${email}`);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Continue anyway for development - OTP is logged to console
    }

    res.status(200).json({ 
      message: 'OTP sent successfully',
      // For development only - remove in production
      otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

// Verify OTP
export const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const userId = req.user.uid;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const storedData = otpStore.get(`${userId}_${email}`);

    if (!storedData) {
      return res.status(400).json({ message: 'OTP not found or expired' });
    }

    // Check if OTP has expired
    if (Date.now() > storedData.expiryTime) {
      otpStore.delete(`${userId}_${email}`);
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Check attempt limit
    if (storedData.attempts >= 3) {
      otpStore.delete(`${userId}_${email}`);
      return res.status(400).json({ message: 'Too many incorrect attempts. Please request a new OTP.' });
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      storedData.attempts += 1;
      return res.status(400).json({ 
        message: 'Invalid OTP',
        attemptsLeft: 3 - storedData.attempts
      });
    }

    // OTP is correct - update user
    const user = await User.findOneAndUpdate(
      { uid: userId },
      { 
        email: email,
        isEmailVerified: true
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Clean up OTP
    otpStore.delete(`${userId}_${email}`);

    res.status(200).json({ 
      message: 'Email verified successfully',
      user: {
        email: user.email,
        isEmailVerified: user.isEmailVerified
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
}; 