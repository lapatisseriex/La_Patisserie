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
      let user = await User.findOne({ uid: decodedToken.uid });
      
      if (!user) {
        console.log(`User not found in database for uid: ${decodedToken.uid}, attempting to create...`);
        
        // Try to create user from Firebase token
        try {
          // Determine role based on email
          const role = decodedToken.email === 'admin@lapatisserie.com' ? 'admin' : 'user';
          
          const userData = {
            uid: decodedToken.uid,
            name: decodedToken.name || null,
            profilePhoto: decodedToken.picture ? { url: decodedToken.picture, public_id: '' } : { url: '', public_id: '' },
            role,
            lastLogin: new Date(),
            lastActive: new Date(),
            isActive: true,
            // Add default values for other required fields
            dob: null,
            anniversary: null,
            gender: null,
            city: null,
            pincode: null,
            country: 'India',
            location: null,
            hostel: null
          };
          
          // Add email if available (not available for phone-only authentication)
          if (decodedToken.email) {
            userData.email = decodedToken.email;
            userData.emailVerified = decodedToken.email_verified || false;
          }
          
          // Add phone if available (for phone authentication)
          if (decodedToken.phone_number) {
            userData.phone = decodedToken.phone_number;
            userData.phoneVerified = true;
            userData.phoneVerifiedAt = new Date();
          } else {
            userData.phoneVerified = false;
          }
          
          user = await User.create(userData);
          console.log(`User created successfully in auth middleware: ${user._id} (${decodedToken.uid}) - Role: ${role}`);
        } catch (createError) {
          console.error('Failed to create user in auth middleware:', createError);
          
          // If creation fails due to duplicate, try to find user again
          if (createError.code === 11000) {
            user = await User.findOne({ 
              $or: [
                { uid: decodedToken.uid },
                { email: decodedToken.email }
              ]
            });
            
            if (user) {
              // Update UID if email matches but UID is different
              if (user.uid !== decodedToken.uid) {
                user.uid = decodedToken.uid;
                await user.save();
              }
            }
          }
          
          if (!user) {
            res.status(404);
            throw new Error('User not found and could not be created');
          }
        }
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
      
      // Clear token cache on error
      tokenCache.delete(token);
      
      // Provide more specific error messages based on Firebase error codes
      if (error.code === 'auth/id-token-expired') {
        res.status(401).json({ 
          error: 'Session expired. Please login again.',
          code: 'TOKEN_EXPIRED'
        });
        return;
      } else if (error.code === 'auth/id-token-revoked') {
        res.status(401).json({ 
          error: 'Session was revoked. Please login again.',
          code: 'TOKEN_REVOKED'
        });
        return;
      } else if (error.code === 'auth/argument-error' || error.message.includes('kid')) {
        res.status(401).json({ 
          error: 'Invalid token format. Please login again.',
          code: 'TOKEN_INVALID'
        });
        return;
      } else if (error.message.includes('User not found')) {
        res.status(401).json({ 
          error: 'User account not found. Please register first.',
          code: 'USER_NOT_FOUND'
        });
        return;
      } else {
        res.status(401).json({ 
          error: 'Authentication failed',
          code: 'AUTH_FAILED'
        });
        return;
      }
    }
  } else {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// Optional authentication middleware - sets req.user if token is valid, but doesn't block if no token
export const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      console.log(`🛂 [optionalAuth] Path: ${req.method} ${req.originalUrl}`);
      // Extract token from header
      token = req.headers.authorization.split(' ')[1];
      console.log(`🔐 [optionalAuth] Auth header present: Yes | Token length: ${token?.length || 0}`);
      
      if (!token || token === 'null' || token === 'undefined') {
        // Invalid token format, continue without authentication
        console.warn('⚠️ [optionalAuth] Invalid token string (null/undefined) — proceeding unauthenticated');
        return next();
      }
      
      // Check if token is in cache
      let decodedToken;
      const cacheKey = token;
      const cachedResult = tokenCache.get(cacheKey);
      
      if (cachedResult && cachedResult.expiresAt > Date.now()) {
        // Use cached token validation result
        decodedToken = cachedResult.decodedToken;
        console.log(`✅ [optionalAuth] Token cache HIT for uid: ${decodedToken?.uid}`);
      } else {
        // Token not in cache or expired, verify with Firebase
        console.log('🧪 [optionalAuth] Verifying token with Firebase...');
        decodedToken = await firebaseAdmin.auth().verifyIdToken(token, false);
        
        // Cache the result with expiry
        tokenCache.set(cacheKey, {
          decodedToken,
          expiresAt: Date.now() + TOKEN_CACHE_TTL
        });
        console.log(`✅ [optionalAuth] Token verified. uid: ${decodedToken?.uid}`);
      }
      
      // Find user in database
      let user = await User.findOne({ uid: decodedToken.uid });
      
      if (user) {
        // Update last active timestamp (without awaiting to not block request)
        User.updateOne(
          { _id: user._id },
          { $set: { lastActive: new Date() } }
        ).catch(err => console.error('Error updating lastActive timestamp:', err));
        
        // Attach user to request
        req.user = user;
        console.log(`👤 [optionalAuth] Attached user: ${user?.name || 'N/A'} (${user?.uid}) | role: ${user?.role}`);
      }
      
      next();
    } catch (error) {
      // Token verification failed, but continue without authentication
      console.warn(`❌ [optionalAuth] Token verification failed: ${error?.message}`);
      // Clear token cache on error
      if (token) {
        tokenCache.delete(token);
      }
      console.log('➡️ [optionalAuth] Proceeding without user context');
      next();
    }
  } else {
    console.log(`🛂 [optionalAuth] Path: ${req.method} ${req.originalUrl} | Auth header present: No`);
    // No token provided, continue without authentication
    next();
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
