import asyncHandler from 'express-async-handler';
import Product from '../models/productModel.js';
import Category from '../models/categoryModel.js';

// @desc    Get inventory overview for admin
// @route   GET /api/stock/inventory/overview
// @access  Admin only
export const getInventoryOverview = asyncHandler(async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .populate('category', 'name')
      .select('name variants category');

    let totalProducts = 0;
    let lowStockProducts = 0;
    let outOfStockProducts = 0;
    let totalVariants = 0;
    
    const inventoryData = products.map(product => {
      const variantsData = product.variants.map((variant, index) => {
        totalVariants++;
        const stock = variant.stock || 0;
        const isStockActive = variant.isStockActive || false;
        
        if (isStockActive) {
          if (stock === 0) {
            outOfStockProducts++;
          } else if (stock <= 5) { // Low stock threshold
            lowStockProducts++;
          }
        }
        
        return {
          variantIndex: index,
          name: variant.name || `Variant ${index + 1}`,
          quantity: variant.quantity,
          measuringUnit: variant.measuringUnit || 'unit',
          stock: stock,
          isStockActive: isStockActive,
          price: variant.price,
          status: !isStockActive ? 'disabled' : stock === 0 ? 'out_of_stock' : stock <= 5 ? 'low_stock' : 'in_stock'
        };
      });
      
      totalProducts++;
      
      return {
        _id: product._id,
        name: product.name,
        category: product.category,
        variants: variantsData
      };
    });

    res.json({
      success: true,
      overview: {
        totalProducts,
        totalVariants,
        lowStockProducts,
        outOfStockProducts,
        inStockProducts: totalVariants - outOfStockProducts - lowStockProducts
      },
      products: inventoryData
    });
  } catch (error) {
    console.error('Error fetching inventory overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory overview',
      error: error.message
    });
  }
});

// @desc    Get low stock products
// @route   GET /api/stock/inventory/low-stock
// @access  Admin only
export const getLowStockProducts = asyncHandler(async (req, res) => {
  const threshold = parseInt(req.query.threshold) || 5;
  
  try {
    const products = await Product.find({ isActive: true })
      .populate('category', 'name')
      .select('name variants category');

    const lowStockItems = [];
    
    products.forEach(product => {
      product.variants.forEach((variant, index) => {
        if (variant.isStockActive && variant.stock <= threshold && variant.stock >= 0) {
          lowStockItems.push({
            productId: product._id,
            productName: product.name,
            category: product.category,
            variantIndex: index,
            variantName: variant.name || `Variant ${index + 1}`,
            currentStock: variant.stock,
            quantity: variant.quantity,
            measuringUnit: variant.measuringUnit || 'unit',
            price: variant.price,
            status: variant.stock === 0 ? 'out_of_stock' : 'low_stock'
          });
        }
      });
    });

    res.json({
      success: true,
      threshold,
      count: lowStockItems.length,
      items: lowStockItems
    });
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch low stock products',
      error: error.message
    });
  }
});

// @desc    Bulk update stock for multiple products
// @route   PUT /api/stock/inventory/bulk-update
// @access  Admin only
export const bulkUpdateStock = asyncHandler(async (req, res) => {
  const { updates } = req.body; // Array of { productId, variantIndex, stock, isStockActive }
  
  if (!Array.isArray(updates)) {
    res.status(400);
    throw new Error('Updates must be an array');
  }

  const results = [];
  const errors = [];

  try {
    for (const update of updates) {
      const { productId, variantIndex, stock, isStockActive } = update;
      
      try {
        const updateData = {};
        if (typeof stock === 'number') {
          updateData[`variants.${variantIndex}.stock`] = Math.max(0, stock);
        }
        if (typeof isStockActive === 'boolean') {
          updateData[`variants.${variantIndex}.isStockActive`] = isStockActive;
        }

        const product = await Product.findByIdAndUpdate(
          productId,
          { $set: updateData },
          { new: true }
        );

        if (product) {
          results.push({
            productId,
            variantIndex,
            success: true,
            newStock: product.variants[variantIndex].stock,
            isStockActive: product.variants[variantIndex].isStockActive
          });
        } else {
          errors.push({
            productId,
            variantIndex,
            error: 'Product not found'
          });
        }
      } catch (error) {
        errors.push({
          productId,
          variantIndex,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Updated ${results.length} items successfully`,
      results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error in bulk stock update:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stock',
      error: error.message
    });
  }
});

// @desc    Get stock history/activity log
// @route   GET /api/stock/inventory/activity
// @access  Admin only
export const getStockActivity = asyncHandler(async (req, res) => {
  const { productId, limit = 50 } = req.query;
  
  try {
    // This is a placeholder - in a real implementation, you'd have a stock activity log
    // For now, we'll return recent order activities that affected stock
    const pipeline = [
      {
        $match: productId ? { 'items.productId': productId } : {}
      },
      {
        $unwind: '$items'
      },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $project: {
          orderId: '$_id',
          productId: '$items.productId',
          productName: '$product.name',
          variantIndex: '$items.variantIndex',
          quantity: '$items.quantity',
          action: 'order_placed',
          createdAt: '$createdAt',
          orderStatus: '$status'
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ];

    // Note: You'll need to adjust this based on your Order model structure
    // const activities = await Order.aggregate(pipeline);
    
    // For now, returning a placeholder response
    res.json({
      success: true,
      activities: [],
      message: 'Stock activity tracking will be implemented with order history'
    });
  } catch (error) {
    console.error('Error fetching stock activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock activity',
      error: error.message
    });
  }
});

// @desc    Set stock alerts and thresholds
// @route   PUT /api/stock/inventory/alerts
// @access  Admin only
export const updateStockAlerts = asyncHandler(async (req, res) => {
  const { productId, variantIndex, lowStockThreshold, outOfStockAlert } = req.body;
  
  try {
    const updateData = {};
    
    if (typeof lowStockThreshold === 'number') {
      updateData[`variants.${variantIndex}.lowStockThreshold`] = Math.max(0, lowStockThreshold);
    }
    
    if (typeof outOfStockAlert === 'boolean') {
      updateData[`variants.${variantIndex}.outOfStockAlert`] = outOfStockAlert;
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      { $set: updateData },
      { new: true }
    );

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    res.json({
      success: true,
      message: 'Stock alerts updated successfully',
      productId,
      variantIndex,
      settings: {
        lowStockThreshold: product.variants[variantIndex].lowStockThreshold,
        outOfStockAlert: product.variants[variantIndex].outOfStockAlert
      }
    });
  } catch (error) {
    console.error('Error updating stock alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stock alerts',
      error: error.message
    });
  }
});

// @desc    Generate inventory report
// @route   GET /api/stock/inventory/report
// @access  Admin only
export const generateInventoryReport = asyncHandler(async (req, res) => {
  const { format = 'json', categoryId } = req.query;
  
  try {
    let filter = { isActive: true };
    if (categoryId) {
      filter.category = categoryId;
    }

    const products = await Product.find(filter)
      .populate('category', 'name')
      .select('name variants category createdAt updatedAt');

    const reportData = {
      generatedAt: new Date(),
      totalProducts: products.length,
      categories: {},
      products: []
    };

    products.forEach(product => {
      const categoryName = product.category?.name || 'Uncategorized';
      
      if (!reportData.categories[categoryName]) {
        reportData.categories[categoryName] = {
          productCount: 0,
          totalVariants: 0,
          lowStockCount: 0,
          outOfStockCount: 0
        };
      }

      reportData.categories[categoryName].productCount++;

      const productData = {
        id: product._id,
        name: product.name,
        category: categoryName,
        variants: []
      };

      product.variants.forEach((variant, index) => {
        reportData.categories[categoryName].totalVariants++;
        
        const stock = variant.stock || 0;
        const isLowStock = variant.isStockActive && stock <= 5 && stock > 0;
        const isOutOfStock = variant.isStockActive && stock === 0;
        
        if (isLowStock) reportData.categories[categoryName].lowStockCount++;
        if (isOutOfStock) reportData.categories[categoryName].outOfStockCount++;

        productData.variants.push({
          index,
          name: variant.name || `Variant ${index + 1}`,
          quantity: variant.quantity,
          measuringUnit: variant.measuringUnit,
          stock: stock,
          isStockActive: variant.isStockActive,
          price: variant.price,
          status: !variant.isStockActive ? 'disabled' : 
                  isOutOfStock ? 'out_of_stock' : 
                  isLowStock ? 'low_stock' : 'in_stock'
        });
      });

      reportData.products.push(productData);
    });

    res.json({
      success: true,
      report: reportData
    });
  } catch (error) {
    console.error('Error generating inventory report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate inventory report',
      error: error.message
    });
  }
});
