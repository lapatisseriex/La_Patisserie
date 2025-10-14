import Order from '../models/orderModel.js';
import Hostel from '../models/hostelModel.js';
import DeliveryLocationMapping from '../models/deliveryLocationMappingModel.js';

/**
 * Utility function to migrate existing orders by populating hostelId based on hostelName
 * This should be run once after the hostelId field is added to the order model
 */
export const migrateOrderHostelIds = async () => {
  try {
    console.log('Starting migration of order hostel IDs...');
    
    // Find all orders that don't have hostelId but have hostelName
    const ordersToMigrate = await Order.find({
      hostelId: null,
      hostelName: { $exists: true, $ne: null, $ne: '' }
    });

    console.log(`Found ${ordersToMigrate.length} orders to migrate`);

    let migratedCount = 0;
    let notFoundCount = 0;

    for (const order of ordersToMigrate) {
      try {
        let hostelId = null;
        
        // First try to find hostel by exact name match
        const hostel = await Hostel.findOne({ 
          name: { $regex: new RegExp(`^${order.hostelName.trim()}$`, 'i') },
          isActive: true 
        });
        
        if (hostel) {
          hostelId = hostel._id;
          console.log(`Found hostel by name: ${hostel.name} for order ${order.orderNumber}`);
        } else {
          // Try to find using delivery location mapping
          const mapping = await DeliveryLocationMapping.findOne({
            $or: [
              { hostelName: { $regex: new RegExp(`^${order.hostelName.trim()}$`, 'i') } },
              { deliveryLocation: { $regex: new RegExp(`^${order.deliveryLocation?.trim() || ''}$`, 'i') } }
            ],
            isActive: true
          });
          
          if (mapping && mapping.hostelId) {
            hostelId = mapping.hostelId;
            console.log(`Found hostel through mapping: ${mapping.hostelName} for order ${order.orderNumber}`);
          }
        }

        if (hostelId) {
          // Update the order with the found hostelId
          await Order.updateOne(
            { _id: order._id },
            { $set: { hostelId: hostelId } }
          );
          migratedCount++;
        } else {
          console.log(`No hostel found for order ${order.orderNumber} with hostelName: "${order.hostelName}"`);
          notFoundCount++;
        }
      } catch (error) {
        console.error(`Error migrating order ${order.orderNumber}:`, error.message);
      }
    }

    console.log(`Migration completed: ${migratedCount} orders migrated, ${notFoundCount} hostels not found`);
    return { migratedCount, notFoundCount, total: ordersToMigrate.length };
    
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
};