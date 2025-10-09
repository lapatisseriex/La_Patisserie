import express from 'express';
import Product from '../models/productModel.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get stock status for a product
// @route   GET /api/stock/:productId
// @access  Public
router.get('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    const stockInfo = product.variants.map((variant, index) => ({
      variantIndex: index,
      quantity: variant.quantity,
      measuringUnit: variant.measuringUnit,
      stock: variant.stock,
      isStockActive: variant.isStockActive,
      price: variant.price
    }));

    res.json({
      success: true,
      productId: product._id,
      productName: product.name,
      variants: stockInfo
    });
  } catch (error) {
    console.error('Error fetching stock info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock information',
      error: error.message
    });
  }
});

// @desc    Update product stock manually (Admin only)
// @route   PUT /api/stock/:productId/variant/:variantIndex
// @access  Private (Admin only)
router.put('/:productId/variant/:variantIndex', protect, admin, async (req, res) => {
  try {
    const { productId, variantIndex } = req.params;
    const { stock, isStockActive } = req.body;
    
    const vi = parseInt(variantIndex);
    
    const updateData = {};
    if (typeof stock === 'number') {
      updateData[`variants.${vi}.stock`] = Math.max(0, stock);
    }
    if (typeof isStockActive === 'boolean') {
      updateData[`variants.${vi}.isStockActive`] = isStockActive;
    }
    
    const product = await Product.findByIdAndUpdate(
      productId,
      { $set: updateData },
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    const variant = product.variants[vi];
    
    res.json({
      success: true,
      message: 'Stock updated successfully',
      productId: product._id,
      variantIndex: vi,
      updatedStock: variant.stock,
      isStockActive: variant.isStockActive
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stock',
      error: error.message
    });
  }
});

export default router;