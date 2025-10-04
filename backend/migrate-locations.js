import mongoose from 'mongoose';
import Location from './models/locationModel.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for migration');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

async function migrateLocations() {
  try {
    await connectDB();
    console.log('Starting location migration...');
    
    // Find all locations that don't have deliveryCharge field
    const locationsToUpdate = await Location.find({
      deliveryCharge: { $exists: false }
    });
    
    console.log(`Found ${locationsToUpdate.length} locations to update`);
    
    // Update each location with default delivery charge
    for (const location of locationsToUpdate) {
      await Location.findByIdAndUpdate(location._id, {
        deliveryCharge: 49 // Default delivery charge
      });
      console.log(`Updated location: ${location.area}, ${location.city} with delivery charge ₹49`);
    }
    
    // Also update any existing locations that have null or undefined deliveryCharge
    const nullChargeLocations = await Location.find({
      $or: [
        { deliveryCharge: null },
        { deliveryCharge: undefined }
      ]
    });
    
    for (const location of nullChargeLocations) {
      await Location.findByIdAndUpdate(location._id, {
        deliveryCharge: 49
      });
      console.log(`Updated null charge location: ${location.area}, ${location.city}`);
    }
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateLocations();