import Order from '../models/orderModel.js';
import Hostel from '../models/hostelModel.js';
import DeliveryLocationMapping from '../models/deliveryLocationMappingModel.js';

// Migration script to populate hostelId for existing orders
export const migrateExistingOrdersHostelData = async () => {
  try {
    console.log('Starting migration of existing orders hostel data...');
    
    // Find all orders that have hostelName but no hostelId
    const ordersToMigrate = await Order.find({
      $and: [
        { hostelName: { $exists: true, $ne: null, $ne: '' } },
        { $or: [{ hostelId: { $exists: false } }, { hostelId: null }] }
      ]
    });

    console.log(`Found ${ordersToMigrate.length} orders to migrate`);
    
    let migratedCount = 0;
    let notFoundCount = 0;
    
    for (const order of ordersToMigrate) {
      try {
        // Try to find hostel by exact name match
        let hostel = await Hostel.findOne({ 
          name: { $regex: new RegExp(`^${order.hostelName.trim()}$`, 'i') },
          isActive: true 
        });
        
        if (!hostel) {
          // Try to find using delivery location mapping
          const mapping = await DeliveryLocationMapping.findOne({
            $or: [
              { hostelName: { $regex: new RegExp(`^${order.hostelName.trim()}$`, 'i') } },
              { deliveryLocation: { $regex: new RegExp(`^${order.deliveryLocation.trim()}$`, 'i') } }
            ],
            isActive: true
          });
          
          if (mapping && mapping.hostelId) {
            hostel = await Hostel.findById(mapping.hostelId);
          }
        }
        
        if (hostel) {
          await Order.updateOne(
            { _id: order._id },
            { $set: { hostelId: hostel._id } }
          );
          migratedCount++;
          console.log(`✅ Migrated order ${order.orderNumber}: ${order.hostelName} -> ${hostel._id}`);
        } else {
          notFoundCount++;
          console.log(`❌ Could not find hostel for order ${order.orderNumber}: ${order.hostelName}`);
        }
      } catch (error) {
        console.error(`Error migrating order ${order.orderNumber}:`, error.message);
      }
    }
    
    console.log(`Migration completed: ${migratedCount} orders migrated, ${notFoundCount} not found`);
    return { migratedCount, notFoundCount, totalFound: ordersToMigrate.length };
    
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
};

// Function to check orders without hostel data
export const analyzeOrdersHostelData = async () => {
  try {
    const totalOrders = await Order.countDocuments();
    const ordersWithHostelName = await Order.countDocuments({
      hostelName: { $exists: true, $ne: null, $ne: '' }
    });
    const ordersWithHostelId = await Order.countDocuments({
      hostelId: { $exists: true, $ne: null }
    });
    const ordersWithBoth = await Order.countDocuments({
      $and: [
        { hostelName: { $exists: true, $ne: null, $ne: '' } },
        { hostelId: { $exists: true, $ne: null } }
      ]
    });
    
    console.log('Orders Hostel Data Analysis:');
    console.log(`Total Orders: ${totalOrders}`);
    console.log(`Orders with hostelName: ${ordersWithHostelName}`);
    console.log(`Orders with hostelId: ${ordersWithHostelId}`);
    console.log(`Orders with both: ${ordersWithBoth}`);
    
    return {
      totalOrders,
      ordersWithHostelName,
      ordersWithHostelId,
      ordersWithBoth
    };
  } catch (error) {
    console.error('Error analyzing orders:', error);
    throw error;
  }
};