// Migration script to update user model from phone-based to email-based authentication
// Run this once when deploying the new authentication system

import mongoose from 'mongoose';
import User from '../models/userModel.js';
import dotenv from 'dotenv';

dotenv.config();

const migrateUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find users that have phone but no email
    const usersToUpdate = await User.find({
      phone: { $exists: true },
      email: { $exists: false }
    });

    console.log(`Found ${usersToUpdate.length} users to migrate`);

    for (const user of usersToUpdate) {
      // For existing users without email, you'll need to decide how to handle them
      // Option 1: Set a placeholder email and mark it as unverified
      // Option 2: Delete users without email
      // Option 3: Keep them but make them go through new signup process

      // Option 1: Set placeholder email
      const placeholderEmail = `user_${user._id}@placeholder.lapatisserie.com`;
      
      await User.updateOne(
        { _id: user._id },
        { 
          $set: { 
            email: placeholderEmail,
            emailVerified: false,
            // Remove phone field if you want to completely eliminate it
            // $unset: { phone: 1 }
          }
        }
      );

      console.log(`Updated user ${user._id}: ${user.phone} -> ${placeholderEmail}`);
    }

    // Update indexes
    try {
      // Drop the old phone index if it exists
      await User.collection.dropIndex('phone_1');
      console.log('Dropped phone index');
    } catch (error) {
      console.log('Phone index may not exist:', error.message);
    }

    // Ensure email index exists
    await User.collection.createIndex({ email: 1 }, { unique: true });
    console.log('Created email index');

    console.log('Migration completed successfully');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateUsers();
}

export default migrateUsers;