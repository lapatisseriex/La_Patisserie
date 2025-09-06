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

      // Verify token with Firebase Admin SDK
      const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
      
      // Find user in database
      const user = await User.findOne({ uid: decodedToken.uid });
      
      if (!user) {
        res.status(404);
        throw new Error('User not found');
      }
      
      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      console.error('Token verification failed:', error);
      res.status(401);
      throw new Error('Not authorized, invalid token');
    }
  }

  if (!token) {
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
