import firebaseAdmin from '../config/firebase.js';
import User from '../models/userModel.js';
import asyncHandler from 'express-async-handler';

// Authentication middleware - verifies Firebase token
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract token from header
      token = req.headers.authorization.split(' ')[1];
      
      if (!token || token === 'null' || token === 'undefined') {
        console.log('Invalid token format received');
        res.status(401);
        throw new Error('Invalid token format');
      }

      console.log('Attempting to verify token with length:', token.length);
      
      // Verify token with Firebase Admin SDK
      // Set checkRevoked to false initially to avoid extra verification calls
      const decodedToken = await firebaseAdmin.auth().verifyIdToken(token, false);
      
      console.log('Token verified successfully for uid:', decodedToken.uid);
      
      // Find user in database
      const user = await User.findOne({ uid: decodedToken.uid });
      
      if (!user) {
        console.log(`User not found in database for uid: ${decodedToken.uid}`);
        res.status(404);
        throw new Error('User not found');
      }
      
      // Check if user is active - if not, reactivate instead of blocking
      if (!user.isActive) {
        console.log(`Found inactive user, reactivating: ${user._id} (${user.uid})`);
        // Reactivate user and update timestamps
        await User.updateOne(
          { _id: user._id },
          { $set: { isActive: true, lastLogin: new Date(), lastActive: new Date() } }
        );
        // Update the user object for this request
        user.isActive = true;
      }
      
      // Update last active timestamp (without awaiting to not block request)
      User.updateOne(
        { _id: user._id },
        { $set: { lastActive: new Date() } }
      ).catch(err => console.error('Error updating lastActive timestamp:', err));
      
      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      console.error('Token verification failed:', error.message);
      console.error('Error code:', error.code);
      console.error('Full error:', error);
      
      // Provide more specific error messages based on Firebase error codes
      if (error.code === 'auth/id-token-expired') {
        res.status(401);
        throw new Error('Session expired. Please login again.');
      } else if (error.code === 'auth/id-token-revoked') {
        res.status(401);
        throw new Error('Session was revoked. Please login again.');
      } else if (error.code === 'auth/argument-error' || error.message.includes('kid')) {
        res.status(401);
        throw new Error('Invalid token format. Please login again.');
      } else {
        res.status(401);
        throw new Error('Authentication failed');
      }
    }
  } else {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// Admin middleware - ensures user is an admin
export const admin = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as admin');
  }
});
