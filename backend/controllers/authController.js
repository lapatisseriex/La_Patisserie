import asyncHandler from 'express-async-handler';
import firebaseAdmin from '../config/firebase.js';
import User from '../models/userModel.js';

// Helper function to handle user conflicts
const resolveUserConflict = async (uid, phone_number, locationId) => {
  console.log(`Resolving user conflict for UID: ${uid}, Phone: ${phone_number}`);
  
  // First check if there's a user with this UID
  let user = await User.findOne({ uid });
  
  if (user) {
    // If phone number doesn't match, update it
    if (user.phone !== phone_number) {
      console.log(`Phone number mismatch: updating from ${user.phone} to ${phone_number}`);
      
      // Also check if there's another user with this phone number
      const existingPhoneUser = await User.findOne({ phone: phone_number });
      if (existingPhoneUser && existingPhoneUser._id.toString() !== user._id.toString()) {
        console.log(`Found another user with phone ${phone_number}, merging accounts`);
        
        // Merge the accounts - copy important data to keep
        if (existingPhoneUser.name && !user.name) user.name = existingPhoneUser.name;
        if (existingPhoneUser.email && !user.email) user.email = existingPhoneUser.email;
        if (existingPhoneUser.dob && !user.dob) user.dob = existingPhoneUser.dob;
        if (existingPhoneUser.gender && !user.gender) user.gender = existingPhoneUser.gender;
        if (existingPhoneUser.location && !user.location) user.location = existingPhoneUser.location;
        
        // Mark the duplicate account for cleanup
        await User.updateOne(
          { _id: existingPhoneUser._id },
          { $set: { isActive: false, notes: `Merged with user ${user._id} on ${new Date().toISOString()}` }}
        );
      }
      
      user.phone = phone_number;
      await user.save();
    }
    return user;
  }
  
  // Then check if there's a user with this phone number
  user = await User.findOne({ phone: phone_number, isActive: { $ne: false } });
  
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
  const { idToken, locationId, phone } = req.body;

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
    
    // Get phone number from token
    const { uid, phone_number } = decodedToken;
    
    // Use provided phone number as fallback if token doesn't have it (rare Firebase issue)
    const userPhoneNumber = phone_number || phone;
    
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

    if (!userPhoneNumber) {
      console.error('No phone number available from token or request');
      res.status(400);
      throw new Error('Phone number is required for authentication');
    }
    
    // First check for potential user conflicts and resolve them
    let user = await resolveUserConflict(uid, userPhoneNumber, locationId);
    let isNewUser = false;

    // If no user found, create a new one
    if (!user) {
      console.log(`No existing user found for ${userPhoneNumber}, creating new user`);
      isNewUser = true;
      
      // Determine role based on phone number
      let role = 'user';
      if (userPhoneNumber === '+919500643892') {
        role = 'admin';
      }
      
      try {
        // Create user with location if provided
        user = await User.create({
          uid,
          phone: userPhoneNumber,
          role,
          location: locationId || null,
          lastLogin: new Date(),
          lastActive: new Date(),
          isActive: true
        });
        
        console.log(`New user created: ${user._id} (${userPhoneNumber})`);
      } catch (err) {
        // If there's a duplicate key error, it means we have a race condition
        // Try to resolve the conflict again
        if (err.code === 11000) {
          console.log('Duplicate key error during creation, attempting to resolve conflict again:', err.keyPattern);
          user = await resolveUserConflict(uid, userPhoneNumber, locationId);
          
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
      user = await User.findOne({ uid }).populate('location').populate('hostel');
    } else {
      // User already exists, update user data
      // Update lastLogin and ensure the user is active
      await User.updateOne(
        { _id: user._id },
        { 
          $set: { 
            lastLogin: new Date(), 
            lastActive: new Date(),
            isActive: true 
          },
          ...(locationId ? { location: locationId } : {})
        }
      );











































































































































































































































































































































































































































      
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
      
      // If phone number from token doesn't match stored phone, update it
      if (userPhoneNumber && user.phone !== userPhoneNumber) {
        console.log(`Updating phone number from ${user.phone} to ${userPhoneNumber}`);
        updateData.phone = userPhoneNumber;
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

    res.status(200).json({
      success: true,
      isNewUser: isNewUser || isProfileIncomplete, // Mark as new user if profile is incomplete
      user: {
        uid: user.uid,
        phone: user.phone,
        name: user.name,
        role: user.role,
        dob: formattedDob, // Use formatted date
        gender: user.gender || '',
        location: user.location || null,
        hostel: user.hostel || null,
        profilePhoto: user.profilePhoto || { url: '', public_id: '' }, // Include profile photo
        isProfileIncomplete // Add flag for profile completion status
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
