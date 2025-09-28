import firebaseAdmin from '../config/firebase.js';
import User from '../models/userModel.js';
import asyncHandler from 'express-async-handler';

// Simple token verification cache with TTL
const tokenCache = new Map();
const TOKEN_CACHE_TTL = 15 * 60 * 1000; // 15 minutes in milliseconds

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
      
      // Check if token is in cache
      let decodedToken;
      const cacheKey = token;
      const cachedResult = tokenCache.get(cacheKey);
      
      if (cachedResult && cachedResult.expiresAt > Date.now()) {
        // Use cached token validation result
        decodedToken = cachedResult.decodedToken;
        // No need to log on every request when using cache
      } else {
        // Token not in cache or expired, verify with Firebase
        console.log('Attempting to verify token with length:', token.length);
        decodedToken = await firebaseAdmin.auth().verifyIdToken(token, false);
        
        // Cache the result with expiry
        tokenCache.set(cacheKey, {
          decodedToken,
          expiresAt: Date.now() + TOKEN_CACHE_TTL
        });
        
        console.log('Token verified successfully for uid:', decodedToken.uid);
      }
      
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

// Implement cache cleanup function to avoid memory leaks
function cleanupTokenCache() {
  const now = Date.now();
  let expiredCount = 0;
  
  for (const [key, value] of tokenCache.entries()) {
    if (value.expiresAt <= now) {
      tokenCache.delete(key);
      expiredCount++;
    }
  }
  
  if (expiredCount > 0) {
    console.log(`Token cache cleanup: removed ${expiredCount} expired tokens. Cache size: ${tokenCache.size}`);
  }
}

// Run cleanup every 30 minutes
setInterval(cleanupTokenCache, 30 * 60 * 1000);
