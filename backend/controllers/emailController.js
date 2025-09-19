import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import { sendOTPEmail, generateOTP, verifyOTP } from '../utils/emailService.js';

// @desc    Send email verification OTP
// @route   POST /api/auth/email/send-verification
// @access  Private
export const sendEmailVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const userId = req.user.uid;

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error('Invalid email format');
  }

  // Check if email already exists for another user
  const existingUser = await User.findOne({ email, uid: { $ne: userId } });
  if (existingUser) {
    res.status(400);
    throw new Error('Email already in use by another account');
  }

  // Generate OTP
  const otp = generateOTP();
  
  // OTP expiration time (10 minutes from now)
  const otpExpires = new Date();
  otpExpires.setMinutes(otpExpires.getMinutes() + 10);

  try {
    // Find user and update with new email and OTP
    const user = await User.findOne({ uid: userId });
    
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Save email and OTP to user
    user.email = email;
    user.isEmailVerified = false;
    user.emailVerificationOTP = otp;
    user.emailVerificationOTPExpires = otpExpires;
    
    await user.save();

    // Send verification email
    await sendOTPEmail(email, otp);

    res.status(200).json({
      success: true,
      message: 'Verification email sent',
      emailMasked: maskEmail(email),
      expiresAt: otpExpires
    });
  } catch (error) {
    console.error('Error sending verification email:', error);
    res.status(500);
    throw new Error('Failed to send verification email');
  }
});

// @desc    Verify email with OTP
// @route   POST /api/auth/email/verify
// @access  Private
export const verifyEmail = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  const userId = req.user.uid;

  if (!otp) {
    res.status(400);
    throw new Error('OTP is required');
  }

  const user = await User.findOne({ uid: userId });
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Check if user has an OTP stored
  if (!user.emailVerificationOTP) {
    res.status(400);
    throw new Error('No verification code found. Please request a new one.');
  }

  // Check if OTP has expired
  if (user.emailVerificationOTPExpires < new Date()) {
    res.status(400);
    throw new Error('Verification code has expired. Please request a new one.');
  }

  // Verify OTP
  if (verifyOTP(otp, user.emailVerificationOTP)) {
    // Update user as verified
    user.isEmailVerified = true;
    user.emailVerificationOTP = undefined;
    user.emailVerificationOTPExpires = undefined;
    
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      email: user.email,
      isEmailVerified: true
    });
  } else {
    res.status(400);
    throw new Error('Invalid verification code');
  }
});

// @desc    Resend email verification OTP
// @route   POST /api/auth/email/resend-verification
// @access  Private
export const resendEmailVerification = asyncHandler(async (req, res) => {
  const userId = req.user.uid;

  const user = await User.findOne({ uid: userId });
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (!user.email) {
    res.status(400);
    throw new Error('No email associated with this account');
  }

  // Generate new OTP
  const otp = generateOTP();
  
  // OTP expiration time (10 minutes from now)
  const otpExpires = new Date();
  otpExpires.setMinutes(otpExpires.getMinutes() + 10);

  // Update user with new OTP
  user.emailVerificationOTP = otp;
  user.emailVerificationOTPExpires = otpExpires;
  
  await user.save();

  try {
    // Send verification email
    await sendOTPEmail(user.email, otp);

    res.status(200).json({
      success: true,
      message: 'Verification email resent',
      emailMasked: maskEmail(user.email),
      expiresAt: otpExpires
    });
  } catch (error) {
    console.error('Error resending verification email:', error);
    res.status(500);
    throw new Error('Failed to resend verification email');
  }
});

// @desc    Get email verification status
// @route   GET /api/auth/email/verification-status
// @access  Private
export const getVerificationStatus = asyncHandler(async (req, res) => {
  const userId = req.user.uid;

  const user = await User.findOne({ uid: userId });
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.status(200).json({
    success: true,
    email: user.email || null,
    isEmailVerified: user.isEmailVerified || false
  });
});

// @desc    Update verified email address
// @route   POST /api/auth/email/update
// @access  Private
export const updateEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const userId = req.user.uid;

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error('Invalid email format');
  }

  // Check if email already exists for another user
  const existingUser = await User.findOne({ email, uid: { $ne: userId } });
  if (existingUser) {
    res.status(400);
    throw new Error('Email already in use by another account');
  }

  try {
    // Find user
    const user = await User.findOne({ uid: userId });
    
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Generate OTP for the new email
    const otp = generateOTP();
    
    // OTP expiration time (10 minutes from now)
    const otpExpires = new Date();
    otpExpires.setMinutes(otpExpires.getMinutes() + 10);

    // Save the new email temporarily and OTP
    user.newEmail = email;
    user.emailVerificationOTP = otp;
    user.emailVerificationOTPExpires = otpExpires;
    
    await user.save();

    // Send verification email to the new address
    await sendOTPEmail(email, otp);

    res.status(200).json({
      success: true,
      message: 'Verification email sent to new address',
      emailMasked: maskEmail(email),
      expiresAt: otpExpires
    });
  } catch (error) {
    console.error('Error sending verification email:', error);
    res.status(500);
    throw new Error('Failed to send verification email');
  }
});

// @desc    Verify new email with OTP and update user's email
// @route   POST /api/auth/email/verify-update
// @access  Private
export const verifyNewEmail = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  const userId = req.user.uid;

  if (!otp) {
    res.status(400);
    throw new Error('OTP is required');
  }

  const user = await User.findOne({ uid: userId });
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Check if user has a new email and OTP stored
  if (!user.newEmail || !user.emailVerificationOTP) {
    res.status(400);
    throw new Error('No email update request found. Please try again.');
  }

  // Check if OTP has expired
  if (user.emailVerificationOTPExpires < new Date()) {
    res.status(400);
    throw new Error('Verification code has expired. Please request a new one.');
  }

  // Verify OTP
  if (verifyOTP(otp, user.emailVerificationOTP)) {
    // Update user's email
    user.email = user.newEmail;
    user.isEmailVerified = true;
    user.newEmail = undefined;
    user.emailVerificationOTP = undefined;
    user.emailVerificationOTPExpires = undefined;
    
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email updated and verified successfully',
      email: user.email,
      isEmailVerified: true
    });
  } else {
    res.status(400);
    throw new Error('Invalid verification code');
  }
});

// Helper function to mask email for privacy
const maskEmail = (email) => {
  const [username, domain] = email.split('@');
  const maskedUsername = username.charAt(0) + 
                         '*'.repeat(Math.max(username.length - 2, 1)) + 
                         username.charAt(username.length - 1);
  return `${maskedUsername}@${domain}`;
};