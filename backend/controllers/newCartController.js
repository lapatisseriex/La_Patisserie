import NewCart from '../models/newCartModel.js';
import Product from '../models/productModel.js';
import { formatVariantLabel } from '../utils/variantUtils.js';

// @desc    Get user's cart
// @route   GET /api/newcart
// @access  Private
export const getNewCart = async (req, res) => {
  try {
    const userId = req.user.uid;
    console.log(`📋 Getting cart for user: ${userId}`);

    const cart = await NewCart.getOrCreateCart(userId);
    
    // Refresh product details for all cart items to get latest data
    const refreshedItems = [];
    let itemsChanged = false;
    for (const item of cart.items) {
      try {
        const product = await Product.findById(item.productId);
        if (product && product.isActive) {
          const variantsArray = Array.isArray(product.variants)
            ? product.variants
            : [];

          let variantIndex = Number.isInteger(item.productDetails?.variantIndex)
            ? item.productDetails.variantIndex
            : 0;

          if (variantsArray.length > 0) {
            if (variantIndex < 0 || variantIndex >= variantsArray.length) {
              variantIndex = 0;
            }
          } else {
            variantIndex = 0;
          }

          const variantDoc = variantsArray.length > 0 && variantsArray[variantIndex]
            ? variantsArray[variantIndex]
            : null;

          const variant = variantDoc
            ? (typeof variantDoc.toObject === 'function'
              ? variantDoc.toObject()
              : { ...variantDoc })
            : null;

          const normalizedVariants = variantsArray.map((entry) => {
            const plainVariant = typeof entry.toObject === 'function'
              ? entry.toObject()
              : { ...entry };
            return {
              ...plainVariant,
              variantLabel: formatVariantLabel(plainVariant)
            };
          });
          
          // Update product details with latest data
          const updatedProductDetails = {
            ...item.productDetails,
            name: product.name,
            image: product.image || product.images?.[0] || item.productDetails.image,
            category: product.category?.name || product.category,
            isActive: product.isActive,
            hasEgg: Boolean(product.hasEgg),
            variantIndex,
            variants: normalizedVariants,
            selectedVariant: variant
              ? {
                  ...variant,
                  variantLabel: formatVariantLabel(variant)
                }
              : null,
            variantLabel: variant
              ? formatVariantLabel(variant)
              : item.productDetails?.variantLabel || ''
          };
          const existingDetails = item.productDetails ? JSON.stringify(item.productDetails) : null;
          const updatedDetails = JSON.stringify(updatedProductDetails);
          if (existingDetails !== updatedDetails) {
            item.productDetails = updatedProductDetails;
            if (typeof item.markModified === 'function') {
              item.markModified('productDetails');
            }
            itemsChanged = true;
          }
          
          refreshedItems.push({
            ...item.toObject(),
            productDetails: updatedProductDetails
          });
        } else {
          // Keep inactive/deleted products but mark as inactive
          refreshedItems.push({
            ...item.toObject(),
            productDetails: {
              ...item.productDetails,
              isActive: false
            }
          });
        }
      } catch (error) {
        console.warn(`Error refreshing product data for ${item.productId}:`, error);
        // Keep original item if refresh fails
        refreshedItems.push(item.toObject());
      }
    }

    if (itemsChanged) {
      cart.lastUpdated = new Date();
      cart.markModified('items');
      await cart.save();
    }

    // Generate ETag based on cart data for caching (recompute after potential save)
    const eTag = `W/"cart-${userId}-${cart.updatedAt.getTime()}"`;

    // Check if client has fresh version
    if (!itemsChanged && req.headers['if-none-match'] === eTag) {
      console.log(`⚡ Cart not modified for user: ${userId}`);
      return res.status(304).end(); // Not Modified
    }
    
    // Return cart with refreshed product details
    const cartData = {
      _id: cart._id,
      userId: cart.userId,
      items: refreshedItems,
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
  const variantsArray = Array.isArray(product.variants) ? product.variants : [];
  const vi = Number.isInteger(variantIndex) ? variantIndex : 0;
  const variantDoc = variantsArray[vi];
  const variant = variantDoc
    ? (typeof variantDoc.toObject === 'function'
      ? variantDoc.toObject()
      : { ...variantDoc })
    : null;
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

    const normalizedVariants = variantsArray.map((entry) => {
      const plainVariant = typeof entry.toObject === 'function'
        ? entry.toObject()
        : { ...entry };
      return {
        ...plainVariant,
        variantLabel: formatVariantLabel(plainVariant)
      };
    });

    // Prepare product details for cart
    const productDetails = {
      name: product.name,
      price: productPrice,
      image: product.image || product.images?.[0] || '',
      category: product.category?.name || product.category,
      isActive: product.isActive,
      hasEgg: Boolean(product.hasEgg),
      variantIndex: vi,
      // Include full product data for free cash calculations
      variants: normalizedVariants,
      // Quick access to selected variant for frontend
      selectedVariant: variant
        ? {
            ...variant,
            variantLabel: formatVariantLabel(variant)
          }
        : null,
      variantLabel: variant ? formatVariantLabel(variant) : ''
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
    // NOTE: We DO NOT decrement stock here - only validate availability
    // Stock will be decremented only when order is actually completed/paid
    if (variantTracks && Array.isArray(product.variants) && product.variants.length > vi) {
      console.log(`✅ Stock validation passed for variant ${vi}: ${quantity} <= ${productStock}`);
    } else {
      console.log('⏭️ Variant does not track stock - no validation needed');
    }

    // Add to cart without stock decrement
    await cart.addOrUpdateItem(productId, quantity, productDetails);

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

    // Get cart (lean for faster read)
    const cart = await NewCart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    // If quantity is 0, remove item
    if (quantity === 0) {
      await cart.removeItem(productId);
      
      // Return updated cart immediately
      return res.json({
        _id: cart._id,
        userId: cart.userId,
        items: cart.items,
        cartTotal: cart.cartTotal,
        cartCount: cart.cartCount,
        lastUpdated: cart.lastUpdated
      });
    }
    
    // For non-zero quantities, validate stock if needed
    const existingItem = cart.items.find(i => i.productId.toString() === productId.toString());
    
    if (!existingItem) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }
    
    const vi = Number.isInteger(existingItem?.productDetails?.variantIndex) ? existingItem.productDetails.variantIndex : 0;
    
    // Only fetch product if we need to check stock (optimized)
    const variant = existingItem?.productDetails?.variants?.[vi];
    const variantTracks = Boolean(variant?.isStockActive);
    
    if (variantTracks) {
      // Need to validate against latest stock - fetch product
      const product = await Product.findById(productId).lean().select('variants');
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      const currentVariant = product.variants?.[vi];
      const currentStock = currentVariant?.stock || 0;
      
      if (quantity > currentStock) {
        return res.status(400).json({ error: `Only ${currentStock} items available in stock` });
      }
      console.log(`✅ Stock validation passed: quantity ${quantity} <= stock ${currentStock}`);
    }

    // Update quantity (absolute) - fast operation
    await cart.updateItemQuantity(productId, quantity);

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

    // NOTE: No stock restoration needed since we don't decrement stock on add to cart
    // Stock will only be decremented on actual order completion
    if (qtyToReturn > 0) {
      console.log(`🗑️ Removed ${qtyToReturn} items from cart - no stock restoration needed`);
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
    // Determine whether to restock items (default true for manual clears). For checkout, client will pass restock=false
    const shouldRestock = (req.query?.restock ?? 'true') !== 'false';

    // Get cart
    const cart = await NewCart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    // NOTE: No stock restoration needed since we don't decrement stock on add to cart
    // Stock is only decremented when orders are actually completed
    console.log('� Clearing cart - no stock changes needed (stock decrements only on order completion)');

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