import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import models
import Order from '../models/orderModel.js';
import Hostel from '../models/hostelModel.js';
import DeliveryLocationMapping from '../models/deliveryLocationMappingModel.js';

const setupHostelMapping = async () => {
  try {
    console.log('🔧 Setting up proper Hostel-Delivery Location Mapping...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing mappings
    await DeliveryLocationMapping.deleteMany({});
    console.log('🗑️ Cleared existing mappings\n');

    // Get all hostels
    const hostels = await Hostel.find({});
    console.log(`📋 Found ${hostels.length} hostels:\n`);
    
    // Get unique delivery locations
    const deliveryLocations = await Order.distinct('deliveryLocation');
    console.log(`📦 Found ${deliveryLocations.length} unique delivery locations:\n`);
    
    deliveryLocations.forEach((location, index) => {
      console.log(`${index + 1}. "${location}"`);
    });

    console.log('\n🎯 Creating manual mappings based on analysis:\n');

    // Manual mapping based on common knowledge of Tirupur hostels
    const mappings = [
      {
        deliveryLocation: "Ganapathipalayam, Vat school, Tirupur - 641605",
        hostelName: "PSG", // PSG is typically in this area
        mappingType: 'manual'
      },
      {
        deliveryLocation: "avinashi, tirupur",
        hostelName: "kpr hostel", // KPR is typically in Avinashi area
        mappingType: 'manual'
      },
      {
        deliveryLocation: "avinashi, tirupur - 641605",
        hostelName: "kpr hostel", // Same as above
        mappingType: 'manual'
      }
    ];

    // Create mappings
    for (const mapping of mappings) {
      // Find the hostel
      const hostel = hostels.find(h => 
        h.name.toLowerCase() === mapping.hostelName.toLowerCase()
      );

      if (hostel) {
        const newMapping = new DeliveryLocationMapping({
          deliveryLocation: mapping.deliveryLocation,
          hostelId: hostel._id,
          hostelName: hostel.name,
          mappingType: mapping.mappingType,
          createdBy: 'setup_script'
        });

        await newMapping.save();
        console.log(`✅ Mapped: "${mapping.deliveryLocation}" → "${hostel.name}"`);
      } else {
        console.log(`❌ Hostel not found: "${mapping.hostelName}"`);
      }
    }

    console.log('\n🔍 Verifying mappings:');
    const allMappings = await DeliveryLocationMapping.find({}).populate('hostelId');
    
    allMappings.forEach((mapping, index) => {
      console.log(`${index + 1}. "${mapping.deliveryLocation}" → "${mapping.hostelName}"`);
    });

    console.log('\n✅ Hostel mapping setup completed!');
    
  } catch (error) {
    console.error('❌ Error setting up hostel mapping:', error);
  } finally {
    await mongoose.connection.close();
  }
};

setupHostelMapping();