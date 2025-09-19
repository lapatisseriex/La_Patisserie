// activateInactiveUsers.js
// A script to set all inactive users to active

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/userModel.js';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

const activateInactiveUsers = async () => {
  try {
    // Find all inactive users
    const inactiveUsers = await User.find({ isActive: false });
    
    console.log(`Found ${inactiveUsers.length} inactive users`);
    
    if (inactiveUsers.length === 0) {
      console.log('No inactive users found. All users are already active.');
      return;
    }
    
    // Update all inactive users to active
    const result = await User.updateMany(
      { isActive: false },
      { 
        $set: { 
          isActive: true,
          lastLogin: new Date(),
          lastActive: new Date()
        }
      }
    );
    
    console.log(`Successfully activated ${result.modifiedCount} users`);
    
    // Show phone numbers of the reactivated users for reference
    if (inactiveUsers.length > 0) {
      console.log('Phone numbers of reactivated users:');
      inactiveUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.phone} (User ID: ${user._id}, Firebase UID: ${user.uid})`);
      });
    }
  } catch (error) {
    console.error('Error during user activation:', error);
  } finally {
    // Disconnect from MongoDB
    mongoose.disconnect();
  }
};

activateInactiveUsers();