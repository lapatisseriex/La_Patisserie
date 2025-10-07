import asyncHandler from 'express-async-handler';
import twilio from 'twilio';
import User from '../models/userModel.js';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_ACCOUNT_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_TRIAL_NUMBER;
const client = new twilio.Twilio(accountSid, authToken);

// In-memory OTP store (use Redis or DB for production)
const otpStore = {};

// @desc    Send OTP
// @route   POST /api/twilio/send-otp
// @access  Private
export const sendOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number required' });
  
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store OTP with expiry time (3 minutes)
  otpStore[phone] = {
    otp,
    expiry: Date.now() + 180000 // 3 minutes in milliseconds
  };
  
  try {
    await client.messages.create({
      body: `Your OTP for La Patisserie is ${otp}. Valid for 3 minutes.`,
      from: twilioNumber,
      to: "+91"+phone
    });
    
    console.log(`OTP sent to ${phone}`);
    
    res.json({ 
      success: true, 
      message: 'OTP sent successfully',
      expiry: otpStore[phone].expiry
    });
  } catch (err) {
    console.error('Twilio error:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// @desc    Verify OTP
// @route   POST /api/twilio/verify-otp
// @access  Private
export const verifyOtp = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;
  const uid = req.user.uid;
  
  if (!phone || !otp) {
    return res.status(400).json({ error: 'Phone and OTP required' });
  }
  
  // Check if OTP exists and hasn't expired
  if (otpStore[phone] && 
      otpStore[phone].otp === otp && 
      otpStore[phone].expiry > Date.now()) {
    
    try {
      // Find the user and update their phone verification status
      const user = await User.findOne({ uid });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Update user's phone and verification status
      user.phone = phone;
      user.phoneVerified = true;
      user.phoneVerifiedAt = new Date();
      
      await user.save();
      
      // Clean up the OTP store
      delete otpStore[phone];
      
      console.log(`Phone number ${phone} verified for user ${uid}`);
      
      return res.json({ 
        success: true, 
        message: 'Phone number verified successfully',
        user: {
          phone: user.phone,
          phoneVerified: user.phoneVerified,
          phoneVerifiedAt: user.phoneVerifiedAt
        }
      });
    } catch (err) {
      console.error('Error updating user:', err);
      return res.status(500).json({ error: 'Failed to update user information' });
    }
  }
  
  // If OTP is invalid or expired
  if (!otpStore[phone] || otpStore[phone].expiry <= Date.now()) {
    return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
  }
  
  res.status(400).json({ error: 'Invalid OTP' });
});