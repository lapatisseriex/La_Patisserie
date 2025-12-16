import asyncHandler from 'express-async-handler';
import firebaseAdmin from '../config/firebase.js';
import User from '../models/userModel.js';
import Order from '../models/orderModel.js';
import { 
  generateOTP, 
  generateOTPExpiry,
  generateSignupOTPExpiry, 
  sendPasswordResetOTP, 
  sendSignupVerificationOTP,
  PASSWORD_RESET_LIMITS 
} from '../utils/passwordResetService.js';
import { sendWelcomeEmail } from '../utils/welcomeEmailService.js';

// Helper function to handle user conflicts
const resolveUserConflict = async (uid, email, locationId) => {
  console.log(`Resolving user conflict for UID: ${uid}, Email: ${email}`);
  
  // First check if there's a user with this UID
  let user = await User.findOne({ uid });
  
  if (user) {
    // If email doesn't match, update it
    if (user.email !== email) {
      console.log(`Email mismatch: updating from ${user.email} to ${email}`);
      
      // Also check if there's another user with this email
      const existingEmailUser = await User.findOne({ email: email });
      if (existingEmailUser && existingEmailUser._id.toString() !== user._id.toString()) {
        console.log(`Found another user with email ${email}, merging accounts`);
        
        // Merge the accounts - copy important data to keep
        if (existingEmailUser.name && !user.name) user.name = existingEmailUser.name;
        if (existingEmailUser.dob && !user.dob) user.dob = existingEmailUser.dob;
        if (existingEmailUser.gender && !user.gender) user.gender = existingEmailUser.gender;
        if (existingEmailUser.location && !user.location) user.location = existingEmailUser.location;
        
        // Mark the duplicate account for cleanup
        await User.updateOne(
          { _id: existingEmailUser._id },
          { $set: { isActive: false, notes: `Merged with user ${user._id} on ${new Date().toISOString()}` }}
        );
      }
      
      user.email = email;
      try {
        await user.save();
      } catch (saveError) {
        if (saveError.code === 11000 && saveError.keyPattern && saveError.keyPattern.phone) {
          console.log('Phone field conflict during save, removing phone field');
          user.phone = undefined;
          await user.save();
        } else {
          throw saveError;
        }
      }
    }
    return user;
  }
  
  // Then check if there's a user with this email
  user = await User.findOne({ email: email, isActive: { $ne: false } });
  
  if (user) {
    // If UID doesn't match, update it
    if (user.uid !== uid) {
      console.log(`UID mismatch: updating from ${user.uid} to ${uid}`);
      user.uid = uid;
      try {
        await user.save();
      } catch (saveError) {
        if (saveError.code === 11000 && saveError.keyPattern && saveError.keyPattern.phone) {
          console.log('Phone field conflict during UID update, removing phone field');
          user.phone = undefined;
          await user.save();
        } else {
          throw saveError;
        }
      }
    }
    return user;
  }
  
  // No existing user found
  return null;
};

// @desc    Verify Firebase ID token and create/fetch user
// @route   POST /api/auth/verify
// @access  Public
export const verifyToken = asyncHandler(async (req, res) => {
  const { idToken, locationId, authMethod } = req.body;

  if (!idToken) {
    res.status(400);
    throw new Error('No ID token provided');
  }

  try {
    // Log verification attempt
    console.log(`Token verification attempt: ${new Date().toISOString()}`);
    
    // Verify token with Firebase Admin SDK with improved error handling
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken, true)
      .catch(error => {
        console.error('Firebase token verification error:', error);
        res.status(401);
        throw new Error(`Invalid authentication token: ${error.message}`);
      });
      
    if (!decodedToken) {
      res.status(401);
      throw new Error('Token verification failed');
    }
    
    console.log(`Token successfully verified for UID: ${decodedToken.uid}`);
    console.log('Decoded token info:', { uid: decodedToken.uid, email: decodedToken.email, email_verified: decodedToken.email_verified });
    
    // Get email and other info from token
    const { uid, email, name, picture, email_verified } = decodedToken;
    
    // Check if this user exists but is inactive
    const inactiveUser = await User.findOne({ uid, isActive: false });
    if (inactiveUser) {
      console.log(`Reactivating previously inactive user: ${inactiveUser._id} (${uid})`);
      // Reactivate the user
      await User.updateOne(
        { _id: inactiveUser._id },
        { $set: { isActive: true, lastLogin: new Date(), lastActive: new Date() } }
      );
    }

    if (!email) {
      console.error('No email available from token');
      res.status(400);
      throw new Error('Email is required for authentication');
    }
    
    // First check for potential user conflicts and resolve them
    let user = await resolveUserConflict(uid, email, locationId);
    let isNewUser = false;

    // If no user found, create a new one
    if (!user) {
      console.log(`No existing user found for ${email}, creating new user`);
      isNewUser = true;
      
      // Determine role based on email (you can customize this logic)
      let role = 'user';
      if (email === 'admin@lapatisserie.com') { // Replace with your admin email
        role = 'admin';
      }
      
      try {
        // Create user with location if provided (no phone field to avoid conflicts)
        user = await User.create({
          uid,
          email,
          name: name || null,
          profilePhoto: picture ? { url: picture, public_id: '' } : { url: '', public_id: '' },
          role,
          location: locationId || null,
          lastLogin: new Date(),
          lastActive: new Date(),
          isActive: true,
          // Set email verification based on Firebase token
          emailVerified: email_verified || false,
          emailVerifiedAt: email_verified ? new Date() : null
        });
        
        console.log(`New user created successfully: ${user._id} (${email})`);
        
        // Send welcome email to all new users (don't await - send asynchronously)
        sendWelcomeEmail({ 
          name: name || user.name || 'Valued Customer', 
          email: email 
        })
          .then(result => {
            if (result.success) {
              console.log(`✅ Welcome email sent successfully to ${email}`);
            } else {
              console.error(`❌ Failed to send welcome email to ${email}:`, result.error);
            }
          })
          .catch(err => {
            console.error(`❌ Error sending welcome email to ${email}:`, err);
          });
        
        // Emit WebSocket event to notify admin of new user signup
        try {
          const io = global.io;
          if (io) {
            io.emit('newUserSignup', {
              userId: user._id,
              userData: {
                id: user._id,
                uid: user.uid,
                email: user.email,
                name: user.name,
                role: user.role,
                location: user.location,
                createdAt: user.createdAt
              }
            });
            console.log('✅ WebSocket event "newUserSignup" emitted for new user:', user.email);
          } else {
            console.warn('⚠️ WebSocket (io) not available - cannot emit newUserSignup event');
          }
        } catch (wsError) {
          console.error('❌ Error emitting WebSocket event for new user:', wsError);
        }
      } catch (err) {
        console.error('User creation failed:', err);
        
        // If there's a duplicate key error, try to find existing user
        if (err.code === 11000) {
          console.log('Duplicate key error during creation, looking for existing user:', err.keyPattern);
          
          // Try to find user by UID or email
          user = await User.findOne({ 
            $or: [
              { uid: uid },
              { email: email }
            ]
          });
          
          if (user) {
            console.log(`Found existing user during duplicate error handling: ${user._id}`);
            // Update user with current token info
            user.uid = uid;
            user.email = email;
            user.lastLogin = new Date();
            user.lastActive = new Date();
            user.isActive = true;
            
            try {
              await user.save();
              console.log(`Updated existing user: ${user._id}`);
            } catch (saveErr) {
              console.error('Failed to update existing user:', saveErr);
              // Continue anyway with the found user
            }
            
            isNewUser = false;
          } else {
            console.error('No existing user found even after duplicate key error');
            throw new Error('Failed to create or find user');
          }
        } else {
          // If it's another error, throw it
          console.error('User creation failed with non-duplicate key error:', err);
          throw err;
        }
      }
      
      // Populate the newly created user
      user = await User.findOne({ uid }).populate('location').populate('hostel');
    } else {
      // User already exists, update user data
      // Check if we need to update email verification from Firebase
      const updateFields = {
        lastLogin: new Date(), 
        lastActive: new Date(),
        isActive: true
      };
      
      // Track if email was just verified to send welcome email
      let emailJustVerified = false;
      
      // If Firebase says email is verified but our DB doesn't reflect this, update it
      if (email_verified && !user.emailVerified) {
        console.log(`Updating email verification for existing user ${user.email} based on Firebase token`);
        updateFields.emailVerified = true;
        updateFields.emailVerifiedAt = new Date();
        emailJustVerified = true;
      }
      
      // Add location if provided
      if (locationId) {
        updateFields.location = locationId;
      }
      
      // Update lastLogin and ensure the user is active
      await User.updateOne(
        { _id: user._id },
        { $set: updateFields }
      );
      
      // Send welcome email if email was just verified
      if (emailJustVerified) {
        console.log(`📧 Email verified for existing user ${user.email}, sending welcome email`);
        sendWelcomeEmail({ 
          name: name || user.name || 'Valued Customer', 
          email: user.email 
        })
          .then(result => {
            if (result.success) {
              console.log(`✅ Welcome email queued for ${user.email} after verification`);
            } else {
              console.error(`❌ Failed to send welcome email to ${user.email}:`, result.error);
            }
          })
          .catch(err => {
            console.error(`❌ Error queueing welcome email for ${user.email}:`, err);
          });
      }
      // Prepare the update object for the user
      const updateData = {
        lastLogin: new Date(),
        lastActive: new Date(),
        isActive: true
      };
      
      // Update location if provided and user doesn't have one
      if (locationId && !user.location) {
        updateData.location = locationId;
      }
      
      // Update user info from Firebase token if needed
      if (name && !user.name) {
        updateData.name = name;
      }
      if (picture && !user.profilePhoto?.url) {
        updateData.profilePhoto = { url: picture, public_id: '' };
      }
      
      // Update the user record
      try {
        await User.updateOne({ _id: user._id }, { $set: updateData });
        console.log(`User ${user._id} session updated: ${JSON.stringify(updateData)}`);
        
        // Update local user object with the changes
        Object.assign(user, updateData);
      } catch (updateError) {
        console.error('Error updating user session data:', updateError);
        // Continue execution even if update fails
      }
      
      // Make sure location and hostel are populated
      if (!user.populated('location') || !user.populated('hostel')) {
        user = await User.findOne({ uid }).populate('location').populate('hostel');
      }
    }

    // Check if profile is incomplete (no name or dob)
    const isProfileIncomplete = !user.name || !user.dob;
    
    // Format the date of birth for the response
    const formattedDob = user.dob ? user.dob.toISOString().split('T')[0] : null;

    // Compute order summary so frontend can tailor messaging (e.g. welcome gift vs premium)
    let totalCompletedOrders = 0;
    let lastOrderAt = null;
    try {
      totalCompletedOrders = await Order.countDocuments({
        userId: user._id,
        orderStatus: { $ne: 'cancelled' }
      });

      if (totalCompletedOrders > 0) {
        const latestOrder = await Order.findOne({ userId: user._id })
          .sort({ createdAt: -1 })
          .select('createdAt');
        if (latestOrder) {
          lastOrderAt = latestOrder.createdAt;
        }
      }
    } catch (orderStatsError) {
      console.error('Error computing order stats for user:', user._id, orderStatsError);
    }

    const hasPlacedOrder = totalCompletedOrders > 0;

    res.status(200).json({
      success: true,
      isNewUser: isNewUser || isProfileIncomplete, // Mark as new user if profile is incomplete
      user: {
        _id: user._id, // Add MongoDB ObjectId for WebSocket and notifications
        uid: user.uid,
        email: user.email,
        name: user.name,
        role: user.role,
        dob: formattedDob, // Use formatted date
        gender: user.gender || '',
        phone: user.phone || '',
        city: user.city || '',
        pincode: user.pincode || '',
        country: user.country || 'India',
        anniversary: user.anniversary || null,
        location: user.location || null,
        hostel: user.hostel || null,
        userAddress: user.userAddress || null, // User's precise sublocation
        profilePhoto: user.profilePhoto || { url: '', public_id: '' }, // Include profile photo
        emailVerified: user.emailVerified || false,
        emailVerifiedAt: user.emailVerifiedAt || null,
        phoneVerified: user.phoneVerified || false,
        phoneVerifiedAt: user.phoneVerifiedAt || null,
        isProfileIncomplete, // Add flag for profile completion status
        hasPlacedOrder,
        ordersSummary: {
          totalOrders: totalCompletedOrders,
          lastOrderAt
        }
      }
    });
  } catch (error) {
    // Log detailed error for debugging
    console.error('Authentication Error:', {
      message: error.message,
      stack: error.stack,
      code: error.code || 'unknown',
      details: error.errorInfo || {},
      time: new Date().toISOString()
    });
    
    // Provide a user-friendly response
    let statusCode = 401;
    let errorMessage = 'Invalid token';
    
    // More specific error messages based on error type
    if (error.code === 'auth/id-token-expired') {
      errorMessage = 'Authentication session expired';
    } else if (error.code === 'auth/id-token-revoked') {
      errorMessage = 'Authentication session was revoked';
    } else if (error.code === 'auth/invalid-credential') {
      errorMessage = 'Invalid credentials provided';
    } else if (error.code?.includes('auth/')) {
      errorMessage = 'Authentication failed: ' + error.message;
    } else if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      statusCode = 500;
      errorMessage = 'Database error occurred during authentication';
    }
    
    res.status(statusCode);
    throw new Error(errorMessage);
  }
});

// @desc    Send password reset OTP
// @route   POST /api/auth/forgot-password
// @access  Public
export const requestPasswordResetOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email address is required');
  }

  try {
    // Find user by email
    const user = await User.findOne({ 
      email: email.toLowerCase().trim(),
      isActive: true 
    });

    if (!user) {
      res.status(404);
      throw new Error('No account found with this email address');
    }

    // Check if user is currently blocked from password reset attempts
    if (user.passwordResetBlockedUntil && user.passwordResetBlockedUntil > new Date()) {
      const remainingTime = Math.ceil((user.passwordResetBlockedUntil - new Date()) / 1000 / 60);
      res.status(429);
      throw new Error(`Too many failed attempts. Please try again in ${remainingTime} minutes`);
    }

    // Check rate limiting - max 3 OTP requests per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (user.passwordResetOTPExpires && user.passwordResetOTPExpires > oneHourAgo) {
      const recentRequests = user.passwordResetAttempts || 0;
      if (recentRequests >= 3) {
        res.status(429);
        throw new Error('Too many OTP requests. Please try again after an hour');
      }
    }

    // Generate OTP and expiry
    const otp = generateOTP();
    const otpExpiry = generateOTPExpiry();

    // Save OTP to database
    user.passwordResetOTP = otp;
    user.passwordResetOTPExpires = otpExpiry;
    user.passwordResetAttempts = (user.passwordResetAttempts || 0) + 1;
    
    await user.save();

    // Send OTP via email
    await sendPasswordResetOTP(user.email, otp);

    console.log(`Password reset OTP sent to user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password reset OTP sent to your email address',
      expiresIn: '10 minutes'
    });

  } catch (error) {
    console.error('Error in requestPasswordResetOTP:', error);
    
    if (error.message.includes('Failed to send password reset email')) {
      res.status(500);
      throw new Error('Unable to send email. Please try again later');
    }
    
    throw error;
  }
});

// @desc    Verify password reset OTP
// @route   POST /api/auth/verify-reset-otp
// @access  Public
export const verifyPasswordResetOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400);
    throw new Error('Email and OTP are required');
  }

  try {
    // Find user by email
    const user = await User.findOne({ 
      email: email.toLowerCase().trim(),
      isActive: true 
    });

    if (!user) {
      res.status(404);
      throw new Error('No account found with this email address');
    }

    // Check if user is blocked
    if (user.passwordResetBlockedUntil && user.passwordResetBlockedUntil > new Date()) {
      const remainingTime = Math.ceil((user.passwordResetBlockedUntil - new Date()) / 1000 / 60);
      res.status(429);
      throw new Error(`Account temporarily locked. Try again in ${remainingTime} minutes`);
    }

    // Check if OTP exists and is not expired
    if (!user.passwordResetOTP || !user.passwordResetOTPExpires) {
      res.status(400);
      throw new Error('No valid OTP found. Please request a new password reset');
    }

    if (user.passwordResetOTPExpires < new Date()) {
      // Clear expired OTP
      user.passwordResetOTP = undefined;
      user.passwordResetOTPExpires = undefined;
      await user.save();
      
      res.status(400);
      throw new Error('OTP has expired. Please request a new password reset');
    }

    // Verify OTP
    if (user.passwordResetOTP !== otp.trim()) {
      // Increment failed attempts
      user.passwordResetAttempts = (user.passwordResetAttempts || 0) + 1;
      
      // Block user after max attempts
      if (user.passwordResetAttempts >= PASSWORD_RESET_LIMITS.MAX_ATTEMPTS) {
        user.passwordResetBlockedUntil = new Date(Date.now() + PASSWORD_RESET_LIMITS.BLOCK_DURATION);
        await user.save();
        
        res.status(429);
        throw new Error('Too many failed attempts. Account temporarily locked for 15 minutes');
      }
      
      await user.save();
      
      const remainingAttempts = PASSWORD_RESET_LIMITS.MAX_ATTEMPTS - user.passwordResetAttempts;
      res.status(400);
      throw new Error(`Invalid OTP. ${remainingAttempts} attempts remaining`);
    }

    // OTP is valid - clear reset fields and reset attempts
    user.passwordResetOTP = undefined;
    user.passwordResetOTPExpires = undefined;
    user.passwordResetAttempts = 0;
    user.passwordResetBlockedUntil = undefined;
    
    await user.save();

    console.log(`Password reset OTP verified for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully. You can now reset your password',
      email: user.email
    });

  } catch (error) {
    console.error('Error in verifyPasswordResetOTP:', error);
    throw error;
  }
});

// @desc    Reset password with new password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    res.status(400);
    throw new Error('Email and new password are required');
  }

  if (newPassword.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters long');
  }

  try {
    // Find user by email
    const user = await User.findOne({ 
      email: email.toLowerCase().trim(),
      isActive: true 
    });

    if (!user) {
      res.status(404);
      throw new Error('No account found with this email address');
    }

    // For security, we only allow password reset immediately after OTP verification
    // Check that no reset fields exist (they should be cleared after successful OTP verification)
    if (user.passwordResetOTP || user.passwordResetOTPExpires) {
      res.status(400);
      throw new Error('Please verify your OTP first before resetting password');
    }

    // Update password in Firebase Auth
    try {
      await firebaseAdmin.auth().updateUser(user.uid, {
        password: newPassword
      });
    } catch (firebaseError) {
      console.error('Firebase password update error:', firebaseError);
      res.status(500);
      throw new Error('Failed to update password. Please try again');
    }

    // Update user's last password change (you can add this field to schema if needed)
    user.lastPasswordChange = new Date();
    await user.save();

    console.log(`Password reset completed for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now sign in with your new password'
    });

  } catch (error) {
    console.error('Error in resetPassword:', error);
    throw error;
  }
});

// Send OTP for email signup
export const sendSignupOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required',
      error: 'Email is required'
    });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if user already exists in MongoDB as a permanent (non-temp) user
  const existingUser = await User.findOne({ 
    email: normalizedEmail,
    isActive: true,
    isTemp: { $ne: true } // Exclude temporary OTP verification records
  });

  if (existingUser) {
    console.log(`Signup attempt with existing email: ${normalizedEmail}`);
    const response = {
      success: false,
      message: 'User email already exists',
      error: 'An account with this email already exists. Please sign in instead.'
    };
    console.log('Sending response:', JSON.stringify(response));
    return res.status(400).json(response);
  }

  // Check Firebase, but allow signup even if Firebase user exists from incomplete previous signup
  // We only block if BOTH Firebase AND MongoDB have the user
  let orphanedFirebaseUser = null;
  try {
    const firebaseUser = await firebaseAdmin.auth().getUserByEmail(normalizedEmail);
    orphanedFirebaseUser = firebaseUser;
    console.log(`Firebase user exists for ${normalizedEmail}, but MongoDB record doesn't - will clean up during signup completion`);
  } catch (firebaseError) {
    // If error code is 'auth/user-not-found', that's good - user doesn't exist
    if (firebaseError.code !== 'auth/user-not-found') {
      // Some other Firebase error occurred (network, permission, etc.)
      console.error('Firebase check error:', firebaseError);
      // Don't block signup for Firebase connection issues
      console.log('Firebase check failed, but allowing signup to continue');
    }
    // User not found in Firebase - good to proceed
  }

  // Clean up any orphaned Firebase user (from incomplete previous signup)
  if (orphanedFirebaseUser) {
    try {
      await firebaseAdmin.auth().deleteUser(orphanedFirebaseUser.uid);
      console.log(`Cleaned up orphaned Firebase user for ${normalizedEmail}`);
    } catch (deleteError) {
      console.error(`Failed to delete orphaned Firebase user for ${normalizedEmail}:`, deleteError);
      // Don't block signup if cleanup fails - we'll handle it during verification
    }
  }

  // Generate OTP
  const otp = generateOTP();
  const otpExpires = generateSignupOTPExpiry(); // 2 minutes for signup

  // Create or update temporary user record for OTP verification
  let tempUser = await User.findOne({ 
    email: normalizedEmail,
    isTemp: true 
  });

  if (tempUser) {
    // Update existing temp record
    tempUser.signupOTP = otp;
    tempUser.signupOTPExpires = otpExpires;
    await tempUser.save();
  } else {
    // Create new temp record
    tempUser = await User.create({
      email: normalizedEmail,
      signupOTP: otp,
      signupOTPExpires: otpExpires,
      isTemp: true,
      isActive: false
    });
  }

  // Send OTP email
  await sendSignupVerificationOTP(normalizedEmail, otp);

  console.log(`Signup OTP sent to ${normalizedEmail}`);

  res.status(200).json({
    success: true,
    message: 'Verification code sent to your email',
    email: normalizedEmail
  });
});

// Verify OTP and create user account
export const verifySignupOTP = asyncHandler(async (req, res) => {
  const { email, otp, password, name, locationId } = req.body;

  if (!email || !otp || !password || !name) {
    return res.status(400).json({
      success: false,
      message: 'Email, OTP, password, and name are required',
      error: 'Email, OTP, password, and name are required'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long',
      error: 'Password must be at least 6 characters long'
    });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Find temporary user with OTP
  const tempUser = await User.findOne({
    email: normalizedEmail,
    isTemp: true,
    signupOTP: otp
  });

  if (!tempUser) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired verification code',
      error: 'Invalid or expired verification code'
    });
  }

  // Check if OTP is expired
  if (new Date() > tempUser.signupOTPExpires) {
    return res.status(400).json({
      success: false,
      message: 'Verification code has expired. Please request a new one',
      error: 'Verification code has expired. Please request a new one'
    });
  }

    // Check if permanent user already exists in MongoDB
    const existingMongoUser = await User.findOne({
      email: normalizedEmail,
      isTemp: { $ne: true },
      isActive: true
    });

    if (existingMongoUser) {
      // User already fully registered
      await User.deleteOne({ _id: tempUser._id }); // Clean up temp user
      return res.status(400).json({
        success: false,
        message: 'User email already exists',
        error: 'Account already created. Please sign in instead.'
      });
    }

    // Create or get Firebase user
    let firebaseUser;
    let firebaseUserWasCreated = false;
    try {
      // Try to create new Firebase user
      firebaseUser = await firebaseAdmin.auth().createUser({
        email: normalizedEmail,
        password: password,
        displayName: name,
        emailVerified: true // Mark email as verified immediately
      });
      firebaseUserWasCreated = true;
      console.log(`Created new Firebase user for ${normalizedEmail}`);
    } catch (firebaseError) {
      console.error('Firebase user creation error:', firebaseError);
      
      if (firebaseError.code === 'auth/email-already-exists') {
        // Firebase user exists (from incomplete previous signup) - recover it
        try {
          firebaseUser = await firebaseAdmin.auth().getUserByEmail(normalizedEmail);
          console.log(`Recovered existing Firebase user for ${normalizedEmail}, updating credentials`);
          
          // Update the Firebase user's password and displayName to match current signup
          await firebaseAdmin.auth().updateUser(firebaseUser.uid, {
            password: password,
            displayName: name,
            emailVerified: true
          });
          console.log(`Updated Firebase user credentials for ${normalizedEmail}`);
        } catch (getError) {
          console.error('Error recovering Firebase user:', getError);
          res.status(500);
          throw new Error('Failed to create account. Please contact support.');
        }
      } else {
        // Other Firebase errors (network, invalid data, etc.)
        console.error('Unexpected Firebase error:', firebaseError);
        res.status(500);
        throw new Error('Failed to create account. Please try again');
      }
    }

    // Create permanent user record in MongoDB
    let newUser;
    try {
      newUser = await User.create({
        uid: firebaseUser.uid,
        email: normalizedEmail,
        name: name,
        location: locationId || null,
        emailVerified: true,
        authMethod: 'email',
        isActive: true,
        isTemp: false
      });
      console.log(`Created MongoDB user record for ${normalizedEmail}`);
    } catch (mongoError) {
      console.error('MongoDB user creation error:', mongoError);
      
      // If MongoDB creation fails and we just created a Firebase user, try to clean up
      if (firebaseUserWasCreated) {
        try {
          await firebaseAdmin.auth().deleteUser(firebaseUser.uid);
          console.log(`Cleaned up Firebase user after MongoDB failure for ${normalizedEmail}`);
        } catch (cleanupError) {
          console.error('Failed to cleanup Firebase user:', cleanupError);
        }
      }
      
      if (mongoError.code === 11000) {
        // Duplicate key error - user already exists
        await User.deleteOne({ _id: tempUser._id }); // Clean up temp user
        res.status(400);
        throw new Error('Account already exists. Please sign in instead.');
      }
      
      res.status(500);
      throw new Error('Failed to create account. Please try again.');
    }

    // Delete temporary user record
    await User.deleteOne({ _id: tempUser._id });

    // Send welcome email (non-blocking)
    sendWelcomeEmail(newUser).catch(err => {
      console.error('Error sending welcome email:', err);
    });

    // Emit WebSocket event for admin notifications if socket is available
    if (req.app.get('io')) {
      req.app.get('io').emit('newUserSignup', {
        userId: newUser._id,
        name: newUser.name,
        email: newUser.email,
        timestamp: new Date()
      });
    }

    // Generate custom token for immediate sign-in
    const customToken = await firebaseAdmin.auth().createCustomToken(firebaseUser.uid);

    console.log(`User account created successfully for ${normalizedEmail}`);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        _id: newUser._id,
        uid: newUser.uid,
        email: newUser.email,
        name: newUser.name,
        location: newUser.location,
        role: newUser.role,
        emailVerified: true,
        authMethod: 'email'
      },
      customToken: customToken,
      isNewUser: true
    });
});
