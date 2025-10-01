import NewCart from '../models/newCartModel.js';
import Product from '../models/productModel.js';

// @desc    Get user's cart
// @route   GET /api/newcart
// @access  Private
export const getNewCart = async (req, res) => {
  try {
    const userId = req.user.uid;
    console.log(`📋 Getting cart for user: ${userId}`);

    const cart = await NewCart.getOrCreateCart(userId);
    
    // Generate ETag based on cart data for caching
    const eTag = `W/"cart-${userId}-${cart.updatedAt.getTime()}"`;
    
    // Check if client has fresh version
    if (req.headers['if-none-match'] === eTag) {
      console.log(`⚡ Cart not modified for user: ${userId}`);
      return res.status(304).end(); // Not Modified
    }
    
    // Return cart with virtual totals
    const cartData = {
      _id: cart._id,
      userId: cart.userId,
      items: cart.items,
      cartTotal: cart.cartTotal,
      cartCount: cart.cartCount,
      lastUpdated: cart.lastUpdated,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt
    };

    console.log(`✅ Cart retrieved: ${cart.items.length} items, total: ₹${cart.cartTotal}`);
    
    // Set ETag header
    res.setHeader('ETag', eTag);
    res.setHeader('Cache-Control', 'private, max-age=30'); // Cache for 30 seconds
    res.json(cartData);
  } catch (error) {
    console.error('❌ Error getting cart:', error);
    res.status(500).json({ error: 'Failed to get cart' });
  }
};

// @desc    Add item to cart
// @route   POST /api/newcart
// @access  Private
export const addToNewCart = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { productId, quantity = 1, variantIndex } = req.body;

  console.log(`🛒 Adding to cart: userId=${userId}, productId=${productId}, quantity=${quantity}, variantIndex=${req.body?.variantIndex}`);

    // Validate input
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be greater than 0' });
    }

  // Get product details
  const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if product is active
    if (!product.isActive) {
      return res.status(400).json({ error: 'Product is not available' });
    }

    // Get product price (from variants or main price)
  const vi = Number.isInteger(variantIndex) ? variantIndex : 0;
  const variant = Array.isArray(product.variants) ? product.variants[vi] : undefined;
  const productPrice = parseFloat(variant?.price || product.price || 0);
  const productStock = (variant?.stock ?? product.stock ?? 0);
  console.log(`🔎 Variant selection: vi=${vi}, tracks=${!!variant?.isStockActive}, stock=${productStock}, price=${productPrice}`);

    // Validate that we have a valid price
    if (isNaN(productPrice) || productPrice <= 0) {
      console.error(`Invalid price for product ${productId}: ${productPrice}`);
      return res.status(400).json({ error: 'Product price is not valid' });
    }

    // Check stock availability only if tracking stock
    const variantTracks = Boolean(variant?.isStockActive);
    if (variantTracks) {
      console.log(`✅ Variant tracks stock; validating requested qty ${quantity} <= current stock ${productStock}`);
      if (productStock < quantity) {
        return res.status(400).json({ error: 'Insufficient stock available' });
      }
    } else {
      console.log('ℹ️ Variant does not track stock; skipping stock availability checks');
    }

    // Prepare product details for cart
    const productDetails = {
      name: product.name,
      price: productPrice,
      image: product.image || product.images?.[0] || '',
      category: product.category?.name || product.category,
      isActive: product.isActive,
      variantIndex: vi
    };

    // Get or create cart
    const cart = await NewCart.getOrCreateCart(userId);

    // Check if item already exists in cart
    const existingItem = cart.items.find(item => 
      item.productId.toString() === productId.toString()
    );

  if (existingItem && variantTracks) {
      // Check total quantity won't exceed stock
      const newTotalQuantity = existingItem.quantity + quantity;
      console.log(`🧮 Existing item in cart. prevQty=${existingItem.quantity}, req=${quantity}, newTotal=${newTotalQuantity}, stock=${productStock}`);
      if (newTotalQuantity > productStock) {
        return res.status(400).json({ 
          error: `Cannot add ${quantity} more items. Only ${productStock - existingItem.quantity} available.`
        });
      }
    }

    // Add or update item in cart
    // If tracking, atomically decrement stock on the selected variant index
  let decremented = false;
  if (variantTracks && Array.isArray(product.variants) && product.variants.length > vi) {
      const path = `variants.${vi}.stock`;
      const dec = await Product.updateOne(
        { _id: productId, [path]: { $gte: quantity } },
        { $inc: { [path]: -quantity } }
      );
      console.log(`📉 Stock decrement attempt on ${path}: matched=${dec.matchedCount}, modified=${dec.modifiedCount}`);
      if (dec.modifiedCount === 0) {
        return res.status(400).json({ error: 'Insufficient stock available' });
      }
      decremented = true;
    } else {
      console.log('⏭️ Skipping stock decrement (variant does not track or invalid index)');
    }

    try {
      await cart.addOrUpdateItem(productId, quantity, productDetails);
    } catch (err) {
      if (decremented) {
        const path = `variants.${vi}.stock`;
        console.log(`↩️ Rolling back stock decrement on failure for ${path} by +${quantity}`);
        await Product.updateOne({ _id: productId }, { $inc: { [path]: quantity } });
      }
      throw err;
    }

    // Return updated cart
    const updatedCartData = {
      _id: cart._id,
      userId: cart.userId,
      items: cart.items,
      cartTotal: cart.cartTotal,
      cartCount: cart.cartCount,
      lastUpdated: cart.lastUpdated
    };

  console.log(`✅ Item added to cart: ${product.name} x${quantity} (vi=${vi}, tracks=${variantTracks})`);
    res.json(updatedCartData);

  } catch (error) {
    console.error('❌ Error adding to cart:', error);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/newcart/:productId
// @access  Private
export const updateNewCartItem = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { productId } = req.params;
    const { quantity } = req.body;

    console.log(`🔄 Updating cart item: userId=${userId}, productId=${productId}, quantity=${quantity}`);

    // Validate input
    if (quantity < 0) {
      return res.status(400).json({ error: 'Quantity cannot be negative' });
    }

    // Get cart
    const cart = await NewCart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    // If quantity is 0, remove item
    if (quantity === 0) {
      await cart.removeItem(productId);
    } else {
      // Check stock availability for the product
  const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

  const existingItem = cart.items.find(i => i.productId.toString() === productId.toString());
  const prevQty = existingItem ? existingItem.quantity : 0;
  const vi = Number.isInteger(existingItem?.productDetails?.variantIndex) ? existingItem.productDetails.variantIndex : 0;
  const variant = Array.isArray(product.variants) ? product.variants[vi] : undefined;
      const delta = quantity - prevQty;

  const variantTracks = Boolean(variant?.isStockActive);
  if (variantTracks && Array.isArray(product.variants) && product.variants.length > vi) {
        const path = `variants.${vi}.stock`;
        if (delta > 0) {
          const dec = await Product.updateOne(
            { _id: productId, [path]: { $gte: delta } },
            { $inc: { [path]: -delta } }
          );
          if (dec.modifiedCount === 0) {
            const currentStock = product.variants?.[vi]?.stock || 0;
            return res.status(400).json({ error: `Only ${currentStock} items available in stock` });
          }
        } else if (delta < 0) {
          await Product.updateOne({ _id: productId }, { $inc: { [path]: Math.abs(delta) } });
        }
      }

      // Update quantity
      await cart.updateItemQuantity(productId, quantity);
    }

    // Return updated cart
    const updatedCartData = {
      _id: cart._id,
      userId: cart.userId,
      items: cart.items,
      cartTotal: cart.cartTotal,
      cartCount: cart.cartCount,
      lastUpdated: cart.lastUpdated
    };

    console.log(`✅ Cart item updated: quantity=${quantity}`);
    res.json(updatedCartData);

  } catch (error) {
    console.error('❌ Error updating cart item:', error);
    if (error.message === 'Item not found in cart') {
      return res.status(404).json({ error: 'Item not found in cart' });
    }
    res.status(500).json({ error: 'Failed to update cart item' });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/newcart/:productId
// @access  Private
export const removeFromNewCart = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { productId } = req.params;

    console.log(`🗑️ Removing from cart: userId=${userId}, productId=${productId}`);

    // Get cart
    const cart = await NewCart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    // Find the item quantity and variant for restock
  const item = cart.items.find(i => i.productId.toString() === productId.toString());
  const qtyToReturn = item ? item.quantity : 0;
  const vi = Number.isInteger(item?.productDetails?.variantIndex) ? item.productDetails.variantIndex : 0;

    // Remove item
    await cart.removeItem(productId);

    // Restock if tracking
    if (qtyToReturn > 0) {
      const product = await Product.findById(productId);
      const variant = Array.isArray(product?.variants) ? product.variants[vi] : undefined;
      const variantTracks = Boolean(variant?.isStockActive);
      if (variantTracks && Array.isArray(product?.variants) && product.variants.length > vi) {
        const path = `variants.${vi}.stock`;
        await Product.updateOne({ _id: productId }, { $inc: { [path]: qtyToReturn } });
      }
    }

    // Return updated cart
    const updatedCartData = {
      _id: cart._id,
      userId: cart.userId,
      items: cart.items,
      cartTotal: cart.cartTotal,
      cartCount: cart.cartCount,
      lastUpdated: cart.lastUpdated
    };

    console.log(`✅ Item removed from cart`);
    res.json(updatedCartData);

  } catch (error) {
    console.error('❌ Error removing from cart:', error);
    if (error.message === 'Item not found in cart') {
      return res.status(404).json({ error: 'Item not found in cart' });
    }
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
};

// @desc    Clear entire cart
// @route   DELETE /api/newcart
// @access  Private
export const clearNewCart = async (req, res) => {
  try {
    const userId = req.user.uid;
    console.log(`🧹 Clearing cart for user: ${userId}`);

    // Get cart
    const cart = await NewCart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    // Restock items for products that track stock
    for (const item of cart.items) {
      const vi = Number.isInteger(item?.productDetails?.variantIndex) ? item.productDetails.variantIndex : 0;
      const product = await Product.findById(item.productId);
      const variant = Array.isArray(product?.variants) ? product.variants[vi] : undefined;
      const variantTracks = Boolean(variant?.isStockActive);
      if (variantTracks && Array.isArray(product?.variants) && product.variants.length > vi) {
        const path = `variants.${vi}.stock`;
        await Product.updateOne({ _id: item.productId }, { $inc: { [path]: item.quantity } });
      }
    }

    // Clear cart
    await cart.clearCart();

    // Return empty cart
    const clearedCartData = {
      _id: cart._id,
      userId: cart.userId,
      items: cart.items,
      cartTotal: cart.cartTotal,
      cartCount: cart.cartCount,
      lastUpdated: cart.lastUpdated
    };

    console.log(`✅ Cart cleared`);
    res.json(clearedCartData);

  } catch (error) {
    console.error('❌ Error clearing cart:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
};

// @desc    Get cart item count
// @route   GET /api/newcart/count
// @access  Private
export const getNewCartCount = async (req, res) => {
  try {
    const userId = req.user.uid;

    const cart = await NewCart.findOne({ userId });
    const count = cart ? cart.cartCount : 0;

    console.log(`📊 Cart count for user ${userId}: ${count}`);
    res.json({ count });

  } catch (error) {
    console.error('❌ Error getting cart count:', error);
    res.status(500).json({ error: 'Failed to get cart count' });
  }
};