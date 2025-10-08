import mongoose from 'mongoose';
import dotenv from 'dotenv';

import Order from './models/orderModel.js';
import Product from './models/productModel.js';

dotenv.config();

async function investigateOrders() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lapatisserie');
        console.log('✅ Connected to MongoDB');

        // Check all orders and their statuses
        const totalOrders = await Order.countDocuments();
        console.log(`📦 Total orders in database: ${totalOrders}`);

        if (totalOrders > 0) {
            // Get all unique order statuses
            const statuses = await Order.distinct('status');
            console.log('📊 Order statuses found:', statuses);

            // Count orders by status
            for (const status of statuses) {
                const count = await Order.countDocuments({ status });
                console.log(`  - ${status}: ${count} orders`);
            }

            // Get some sample orders with items
            console.log('\n📝 Sample orders with items:');
            const sampleOrders = await Order.find({})
                .populate('items.productId', 'name')
                .limit(3)
                .select('status items totalAmount createdAt');

            sampleOrders.forEach((order, index) => {
                console.log(`\nOrder ${index + 1}:`);
                console.log(`  Status: ${order.status}`);
                console.log(`  Items: ${order.items?.length || 0}`);
                console.log(`  Total: ₹${order.totalAmount}`);
                console.log(`  Created: ${order.createdAt}`);
                
                if (order.items && order.items.length > 0) {
                    order.items.forEach(item => {
                        console.log(`    - ${item.productId?.name || 'Unknown'}: qty ${item.quantity}`);
                    });
                }
            });

            // Try with ALL statuses to see what orders exist
            console.log('\n🔍 Checking orders with ANY status...');
            const allOrderCounts = await Order.aggregate([
                { $unwind: '$items' },
                { 
                    $lookup: { 
                        from: 'products', 
                        localField: 'items.productId', 
                        foreignField: '_id', 
                        as: 'product' 
                    }
                },
                { $unwind: '$product' },
                { 
                    $group: { 
                        _id: '$items.productId', 
                        productName: { $first: '$product.name' },
                        totalQuantity: { $sum: '$items.quantity' },
                        orderCount: { $sum: 1 },
                        statuses: { $addToSet: '$status' }
                    } 
                },
                { $sort: { totalQuantity: -1 } }
            ]);

            if (allOrderCounts.length > 0) {
                console.log('\n📈 Products ordered (any status):');
                allOrderCounts.forEach(item => {
                    console.log(`  - ${item.productName}: ${item.totalQuantity} total qty, ${item.orderCount} order items`);
                    console.log(`    Statuses: ${item.statuses.join(', ')}`);
                });
            } else {
                console.log('❌ No order items found at all');
            }
        }

        await mongoose.connection.close();

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

investigateOrders();