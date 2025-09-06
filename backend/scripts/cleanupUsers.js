// cleanupUsers.js
// A script to clean up duplicate users in the database

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/userModel.js';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

const cleanupUsers = async () => {
  try {
    // Find duplicate phone numbers
    console.log('Looking for duplicate phone numbers...');
    
    // Aggregate to find duplicates
    const duplicates = await User.aggregate([
      { $group: { 
        _id: { phone: "$phone" }, 
        count: { $sum: 1 },
        ids: { $push: "$_id" }
      }},
      { $match: { count: { $gt: 1 } } }
    ]);
    
    console.log(`Found ${duplicates.length} duplicate phone numbers`);
    
    // Process each duplicate
    for (const dup of duplicates) {
      console.log(`Processing duplicates for phone: ${dup._id.phone}`);
      
      // Get all users with this phone number, sorted by creation date (keep the oldest)
      const users = await User.find({ phone: dup._id.phone }).sort({ createdAt: 1 });
      
      // Keep the first one, delete the rest
      console.log(`Found ${users.length} users with phone ${dup._id.phone}`);
      console.log(`Keeping user ${users[0]._id} (created at ${users[0].createdAt})`);
      
      for (let i = 1; i < users.length; i++) {
        console.log(`Deleting user ${users[i]._id} (created at ${users[i].createdAt})`);
        await User.findByIdAndDelete(users[i]._id);
      }
    }
    
    console.log('Cleanup complete!');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    // Disconnect from MongoDB
    mongoose.disconnect();
  }
};

cleanupUsers();
