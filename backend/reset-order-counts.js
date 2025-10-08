import mongoose from 'mongoose';
import dotenv from 'dotenv';

import Product from './models/productModel.js';
import Order from './models/orderModel.js';

dotenv.config();

async function resetOrderCounts() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lapatisserie');
        console.log('✅ Connected to MongoDB');

        // Get all products
        const allProducts = await Product.find({}).select('_id name totalOrderCount');
        console.log(`📊 Found ${allProducts.length} products`);

        // Check total orders in database
        const totalOrders = await Order.countDocuments();
        console.log(`📦 Total orders in database: ${totalOrders}`);

        if (totalOrders === 0) {
            // No orders exist, reset all product counts to 0
            console.log('\n🔄 No orders found. Resetting all product order counts to 0...');
            
            const resetResult = await Product.updateMany(
                {},
                { 
                    $set: { 
                        totalOrderCount: 0,
                        lastOrderCountUpdate: new Date()
                    }
                }
            );

            console.log(`✅ Reset order counts for ${resetResult.modifiedCount} products`);
            
            // Verify the reset
            const productsWithOrders = await Product.find({ totalOrderCount: { $gt: 0 } });
            console.log(`🔍 Products still showing order counts: ${productsWithOrders.length}`);
            
            if (productsWithOrders.length === 0) {
                console.log('🎉 All product order counts successfully reset to 0!');
                console.log('🏆 Best sellers section should now be empty');
            }
        } else {
            // Orders exist, recalculate counts from actual orders
            console.log('\n🔄 Recalculating order counts from existing orders...');
            
            const orderCounts = await Order.aggregate([
                { $match: { status: { $in: ['confirmed', 'ready', 'delivered'] } } },
                { $unwind: '$items' },
                { $group: { _id: '$items.productId', count: { $sum: '$items.quantity' } } }
            ]);

            console.log(`📈 Found order data for ${orderCounts.length} products`);

            // Reset all products to 0 first
            await Product.updateMany({}, { 
                $set: { 
                    totalOrderCount: 0,
                    lastOrderCountUpdate: new Date()
                }
            });

            // Update products that have actual orders
            for (const orderCount of orderCounts) {
                await Product.findByIdAndUpdate(
                    orderCount._id,
                    { 
                        $set: { 
                            totalOrderCount: orderCount.count,
                            lastOrderCountUpdate: new Date()
                        }
                    }
                );
                
                const product = await Product.findById(orderCount._id).select('name');
                console.log(`  ✅ ${product?.name || 'Unknown'}: ${orderCount.count} orders`);
            }
        }

        // Final verification
        console.log('\n📊 Final Status:');
        const finalProductsWithOrders = await Product.find({ totalOrderCount: { $gt: 0 } })
            .select('name totalOrderCount')
            .sort({ totalOrderCount: -1 });

        if (finalProductsWithOrders.length === 0) {
            console.log('✅ No products have order counts > 0');
        } else {
            console.log('Products with order counts:');
            finalProductsWithOrders.forEach(product => {
                console.log(`  - ${product.name}: ${product.totalOrderCount} orders`);
            });
        }

        const bestSellers = await Product.find({ totalOrderCount: { $gte: 4 } });
        console.log(`🏆 Current best sellers: ${bestSellers.length} products`);

        if (bestSellers.length === 0) {
            console.log('🎉 Best sellers section will now be hidden!');
        }

        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Run the script
resetOrderCounts();