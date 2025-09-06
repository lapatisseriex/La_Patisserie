// userRecovery.js
// A script to recover a user account that exists in MongoDB but needs a new UID

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/userModel.js';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

const recoverUserByPhone = async (phoneNumber, newUid = null) => {
  try {
    // Find user by phone number
    const user = await User.findOne({ phone: phoneNumber });
    
    if (!user) {
      console.log(`No user found with phone number: ${phoneNumber}`);
      return;
    }
    
    console.log('Found user:', {
      _id: user._id,
      uid: user.uid,
      phone: user.phone,
      name: user.name,
      createdAt: user.createdAt
    });
    
    if (newUid) {
      console.log(`Updating UID from ${user.uid} to ${newUid}`);
      user.uid = newUid;
      await user.save();
      console.log('UID updated successfully');
    } else if (process.argv[3] === 'delete') {
      console.log(`Deleting user with phone number: ${phoneNumber}`);
      await User.deleteOne({ phone: phoneNumber });
      console.log('User deleted successfully');
    }
  } catch (error) {
    console.error('Error during user recovery:', error);
  } finally {
    // Disconnect from MongoDB
    mongoose.disconnect();
  }
};

// Get phone number from command line argument
const phoneNumber = process.argv[2];
const newUid = process.argv[3] !== 'delete' ? process.argv[3] : null;

if (!phoneNumber) {
  console.log('Please provide a phone number as an argument');
  console.log('Usage: node userRecovery.js +919361620860 [newUid|delete]');
  mongoose.disconnect();
} else {
  recoverUserByPhone(phoneNumber, newUid);
}
