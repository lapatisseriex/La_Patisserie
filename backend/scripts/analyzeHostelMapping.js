import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import models
import Order from '../models/orderModel.js';
import Hostel from '../models/hostelModel.js';

const analyzeHostelMapping = async () => {
  try {
    console.log('🔍 Analyzing Hostel and Delivery Location Mapping...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all hostels
    const hostels = await Hostel.find({});
    console.log(`📋 Found ${hostels.length} hostels in database:`);
    hostels.forEach((hostel, index) => {
      console.log(`${index + 1}. Name: "${hostel.name}" | Address: "${hostel.address}"`);
    });
    console.log('');

    // Get unique delivery locations from orders
    const deliveryLocations = await Order.distinct('deliveryLocation');
    console.log(`📦 Found ${deliveryLocations.length} unique delivery locations in orders:`);
    deliveryLocations.forEach((location, index) => {
      console.log(`${index + 1}. "${location}"`);
    });
    console.log('');

    // Try to match delivery locations with hostels
    console.log('🔗 Attempting to match delivery locations with hostels:');
    const mappings = [];
    
    deliveryLocations.forEach(deliveryLocation => {
      // Try exact match with name
      let matchedHostel = hostels.find(h => h.name.toLowerCase() === deliveryLocation.toLowerCase());
      if (matchedHostel) {
        mappings.push({
          deliveryLocation,
          hostelName: matchedHostel.name,
          matchType: 'exact_name'
        });
        return;
      }

      // Try exact match with address
      matchedHostel = hostels.find(h => h.address.toLowerCase() === deliveryLocation.toLowerCase());
      if (matchedHostel) {
        mappings.push({
          deliveryLocation,
          hostelName: matchedHostel.name,
          matchType: 'exact_address'
        });
        return;
      }

      // Try partial match - hostel name contained in delivery location
      matchedHostel = hostels.find(h => 
        deliveryLocation.toLowerCase().includes(h.name.toLowerCase())
      );
      if (matchedHostel) {
        mappings.push({
          deliveryLocation,
          hostelName: matchedHostel.name,
          matchType: 'partial_name_in_delivery'
        });
        return;
      }

      // Try partial match - hostel address contained in delivery location
      matchedHostel = hostels.find(h => 
        deliveryLocation.toLowerCase().includes(h.address.toLowerCase())
      );
      if (matchedHostel) {
        mappings.push({
          deliveryLocation,
          hostelName: matchedHostel.name,
          matchType: 'partial_address_in_delivery'
        });
        return;
      }

      // Try reverse partial match - delivery location contained in hostel name
      matchedHostel = hostels.find(h => 
        h.name.toLowerCase().includes(deliveryLocation.toLowerCase())
      );
      if (matchedHostel) {
        mappings.push({
          deliveryLocation,
          hostelName: matchedHostel.name,
          matchType: 'partial_delivery_in_name'
        });
        return;
      }

      // Try reverse partial match - delivery location contained in hostel address
      matchedHostel = hostels.find(h => 
        h.address.toLowerCase().includes(deliveryLocation.toLowerCase())
      );
      if (matchedHostel) {
        mappings.push({
          deliveryLocation,
          hostelName: matchedHostel.name,
          matchType: 'partial_delivery_in_address'
        });
        return;
      }

      // No match found
      mappings.push({
        deliveryLocation,
        hostelName: null,
        matchType: 'no_match'
      });
    });

    // Display mappings
    console.log('\n📊 Mapping Results:');
    mappings.forEach((mapping, index) => {
      if (mapping.hostelName) {
        console.log(`✅ ${index + 1}. "${mapping.deliveryLocation}" → "${mapping.hostelName}" (${mapping.matchType})`);
      } else {
        console.log(`❌ ${index + 1}. "${mapping.deliveryLocation}" → NO MATCH FOUND`);
      }
    });

    // Statistics
    const matchedCount = mappings.filter(m => m.hostelName !== null).length;
    const unmatchedCount = mappings.filter(m => m.hostelName === null).length;
    
    console.log('\n📈 Statistics:');
    console.log(`✅ Matched: ${matchedCount}/${mappings.length} (${Math.round(matchedCount/mappings.length*100)}%)`);
    console.log(`❌ Unmatched: ${unmatchedCount}/${mappings.length} (${Math.round(unmatchedCount/mappings.length*100)}%)`);

    // Show unmatched delivery locations
    const unmatched = mappings.filter(m => m.hostelName === null);
    if (unmatched.length > 0) {
      console.log('\n🚨 Unmatched Delivery Locations (need manual mapping):');
      unmatched.forEach((item, index) => {
        console.log(`${index + 1}. "${item.deliveryLocation}"`);
      });
    }

    // Suggest creating a mapping table
    console.log('\n💡 Suggested Solution:');
    console.log('Create a delivery_location_mapping table with:');
    console.log('- delivery_location (from orders)');
    console.log('- hostel_id (reference to hostels table)');
    console.log('- created_at, updated_at');
    
    console.log('\n✅ Analysis completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

analyzeHostelMapping();