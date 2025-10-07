import asyncHandler from 'express-async-handler';
import firebaseAdmin from '../config/firebase.js';
import User from '../models/userModel.js';

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
    
    // Get email and other info from token
    const { uid, email, name, picture } = decodedToken;
    
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
          isActive: true
        });
        
        console.log(`New user created successfully: ${user._id} (${email})`);
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

    res.status(200).json({
      success: true,
      isNewUser: isNewUser || isProfileIncomplete, // Mark as new user if profile is incomplete
      user: {
        uid: user.uid,
        email: user.email,
        name: user.name,
        role: user.role,
        dob: formattedDob, // Use formatted date
        gender: user.gender || '',
        location: user.location || null,
        hostel: user.hostel || null,
        profilePhoto: user.profilePhoto || { url: '', public_id: '' }, // Include profile photo
        emailVerified: user.emailVerified || false,
        emailVerifiedAt: user.emailVerifiedAt || null,
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
