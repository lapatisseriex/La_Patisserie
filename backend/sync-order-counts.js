import mongoose from 'mongoose';
import dotenv from 'dotenv';

import Product from './models/productModel.js';
import Order from './models/orderModel.js';

dotenv.config();

async function updateOrderCountsFromExistingOrders() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lapatisserie');
        console.log('✅ Connected to MongoDB');

        // Get actual order counts from existing orders
        console.log('📊 Calculating order counts from existing orders...');
        
        const orderCounts = await Order.aggregate([
            { 
                $match: { 
                    orderStatus: { $in: ['confirmed', 'ready', 'delivered', 'placed'] } 
                } 
            },
            { $unwind: '$cartItems' },
            { 
                $group: { 
                    _id: '$cartItems.productId', 
                    totalQuantity: { $sum: '$cartItems.quantity' },
                    orderCount: { $sum: 1 }
                } 
            }
        ]);

        console.log(`📈 Found order data for ${orderCounts.length} products`);

        // Reset all products to 0 first
        await Product.updateMany({}, { 
            $set: { 
                totalOrderCount: 0,
                lastOrderCountUpdate: new Date()
            }
        });
        console.log('🔄 Reset all product order counts to 0');

        // Update products with actual order counts
        let bestSellersFound = 0;
        for (const orderCount of orderCounts) {
            const product = await Product.findByIdAndUpdate(
                orderCount._id,
                { 
                    $set: { 
                        totalOrderCount: orderCount.totalQuantity, // Use total quantity ordered
                        lastOrderCountUpdate: new Date()
                    }
                },
                { new: true }
            ).select('name totalOrderCount');
            
            if (product) {
                console.log(`  ✅ ${product.name}: ${orderCount.totalQuantity} total orders (${orderCount.orderCount} order items)`);
                
                if (product.totalOrderCount >= 4) {
                    bestSellersFound++;
                    console.log(`    🏆 BEST SELLER! (${product.totalOrderCount} >= 4 orders)`);
                }
            }
        }

        // Final summary
        console.log('\n📊 Final Results:');
        console.log(`🏆 Best sellers found: ${bestSellersFound} products`);
        
        // Test the API to verify
        console.log('\n🧪 Testing Best Sellers API...');
        const bestSellers = await Product.find({ totalOrderCount: { $gte: 4 } })
            .select('name totalOrderCount')
            .sort({ totalOrderCount: -1 });
        
        if (bestSellers.length > 0) {
            console.log('✅ Best sellers that will show on homepage:');
            bestSellers.forEach(product => {
                console.log(`  - ${product.name}: ${product.totalOrderCount} orders`);
            });
        } else {
            console.log('❌ No products qualify as best sellers (need 4+ orders)');
        }

        await mongoose.connection.close();
        console.log('\n✅ Update complete! Refresh your website to see the Best Sellers section.');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Run the script
updateOrderCountsFromExistingOrders();