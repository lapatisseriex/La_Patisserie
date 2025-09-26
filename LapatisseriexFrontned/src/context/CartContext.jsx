import { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import cartService from '../services/cartService.js';
import { useAuth } from './AuthContext/AuthContext.jsx';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [guestCartItems, setGuestCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [cartInitialized, setCartInitialized] = useState(false);
  const { user } = useAuth();
  
  // Local storage key for guest cart
  const GUEST_CART_KEY = 'lapatisserie_guest_cart';
  
  // Local storage helper functions
  const saveGuestCartToStorage = (items) => {
    try {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
      console.log('💾 Guest cart saved to localStorage:', items.length, 'items');
    } catch (error) {
      console.error('❌ Failed to save guest cart to localStorage:', error);
    }
  };

  const loadGuestCartFromStorage = () => {
    try {
      const stored = localStorage.getItem(GUEST_CART_KEY);
      if (stored) {
        const items = JSON.parse(stored);
        console.log('📂 Guest cart loaded from localStorage:', items.length, 'items');
        return items;
      }
    } catch (error) {
      console.error('❌ Failed to load guest cart from localStorage:', error);
    }
    return [];
  };

  const clearGuestCartFromStorage = () => {
    try {
      localStorage.removeItem(GUEST_CART_KEY);
      console.log('🗑️ Guest cart cleared from localStorage');
    } catch (error) {
      console.error('❌ Failed to clear guest cart from localStorage:', error);
    }
  };

  // Get current cart items (guest or authenticated)
  const getCurrentCartItems = useCallback(() => {
    return user ? cartItems : guestCartItems;
  }, [user, cartItems, guestCartItems]);
  
  // Available coupons (in a real app, these would come from an API)
  const availableCoupons = {
    'SWEET10': {
      discount: 10,
      type: 'percent',
      minOrder: 500
    },
    'WELCOME20': {
      discount: 20,
      type: 'percent',
      minOrder: 1000
    },
    'FLAT100': {
      discount: 100,
      type: 'fixed',
      minOrder: 1000
    }
  };

  // Calculate cart total and count whenever cart items change
  useEffect(() => {
    const currentItems = getCurrentCartItems();
    const count = currentItems.reduce((total, item) => total + item.quantity, 0);
    let total = currentItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    // Apply coupon if any
    if (appliedCoupon) {
      const coupon = availableCoupons[appliedCoupon];
      if (coupon && total >= coupon.minOrder) {
        if (coupon.type === 'percent') {
          const discount = (total * coupon.discount) / 100;
          setCouponDiscount(discount);
          total -= discount;
        } else if (coupon.type === 'fixed') {
          setCouponDiscount(coupon.discount);
          total -= coupon.discount;
        }
      } else {
        // Reset coupon if minimum order value not met
        setAppliedCoupon(null);
        setCouponDiscount(0);
      }
    }
    
    setCartTotal(total);
    setCartCount(count);
  }, [cartItems, guestCartItems, appliedCoupon, getCurrentCartItems]);

  // Load cart from backend
  const loadCart = useCallback(async () => {
    console.log('🔄 loadCart called, user:', !!user);
    if (!user) {
      console.log('❌ No user, clearing cart items');
      setCartItems([]);
      return;
    }
    
    try {
      setLoading(true);
      const response = await cartService.getCart();
      // Backend returns: { success: true, data: { items: [...], itemCount: ..., etc } }
      const backendCart = response.data || response;
      
      // Transform backend cart items to frontend format
      const rawItems = backendCart.items || [];
      console.log('📦 Loading cart: found', rawItems.length, 'items from backend');
      console.log('📦 Raw cart items from database:', JSON.stringify(rawItems, null, 2));
      
      const transformedItems = rawItems.map((item, index) => {
        // Handle MongoDB ObjectId format: { "$oid": "..." } or plain string
        const itemId = typeof item._id === 'string' ? item._id : item._id?.$oid || item._id;
        const productId = typeof item.product === 'string' ? item.product : item.product?.$oid || item.product;
        
        console.log(`📦 Transforming item ${index + 1}:`, {
          originalItem: item,
          itemId,
          productId,
          quantity: item.quantity,
          productName: item.productSnapshot?.name
        });
        
        const transformedItem = {
          _id: itemId,
          id: itemId,
          name: item.productSnapshot?.name || 'Unknown Product',
          price: item.productSnapshot?.price || 0,
          image: item.productSnapshot?.image || '',
          quantity: item.quantity || 0,
          itemTotal: (item.productSnapshot?.price || 0) * (item.quantity || 0),
          product: productId, // store product reference - this is what getProductQuantity matches against
          productSnapshot: item.productSnapshot // keep original snapshot
        };
        
        console.log(`📦 Transformed item ${index + 1}:`, transformedItem);
        return transformedItem;
      });
      
      console.log('📦 Transformed items:', transformedItems);
      console.log('📦 Setting cart items to state...');
      setCartItems(transformedItems);
      console.log('✅ Cart loaded from backend:', transformedItems.length, 'items');
      
      console.log('🎯 PRODUCTS THAT SHOULD SHOW QUANTITY SELECTOR:');
      transformedItems.forEach((item, index) => {
        console.log(`   ${index + 1}. "${item.name}" (Product ID: ${item.product}) - Quantity: ${item.quantity}`);
        console.log(`       → Any product with ID "${item.product}" should show quantity selector with ${item.quantity}`);
      });
      
      if (transformedItems.length === 0) {
        console.log('   ❌ NO ITEMS IN CART - All products should show "Add" button');
      }
    } catch (error) {
      console.error('❌ Error loading cart:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      setCartItems([]);
    } finally {
      setLoading(false);
      setCartInitialized(true);
    }
  }, [user]);

  // Load cart when user authentication changes
  useEffect(() => {
    console.log('👤 User state changed - authenticated:', !!user, 'uid:', user?.uid);
    if (user?.uid) {
      console.log('👤 User authenticated, checking for guest cart to merge...');
      
      // Check if there are guest cart items to merge
      if (guestCartItems.length > 0) {
        console.log('🔄 Found guest cart items, merging with database...');
        mergeGuestCartWithDatabase();
      } else {
        console.log('👤 No guest items, loading database cart...');
        loadCart().catch(err => console.error('❌ loadCart failed:', err));
      }
    } else {
      console.log('👤 No authenticated user, clearing database cart');
      setCartItems([]);
      setCartInitialized(false);
    }
  }, [user?.uid, guestCartItems.length]); // Depend on user.uid and guest cart length

  // Initialize guest cart from localStorage on component mount
  useEffect(() => {
    const storedGuestCart = loadGuestCartFromStorage();
    setGuestCartItems(storedGuestCart);
    console.log('🎯 Guest cart initialized with', storedGuestCart.length, 'items');
  }, []);

  // Debug cartItems changes
  useEffect(() => {
    console.log('🛒 CartItems updated:', cartItems.length, 'items:', cartItems);
    console.log('🛒 GuestCartItems updated:', guestCartItems.length, 'items:', guestCartItems);
  }, [cartItems, guestCartItems]);

  // Merge guest cart with database cart when user logs in
  const mergeGuestCartWithDatabase = async () => {
    if (guestCartItems.length === 0) {
      console.log('👤 No guest cart items to merge');
      return;
    }

    console.log('🔄 Merging guest cart with database cart...', guestCartItems.length, 'guest items');
    
    try {
      setLoading(true);
      
      // Add each guest cart item to database cart
      for (const guestItem of guestCartItems) {
        try {
          console.log('➕ Adding guest item to database:', guestItem.name);
          await cartService.addToCart(guestItem.product, guestItem.quantity);
        } catch (error) {
          console.error('❌ Failed to merge guest item:', guestItem.name, error);
          // Continue with other items even if one fails
        }
      }
      
      // Clear guest cart after successful merge
      setGuestCartItems([]);
      clearGuestCartFromStorage();
      
      // Reload cart from database to get updated state
      await loadCart();
      
      console.log('✅ Guest cart successfully merged with database');
      
    } catch (error) {
      console.error('❌ Error merging guest cart:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add item to cart (works for both guest and authenticated users)
  const addToCart = async (product, quantity = 1) => {
    console.log('🛒 Adding to cart:', { 
      productId: product._id, 
      quantity, 
      isAuthenticated: !!user 
    });

    // Create cart item object
    const newItem = {
      _id: Date.now().toString(), // Temporary ID
      id: Date.now().toString(),
      name: product.name,
      price: product.variants?.[0]?.price || product.price || 0,
      image: product.image || product.images?.[0],
      quantity: quantity,
      itemTotal: (product.variants?.[0]?.price || product.price || 0) * quantity,
      product: product._id,
      productSnapshot: {
        name: product.name,
        price: product.variants?.[0]?.price || product.price || 0,
        image: product.image || product.images?.[0],
        category: product.category?.name || product.category // Store category for recommendations
      }
    };

    if (user) {
      // AUTHENTICATED USER: Store in database
      try {
        setLoading(true);
        console.log('🛒 Adding to database cart via API:', { productId: product._id, quantity });
      
        // Call backend API to add item
        const response = await cartService.addToCart(product._id, quantity);
        console.log('✅ Item added to database cart');
        
        // Update local state optimistically
        const existingItemIndex = cartItems.findIndex(item => item.product === product._id);
        if (existingItemIndex >= 0) {
          // Update existing item quantity
          const updatedItems = [...cartItems];
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity + quantity,
            itemTotal: updatedItems[existingItemIndex].price * (updatedItems[existingItemIndex].quantity + quantity)
          };
          setCartItems(updatedItems);
          console.log('🔄 Updated existing item in database cart');
        } else {
          // Add new item
          setCartItems(prev => [...prev, newItem]);
          console.log('➕ Added new item to database cart');
        }
        
        return response;
        
      } catch (error) {
        console.error('❌ Error adding to database cart:', error);
        throw error;
      } finally {
        setLoading(false);
      }
      
    } else {
      // GUEST USER: Store in local storage
      try {
        console.log('💾 Adding item to guest cart (localStorage)');
        
        // Check if item already exists in guest cart
        const existingItemIndex = guestCartItems.findIndex(item => item.product === product._id);
        let updatedGuestItems;
        
        if (existingItemIndex >= 0) {
          // Update existing item quantity
          updatedGuestItems = [...guestCartItems];
          updatedGuestItems[existingItemIndex] = {
            ...updatedGuestItems[existingItemIndex],
            quantity: updatedGuestItems[existingItemIndex].quantity + quantity,
            itemTotal: updatedGuestItems[existingItemIndex].price * (updatedGuestItems[existingItemIndex].quantity + quantity)
          };
          console.log('🔄 Updated existing item in guest cart');
        } else {
          // Add new item
          updatedGuestItems = [...guestCartItems, newItem];
          console.log('➕ Added new item to guest cart');
        }
        
        // Update state and save to localStorage
        setGuestCartItems(updatedGuestItems);
        saveGuestCartToStorage(updatedGuestItems);
        
        console.log('✅ Guest cart updated:', updatedGuestItems.length, 'items');
        return { success: true }; // Mock response for consistency
        
      } catch (error) {
        console.error('❌ Error adding to guest cart:', error);
        throw error;
      }
    }
  };

  // Get quantity of specific product in cart (works for both guest and authenticated)
  const getProductQuantity = (productId) => {
    console.log(`🔍 getProductQuantity called for productId: "${productId}", isAuthenticated: ${!!user}`);
    
    // Get current cart items (guest or authenticated)
    const currentItems = getCurrentCartItems();
    
    if (!productId || currentItems.length === 0) {
      console.log(`🔍 getProductQuantity(${productId}): returning 0 (no productId or empty cart, items.length=${currentItems.length})`);
      return 0;
    }

    console.log(`🔍 Searching in ${currentItems.length} ${user ? 'database' : 'guest'} cart items for product "${productId}"`);
    currentItems.forEach((item, index) => {
      console.log(`   Cart item ${index + 1}: product="${item.product}", name="${item.name}", quantity=${item.quantity}`);
    });

    const item = currentItems.find(item => {
      const itemId = item._id || item.id;
      const productRef = item.product;
      
      // Handle both string and ObjectId formats
      const productRefStr = typeof productRef === 'object' ? productRef.toString() : String(productRef || '');
      const productIdStr = typeof productId === 'object' ? productId.toString() : String(productId || '');
      
      const matches = productRefStr === productIdStr || String(itemId || '') === productIdStr;
      
      if (matches) {
        console.log(`   ✅ MATCH FOUND: productRef="${productRefStr}" === productId="${productIdStr}"`);
      } else {
        console.log(`   ❌ No match: productRef="${productRefStr}" !== productId="${productIdStr}"`);
      }
      
      return matches;
    });
    
    const quantity = item ? item.quantity : 0;
    console.log(`🔍 getProductQuantity(${productId}): RESULT = ${quantity} (found item: ${!!item})`);
    
    if (quantity > 0) {
      console.log(`🎯 Product "${productId}" should show QUANTITY SELECTOR with ${quantity}`);
    } else {
      console.log(`🎯 Product "${productId}" should show ADD BUTTON`);
    }
    
    return quantity;
  };

  // Update product quantity by product ID (works for both guest and authenticated users)
  const updateProductQuantityByProductId = async (productId, quantity) => {
    console.log(`🔄 updateProductQuantityByProductId called: productId=${productId}, quantity=${quantity}, isAuthenticated=${!!user}`);
    
    // Get current cart items and find the item
    const currentItems = getCurrentCartItems();
    const cartItem = currentItems.find(item => {
      const itemId = item._id || item.id;
      const productRef = item.product;
      
      // Handle both string and ObjectId formats
      const productRefStr = typeof productRef === 'object' ? productRef.toString() : String(productRef || '');
      const productIdStr = typeof productId === 'object' ? productId.toString() : String(productId || '');
      
      return productRefStr === productIdStr || String(itemId || '') === productIdStr;
    });
    
    if (!cartItem) {
      console.error(`❌ No cart item found for product ID: ${productId} in ${currentItems.length} ${user ? 'database' : 'guest'} cart items`);
      console.error(`❌ Available cart items:`, currentItems.map(item => ({ _id: item._id, product: item.product, name: item.name })));
      return;
    }
    
    console.log(`🔄 Found cart item: ${cartItem.name} (itemId: ${cartItem._id})`);
    
    if (user) {
      // AUTHENTICATED USER: Update in database
      return updateProductQuantity(cartItem._id, quantity);
    } else {
      // GUEST USER: Update in localStorage
      return updateGuestProductQuantity(productId, quantity);
    }
  };

  // Update product quantity directly (by cart item ID)
  const updateProductQuantity = async (itemId, quantity) => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      if (quantity <= 0) {
        await removeFromCart(itemId);
        return;
      }
      
      console.log('🔄 Updating cart item quantity:', { itemId, quantity });
      
      // Optimistically update local state first
      setCartItems(prev => prev.map(item => 
        item._id === itemId 
          ? { ...item, quantity, itemTotal: item.price * quantity }
          : item
      ));
      
      // Then update backend
      await cartService.updateCartItem(itemId, quantity);
      console.log('✅ Cart item quantity updated successfully');
      
      // Note: No automatic cart refresh to avoid overwriting optimistic updates
    } catch (error) {
      console.error('❌ Error updating cart quantity:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update guest cart product quantity
  const updateGuestProductQuantity = (productId, quantity) => {
    console.log(`🔄 updateGuestProductQuantity: productId=${productId}, quantity=${quantity}`);
    
    if (quantity <= 0) {
      // Remove item from guest cart
      const updatedItems = guestCartItems.filter(item => item.product !== productId);
      setGuestCartItems(updatedItems);
      saveGuestCartToStorage(updatedItems);
      console.log('🗑️ Removed item from guest cart');
    } else {
      // Update item quantity
      const updatedItems = guestCartItems.map(item => 
        item.product === productId 
          ? { ...item, quantity, itemTotal: item.price * quantity }
          : item
      );
      setGuestCartItems(updatedItems);
      saveGuestCartToStorage(updatedItems);
      console.log('🔄 Updated guest cart item quantity');
    }
  };

  // Update quantity by cart item ID (for Cart page usage)
  const updateQuantity = async (itemId, quantity) => {
    console.log(`🔄 updateQuantity called with itemId: ${itemId}, quantity: ${quantity}`);
    return updateProductQuantity(itemId, quantity);
  };

  // Remove item from cart (works for both guest and authenticated users)
  const removeFromCart = async (itemId) => {
    console.log(`🗑️ removeFromCart called with itemId: ${itemId}, isAuthenticated: ${!!user}`);
    
    if (user) {
      // AUTHENTICATED USER: Remove from database
      try {
        setLoading(true);
        
        // Optimistically remove item from local state first
        setCartItems(prev => prev.filter(item => item._id !== itemId));
        console.log('🗑️ Optimistically removed item from database cart');
        
        // Then remove from backend
        console.log('🗑️ Calling cartService.removeFromCart with itemId:', itemId);
        await cartService.removeFromCart(itemId);
        console.log('✅ Item removed from backend successfully');
        
      } catch (error) {
        console.error('❌ Error removing from database cart:', error);
        throw error;
      } finally {
        setLoading(false);
      }
      
    } else {
      // GUEST USER: Remove from localStorage
      try {
        console.log('🗑️ Removing item from guest cart');
        const updatedItems = guestCartItems.filter(item => item._id !== itemId);
        setGuestCartItems(updatedItems);
        saveGuestCartToStorage(updatedItems);
        console.log('✅ Item removed from guest cart');
      } catch (error) {
        console.error('❌ Error removing from guest cart:', error);
        throw error;
      }
    }
  };



  // Clear cart (works for both guest and authenticated users)
  const clearCart = async () => {
    console.log('🗑️ Clearing entire cart, isAuthenticated:', !!user);
    
    if (user) {
      // AUTHENTICATED USER: Clear database cart
      try {
        setLoading(true);
        console.log('🗑️ Clearing database cart');
        await cartService.clearCart();
        
        // Clear local state as well
        setCartItems([]);
        setAppliedCoupon(null);
        setCouponDiscount(0);
      } catch (error) {
        console.error('❌ Error clearing database cart:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    } else {
      // GUEST USER: Clear localStorage cart
      try {
        console.log('🗑️ Clearing guest cart');
        setGuestCartItems([]);
        clearGuestCartFromStorage();
        setAppliedCoupon(null);
        setCouponDiscount(0);
        console.log('✅ Guest cart cleared');
      } catch (error) {
        console.error('❌ Error clearing guest cart:', error);
        throw error;
      }
    }
  };

  // Apply coupon code
  const applyCoupon = (couponCode) => {
    const coupon = availableCoupons[couponCode.toUpperCase()];
    
    if (!coupon) {
      return { success: false, message: 'Invalid coupon code' };
    }
    
    if (cartTotal < coupon.minOrder) {
      return { 
        success: false, 
        message: `Minimum order value of ₹${coupon.minOrder} required for this coupon` 
      };
    }
    
    setAppliedCoupon(couponCode.toUpperCase());
    return { 
      success: true, 
      message: coupon.type === 'percent' 
        ? `${coupon.discount}% discount applied!` 
        : `₹${coupon.discount} discount applied!` 
    };
  };

  // Remove coupon
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      guestCartItems, // For debugging and component access
      cartTotal,
      cartCount,
      loading,
      cartInitialized,
      addToCart,
      removeFromCart,
      updateQuantity,
      updateProductQuantity,
      updateProductQuantityByProductId,
      getProductQuantity,
      clearCart,
      loadCart,
      applyCoupon,
      removeCoupon,
      appliedCoupon,
      couponDiscount,
      availableCoupons
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);





