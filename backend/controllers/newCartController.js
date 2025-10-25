import NewCart from '../models/newCartModel.js';
import Product from '../models/productModel.js';
import { formatVariantLabel } from '../utils/variantUtils.js';

// Helper: find cart by UID with fallbacks to legacy keys and migrate to UID
async function findCartByUserWithMigration(user) {
  const uid = user.uid;
  // 1) Try by UID (current canonical key)
  let cart = await NewCart.findOne({ userId: uid });
  if (cart) return cart;

  // 2) Fallback: try by email (legacy carts could have been keyed by email)
  if (user.email) {
    const legacyByEmail = await NewCart.findOne({ userId: user.email.toLowerCase() });
    if (legacyByEmail) {
      // Migrate to UID
      legacyByEmail.userId = uid;
      try {
        await legacyByEmail.save();
        return legacyByEmail;
      } catch (e) {
        // If unique conflict (both exist), prefer UID cart and drop legacy
        if (String(e?.code) === '11000') {
          const uidCart = await NewCart.findOne({ userId: uid });
          if (uidCart && (!uidCart.items || uidCart.items.length === 0)) {
            // Move items over if needed
            uidCart.items = legacyByEmail.items || [];
            uidCart.lastUpdated = new Date();
            await uidCart.save();
          }
          await NewCart.deleteOne({ _id: legacyByEmail._id });
          return uidCart || null;
        }
      }
    }
  }

  // 3) Fallback: try by Mongo user _id as string (another possible legacy key)
  if (user._id) {
    const legacyByMongoId = await NewCart.findOne({ userId: String(user._id) });
    if (legacyByMongoId) {
      legacyByMongoId.userId = uid;
      try {
        await legacyByMongoId.save();
        return legacyByMongoId;
      } catch (e) {
        if (String(e?.code) === '11000') {
          const uidCart = await NewCart.findOne({ userId: uid });
          if (uidCart && (!uidCart.items || uidCart.items.length === 0)) {
            uidCart.items = legacyByMongoId.items || [];
            uidCart.lastUpdated = new Date();
            await uidCart.save();
          }
          await NewCart.deleteOne({ _id: legacyByMongoId._id });
          return uidCart || null;
        }
      }
    }
  }
  return null;
}

// Cart item expiry window (default 24h); configurable for testing via env or per-request in non-production
const getExpiryCutoff = (req) => {
  // Prefer per-request override for testing (non-production only)
  if (process.env.NODE_ENV !== 'production') {
    const minutes = parseFloat(req?.query?.expiryTestMinutes || req?.query?.expiry_minutes || '');
    const hours = parseFloat(req?.query?.expiryTestHours || req?.query?.expiry_hours || '');
    if (!isNaN(minutes) && minutes > 0) {
      return new Date(Date.now() - minutes * 60 * 1000);
    }
    if (!isNaN(hours) && hours > 0) {
      return new Date(Date.now() - hours * 60 * 60 * 1000);
    }
  }
  // Prefer explicit seconds if provided; else hours; default 24 hours
  const secondsRaw = process.env.CART_ITEM_EXPIRY_SECONDS;
  const secondsEnv = secondsRaw !== undefined ? parseFloat(secondsRaw) : NaN;
  if (!isNaN(secondsEnv) && secondsEnv > 0) {
    return new Date(Date.now() - secondsEnv * 1000);
  }
  const hoursEnv = parseFloat(process.env.CART_ITEM_EXPIRY_HOURS || '24');
  const ms = (isNaN(hoursEnv) || hoursEnv <= 0 ? 24 : hoursEnv) * 60 * 60 * 1000;
  return new Date(Date.now() - ms);
};

// Purge expired items for a user atomically (no optimistic version check on save)
async function purgeExpiredForUserId(userId, cutoff) {
  try {
    await NewCart.updateOne(
      { userId },
      {
        $pull: { items: { addedAt: { $lt: cutoff } } },
        $set: { lastUpdated: new Date() }
      }
    );
    // If the purge resulted in an empty items array (or items missing), delete the cart doc immediately
    try {
      await NewCart.deleteOne({
        userId,
        $or: [
          { items: { $exists: false } },
          { items: { $size: 0 } }
        ]
      });
    } catch {}
  } catch (e) {
    // non-fatal
  }
}

// Delete cart document if it has no items; return null if deleted
async function deleteIfEmpty(cart) {
  if (!cart) return null;
  const isEmpty = !Array.isArray(cart.items) || cart.items.length === 0;
  if (isEmpty) {
    try { await NewCart.deleteOne({ _id: cart._id }); } catch {}
    return null;
  }
  return cart;
}

// @desc    Get user's cart
// @route   GET /api/newcart
// @access  Private
export const getNewCart = async (req, res) => {
  try {
    const userId = req.user.uid;
    console.log(`📋 Getting cart for user: ${userId}`);

    // Determine expiry cutoff (supports test overrides in non-prod)
    const cutoff = getExpiryCutoff(req);

  // Fetch cart first (do not auto-create to avoid empty docs); attempt legacy migrations
    let cart = await NewCart.findOne({ userId });
    if (!cart) {
      cart = await findCartByUserWithMigration(req.user);
    }
    if (!cart) {
      res.setHeader('Cache-Control', 'no-store');
      return res.json({
        _id: null,
        userId,
        items: [],
        cartTotal: 0,
        cartCount: 0,
        lastUpdated: new Date(),
        expiredRemovedItems: []
      });
    }
    // Compute which items would expire before purge (for client notification)
    const expiredCandidates = Array.isArray(cart.items)
      ? cart.items.filter(i => {
          const added = new Date(i.addedAt);
          return added < cutoff;
        }).map(i => ({
          productId: i.productId,
          name: i?.productDetails?.name || '',
          addedAt: i.addedAt
        }))
      : [];

  // Purge expired items using the same cutoff
    await purgeExpiredForUserId(userId, cutoff);
    // Re-fetch cart after purge to get latest state from DB, then delete if empty
    cart = await NewCart.findOne({ userId });
    cart = await deleteIfEmpty(cart);
    if (!cart) {
      res.setHeader('Cache-Control', 'no-store');
      return res.json({ _id: null, userId, items: [], cartTotal: 0, cartCount: 0, lastUpdated: new Date(), expiredRemovedItems: expiredCandidates });
    }
    
    // Refresh product details for all cart items to get latest data
  const refreshedItems = [];
  const expiryWindowMs = Math.max(0, Date.now() - cutoff.getTime());
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
          
          const obj = item.toObject();
          const added = new Date(obj.addedAt);
          const expiresAt = new Date(added.getTime() + expiryWindowMs);
          refreshedItems.push({
            ...obj,
            productDetails: updatedProductDetails,
            expiresAt
          });
        } else {
          // Keep inactive/deleted products but mark as inactive
          const obj = item.toObject();
          const added = new Date(obj.addedAt);
          const expiresAt = new Date(added.getTime() + expiryWindowMs);
          refreshedItems.push({
            ...obj,
            productDetails: {
              ...item.productDetails,
              isActive: false
            },
            expiresAt
          });
        }
      } catch (error) {
        console.warn(`Error refreshing product data for ${item.productId}:`, error);
        // Keep original item if refresh fails
        const obj = item.toObject();
        const added = new Date(obj.addedAt);
        const expiresAt = new Date(added.getTime() + expiryWindowMs);
        refreshedItems.push({ ...obj, expiresAt });
      }
    }

    // Avoid saving during GET to prevent VersionError on concurrent writes

    // Return cart with refreshed product details
    const cartData = {
      _id: cart._id,
      userId: cart.userId,
      items: refreshedItems,
      cartTotal: cart.cartTotal,
      cartCount: cart.cartCount,
      lastUpdated: cart.lastUpdated,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
      expiredRemovedItems: expiredCandidates,
      cartExpirySeconds: Math.round(expiryWindowMs / 1000)
    };

    console.log(`✅ Cart retrieved: ${cart.items.length} items, total: ₹${cart.cartTotal}`);

    // Always fetch from DB: disable HTTP caching for cart responses
    res.setHeader('Cache-Control', 'no-store');
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

  // Purge expired first for up-to-date state
  await purgeExpiredForUserId(userId, getExpiryCutoff(req));

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

    // Retry loop to handle concurrent updates optimistically
    const MAX_RETRIES = 3;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Get or create latest cart (also migrate if legacy)
        let cart = await NewCart.findOne({ userId });
        if (!cart) {
          cart = await findCartByUserWithMigration(req.user);
        }
        if (!cart) {
          cart = await NewCart.getOrCreateCart(userId);
        }

        // Check if item already exists in cart to validate max stock for tracked variants
        const existingItem = cart.items.find(item => item.productId.toString() === productId.toString());
        if (existingItem && variantTracks) {
          const newTotalQuantity = existingItem.quantity + quantity;
          console.log(`🧮 Existing item in cart. prevQty=${existingItem.quantity}, req=${quantity}, newTotal=${newTotalQuantity}, stock=${productStock}`);
          if (newTotalQuantity > productStock) {
            return res.status(400).json({ 
              error: `Cannot add ${quantity} more items. Only ${productStock - existingItem.quantity} available.`
            });
          }
        }

        // Stock is validated but not decremented here
        if (variantTracks && Array.isArray(product.variants) && product.variants.length > vi) {
          console.log(`✅ Stock validation passed for variant ${vi}: ${quantity} <= ${productStock}`);
        } else {
          console.log('⏭️ Variant does not track stock - no validation needed');
        }

  await cart.addOrUpdateItem(productId, quantity, productDetails);

        const updatedCartData = {
          _id: cart._id,
          userId: cart.userId,
          items: cart.items,
          cartTotal: cart.cartTotal,
          cartCount: cart.cartCount,
          lastUpdated: cart.lastUpdated
        };

        console.log(`✅ Item added to cart: ${product.name} x${quantity} (vi=${vi}, tracks=${variantTracks})`);
        return res.json(updatedCartData);
      } catch (err) {
        if (err?.name === 'VersionError' && attempt < MAX_RETRIES) {
          console.warn(`💥 Version conflict on addToNewCart, retrying (${attempt}/${MAX_RETRIES - 1})...`);
          // small jitter to reduce thundering herd
          await new Promise(r => setTimeout(r, 25 * attempt));
          continue;
        }
        throw err;
      }
    }

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

  // Purge expired first for up-to-date state
  await purgeExpiredForUserId(userId, getExpiryCutoff(req));

    console.log(`🔄 Updating cart item: userId=${userId}, productId=${productId}, quantity=${quantity}`);

    // Validate input
    if (quantity < 0) {
      return res.status(400).json({ error: 'Quantity cannot be negative' });
    }

    const MAX_RETRIES = 3;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Get latest cart (handle legacy migration to UID if needed)
        let cart = await NewCart.findOne({ userId });
        if (!cart) {
          cart = await findCartByUserWithMigration(req.user);
        }
        if (!cart) {
          return res.status(404).json({ error: 'Cart not found' });
        }

        if (quantity === 0) {
          // Atomic remove to avoid concurrency issues
          await NewCart.updateOne(
            { _id: cart._id },
            { $pull: { items: { productId } }, $set: { lastUpdated: new Date() } }
          );
          const refreshed = await NewCart.findById(cart._id);
          if (!refreshed || !refreshed.items || refreshed.items.length === 0) {
            // Delete empty cart doc
            try { await NewCart.deleteOne({ _id: cart._id }); } catch {}
            return res.json({
              _id: null,
              userId: cart.userId,
              items: [],
              cartTotal: 0,
              cartCount: 0,
              lastUpdated: new Date()
            });
          }
          return res.json({
            _id: refreshed._id,
            userId: refreshed.userId,
            items: refreshed.items,
            cartTotal: refreshed.cartTotal,
            cartCount: refreshed.cartCount,
            lastUpdated: refreshed.lastUpdated
          });
        }

        // Validate stock if variant tracks stock
        const existingItem = cart.items.find(i => i.productId.toString() === productId.toString());
        if (!existingItem) {
          return res.status(404).json({ error: 'Item not found in cart' });
        }
        const vi = Number.isInteger(existingItem?.productDetails?.variantIndex) ? existingItem.productDetails.variantIndex : 0;
        const variant = existingItem?.productDetails?.variants?.[vi];
        const variantTracks = Boolean(variant?.isStockActive);
        if (variantTracks) {
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

        // Atomic, positional update to avoid optimistic concurrency VersionError
        const updateResult = await NewCart.updateOne(
          { _id: cart._id, 'items.productId': productId },
          { $set: { 'items.$.quantity': quantity, lastUpdated: new Date() } }
        );

        if (!updateResult?.matchedCount && !updateResult?.modifiedCount) {
          // Item may have been removed concurrently
          return res.status(404).json({ error: 'Item not found in cart' });
        }

        // Re-fetch the updated cart to return fresh values and virtuals (cartTotal/cartCount)
        const refreshed = await NewCart.findById(cart._id);
        const updatedCartData = {
          _id: refreshed._id,
          userId: refreshed.userId,
          items: refreshed.items,
          cartTotal: refreshed.cartTotal,
          cartCount: refreshed.cartCount,
          lastUpdated: refreshed.lastUpdated
        };

        console.log(`✅ Cart item updated: quantity=${quantity}`);
        return res.json(updatedCartData);
      } catch (err) {
        if (err?.name === 'VersionError' && attempt < MAX_RETRIES) {
          console.warn(`💥 Version conflict on updateNewCartItem, retrying (${attempt}/${MAX_RETRIES - 1})...`);
          await new Promise(r => setTimeout(r, 25 * attempt));
          continue;
        }
        throw err;
      }
    }

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

  // Purge expired first to avoid returning stale entries
  await purgeExpiredForUserId(userId, getExpiryCutoff(req));

    console.log(`🗑️ Removing from cart: userId=${userId}, productId=${productId}`);

    // Get cart
    let cart = await NewCart.findOne({ userId });
    if (!cart) {
      cart = await findCartByUserWithMigration(req.user);
    }
    if (!cart) {
      console.log('ℹ️ No cart document found; returning empty cart response');
      return res.json({
        _id: null,
        userId,
        items: [],
        cartTotal: 0,
        cartCount: 0,
        lastUpdated: new Date()
      });
    }

    // Find the item quantity and variant for restock
  const item = cart.items.find(i => i.productId.toString() === productId.toString());
  const qtyToReturn = item ? item.quantity : 0;
  const vi = Number.isInteger(item?.productDetails?.variantIndex) ? item.productDetails.variantIndex : 0;

    // Remove item
    await cart.removeItem(productId);

    // If cart becomes empty, delete the document and return empty response
    if (!cart.items || cart.items.length === 0) {
      try { await NewCart.deleteOne({ _id: cart._id }); } catch {}
      const emptyCart = {
        _id: null,
        userId: cart.userId,
        items: [],
        cartTotal: 0,
        cartCount: 0,
        lastUpdated: new Date()
      };
      console.log('🗑️ Cart is empty after removal. Deleted cart document.');
      return res.json(emptyCart);
    }

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

    // Purge expired first (mostly no-op but consistent)
    await purgeExpiredForUserId(userId, getExpiryCutoff(req));

    // Get cart
    let cart = await NewCart.findOne({ userId });
    if (!cart) {
      cart = await findCartByUserWithMigration(req.user);
    }
    if (!cart) {
      console.log('ℹ️ No cart document found; returning empty cart response');
      return res.json({
        _id: null,
        userId,
        items: [],
        cartTotal: 0,
        cartCount: 0,
        lastUpdated: new Date()
      });
    }

    // NOTE: No stock restoration needed since we don't decrement stock on add to cart
    // Stock is only decremented when orders are actually completed
    console.log('🧹 Clearing cart - no stock changes needed (stock decrements only on order completion)');

    // Clear cart then delete document for truly empty state
    await cart.clearCart();
    try { await NewCart.deleteOne({ _id: cart._id }); } catch {}

    const emptyCart = {
      _id: null,
      userId: cart.userId,
      items: [],
      cartTotal: 0,
      cartCount: 0,
      lastUpdated: new Date()
    };

    console.log(`✅ Cart cleared and document deleted`);
    res.json(emptyCart);

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

  await purgeExpiredForUserId(userId, getExpiryCutoff(req));
    const cart = await NewCart.findOne({ userId });
    const count = cart ? cart.cartCount : 0;

    console.log(`📊 Cart count for user ${userId}: ${count}`);
    res.json({ count });

  } catch (error) {
    console.error('❌ Error getting cart count:', error);
    res.status(500).json({ error: 'Failed to get cart count' });
  }
};