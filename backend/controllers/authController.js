import asyncHandler from 'express-async-handler';
import firebaseAdmin from '../config/firebase.js';
import User from '../models/userModel.js';

// Helper function to handle user conflicts
const resolveUserConflict = async (uid, phone_number, locationId) => {
  // First check if there's a user with this UID
  let user = await User.findOne({ uid });
  
  if (user) {
    // If phone number doesn't match, update it
    if (user.phone !== phone_number) {
      console.log(`Phone number mismatch: updating from ${user.phone} to ${phone_number}`);
      user.phone = phone_number;
      await user.save();
    }
    return user;
  }
  
  // Then check if there's a user with this phone number
  user = await User.findOne({ phone: phone_number });
  
  if (user) {
    // If UID doesn't match, update it
    if (user.uid !== uid) {
      console.log(`UID mismatch: updating from ${user.uid} to ${uid}`);
      user.uid = uid;
      await user.save();
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
  const { idToken, locationId } = req.body;

  if (!idToken) {
    res.status(400);
    throw new Error('No ID token provided');
  }

  try {
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
      
    const { uid, phone_number } = decodedToken;

    // First check for potential user conflicts and resolve them
    let user = await resolveUserConflict(uid, phone_number, locationId);
    let isNewUser = false;

    // If no user found, create a new one
    if (!user) {
      console.log(`No existing user found for ${phone_number}, creating new user`);
      isNewUser = true;
      
      // Determine role based on phone number
      let role = 'user';
      if (phone_number === '+919500643892') {
        role = 'admin';
      }
      
      try {
        // Create user with location if provided
        user = await User.create({
          uid,
          phone: phone_number,
          role,
          location: locationId || null
        });
      } catch (err) {
        // If there's a duplicate key error, it means we have a race condition
        // Try to resolve the conflict again
        if (err.code === 11000) {
          console.log('Duplicate key error during creation, attempting to resolve conflict again:', err.keyPattern);
          user = await resolveUserConflict(uid, phone_number, locationId);
          
          if (!user) {
            throw new Error('Failed to resolve user conflict after multiple attempts');
          }
          
          isNewUser = false;
        } else {
          // If it's another error, throw it
          throw err;
        }
      }
      
      // Populate the newly created user
      user = await User.findOne({ uid }).populate('location');
    } else {
      // User already exists, update user data if needed+











































































































































































































































































































































































































































      
      let needsSave = false;
      
      // Update location if provided and user doesn't have one
      if (locationId && !user.location) {
        user.location = locationId;
        needsSave = true;
      }
      
      // Update last login time
      user.lastLogin = new Date();
      needsSave = true;
      
      // Save changes if needed
      if (needsSave) {
        await user.save();
      }
      
      // Make sure location is populated
      if (!user.populated('location')) {
        user = await User.findOne({ uid }).populate('location');
      }
    }

    // Check if profile is incomplete (no name or dob)
    const isProfileIncomplete = !user.name || !user.dob;
    
    // Format the date of birth for the response
    const formattedDob = user.dob ? user.dob.toISOString().split('T')[0] : null;

    res.status(200).json({
      success: true,
      isNewUser: isNewUser || isProfileIncomplete, // Mark as new user if profile is incomplete
      user: {
        uid: user.uid,
        phone: user.phone,
        name: user.name,
        role: user.role,
        dob: formattedDob, // Use formatted date
        location: user.location || null,
        isProfileIncomplete // Add flag for profile completion status
      }
    });
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401);
    throw new Error('Invalid token');
  }
});
