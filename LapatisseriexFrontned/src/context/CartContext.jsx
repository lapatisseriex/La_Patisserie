import { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext/AuthContext';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user, token, toggleAuthPanel } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
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

  // Helper function to make API calls
  const apiCall = async (url, options = {}) => {
    // Get base URL and ensure it doesn't end with /api to avoid duplication
    let baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    if (baseUrl.endsWith('/api')) {
      baseUrl = baseUrl.slice(0, -4); // Remove trailing /api
    }
    const fullUrl = `${baseUrl}${url}`;
    const response = await fetch(fullUrl, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API call failed');
    }
    
    return data;
  };

  // Fetch cart from API
  const fetchCart = useCallback(async () => {
    if (!user || !token) {
      setCartItems([]);
      setCartCount(0);
      setCartTotal(0);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await apiCall('/api/cart');
      
      if (response.success) {
        const { items, itemCount, totalQuantity, subtotal } = response.data;
        setCartItems(items);
        setCartCount(itemCount);
        setCartTotal(subtotal);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError(err.message);
      // Fallback to empty cart on error
      setCartItems([]);
      setCartCount(0);
      setCartTotal(0);
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  // Load cart when user changes
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Calculate cart totals when items change
  useEffect(() => {
    const count = cartItems.reduce((total, item) => total + item.quantity, 0);
    let total = cartItems.reduce((total, item) => {
      const price = item.product?.price || item.productSnapshot?.price || 0;
      return total + (price * item.quantity);
    }, 0);
    
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
  }, [cartItems, appliedCoupon]);

  // Add item to cart
  const addToCart = async (product, quantity = 1, options = {}) => {
    if (!user || !token) {
      const error = 'Please login to add items to cart';
      setError(error);
      // Open authentication panel
      toggleAuthPanel();
      throw new Error(error);
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await apiCall('/api/cart', {
        method: 'POST',
        body: JSON.stringify({
          productId: product._id,
          quantity,
        }),
      });

      if (response.success) {
        // Update local state with new cart data
        const { cart } = response.data;
        setCartItems(cart.items);
        setCartCount(cart.itemCount);
        setCartTotal(cart.subtotal);
      } else {
        throw new Error(response.message || 'Failed to add to cart');
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      setError(err.message);
      throw err; // Re-throw so UI can handle it
    } finally {
      setLoading(false);
    }
  };

  // Get quantity of specific product in cart
  const getProductQuantity = (productId) => {
    const item = cartItems.find(item => 
      (item.product?._id === productId) || 
      (item._id === productId) || 
      (item.id === productId)
    );
    return item ? item.quantity : 0;
  };

  // Update item quantity
  const updateQuantity = async (itemId, quantity) => {
    if (!user || !token) {
      setError('Please login to update cart');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiCall(`/api/cart/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
      });

      if (response.success) {
        // Update local state with new cart data
        const { cart } = response.data;
        setCartItems(cart.items);
        setCartCount(cart.itemCount);
        setCartTotal(cart.subtotal);
      }
    } catch (err) {
      console.error('Error updating quantity:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update product quantity directly (for backward compatibility)
  const updateProductQuantity = async (productId, quantity) => {
    // Find the cart item by product ID
    const item = cartItems.find(item => 
      (item.product?._id === productId) || 
      (item._id === productId) || 
      (item.id === productId)
    );
    
    if (item) {
      if (quantity <= 0) {
        await removeFromCart(item._id);
      } else {
        await updateQuantity(item._id, quantity);
      }
    }
  };

  // Remove item from cart
  const removeFromCart = async (itemId) => {
    if (!user || !token) {
      setError('Please login to remove items from cart');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiCall(`/api/cart/${itemId}`, {
        method: 'DELETE',
      });

      if (response.success) {
        // Update local state with new cart data
        setCartItems(response.data.items);
        setCartCount(response.data.itemCount);
        setCartTotal(response.data.subtotal);
      }
    } catch (err) {
      console.error('Error removing from cart:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    if (!user || !token) {
      setCartItems([]);
      setAppliedCoupon(null);
      setCouponDiscount(0);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiCall('/api/cart', {
        method: 'DELETE',
      });

      if (response.success) {
        setCartItems([]);
        setCartCount(0);
        setCartTotal(0);
        setAppliedCoupon(null);
        setCouponDiscount(0);
      }
    } catch (err) {
      console.error('Error clearing cart:', err);
      setError(err.message);
    } finally {
      setLoading(false);
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
      cartTotal,
      cartCount,
      addToCart,
      removeFromCart,
      updateQuantity,
      updateProductQuantity,
      getProductQuantity,
      clearCart,
      applyCoupon,
      removeCoupon,
      appliedCoupon,
      couponDiscount,
      availableCoupons,
      loading,
      error,
      fetchCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);





