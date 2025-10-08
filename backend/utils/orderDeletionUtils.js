import mongoose from 'mongoose';
import Product from '../models/productModel.js';
import Order from '../models/orderModel.js';

/**
 * Safely delete orders and update product order counts
 */
export const deleteOrdersAndUpdateCounts = async (filter = {}) => {
    const session = await mongoose.startSession();
    
    try {
        await session.withTransaction(async () => {
            // Delete orders
            const deleteResult = await Order.deleteMany(filter, { session });
            console.log(`Deleted ${deleteResult.deletedCount} orders`);
            
            if (Object.keys(filter).length === 0) {
                // If deleting ALL orders, reset all product counts to 0
                await Product.updateMany(
                    {},
                    { 
                        $set: { 
                            totalOrderCount: 0,
                            lastOrderCountUpdate: new Date()
                        }
                    },
                    { session }
                );
                console.log('Reset all product order counts to 0');
            } else {
                // If deleting specific orders, recalculate counts from remaining orders
                await recalculateProductOrderCounts(session);
            }
        });
        
        console.log('Orders deleted and product counts updated successfully');
    } catch (error) {
        console.error('Error deleting orders and updating counts:', error);
        throw error;
    } finally {
        await session.endSession();
    }
};

/**
 * Recalculate product order counts from existing orders
 */
const recalculateProductOrderCounts = async (session = null) => {
    // Get actual order counts from existing orders
    const orderCounts = await Order.aggregate([
        { $match: { status: { $in: ['confirmed', 'ready', 'delivered'] } } },
        { $unwind: '$items' },
        { $group: { _id: '$items.productId', count: { $sum: '$items.quantity' } } }
    ]).session(session);

    // Reset all products to 0 first
    await Product.updateMany(
        {},
        { 
            $set: { 
                totalOrderCount: 0,
                lastOrderCountUpdate: new Date()
            }
        },
        { session }
    );

    // Update products that have actual orders
    for (const orderCount of orderCounts) {
        await Product.findByIdAndUpdate(
            orderCount._id,
            { 
                $set: { 
                    totalOrderCount: orderCount.count,
                    lastOrderCountUpdate: new Date()
                }
            },
            { session }
        );
    }
};

/**
 * Reset all product order counts (utility function)
 */
export const resetAllProductOrderCounts = async () => {
    return await deleteOrdersAndUpdateCounts();
};

export default {
    deleteOrdersAndUpdateCounts,
    resetAllProductOrderCounts
};