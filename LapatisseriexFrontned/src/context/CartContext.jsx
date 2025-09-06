import { createContext, useState, useContext, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  
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
    const count = cartItems.reduce((total, item) => total + item.quantity, 0);
    let total = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    
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
  const addToCart = (product, quantity = 1, options = {}) => {
    setCartItems(prevItems => {
      // Check if item already exists in cart
      const existingItemIndex = prevItems.findIndex(item => 
        item.id === product.id && 
        JSON.stringify(item.options) === JSON.stringify(options)
      );
      
      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += quantity;
        return updatedItems;
      } else {
        // Add new item if it doesn't exist
        return [...prevItems, {
          ...product,
          quantity,
          options,
          itemTotal: product.price * quantity
        }];
      }
    });
  };

  // Remove item from cart
  const removeFromCart = (itemId, options = {}) => {
    setCartItems(prevItems => 
      prevItems.filter(item => 
        !(item.id === itemId && JSON.stringify(item.options) === JSON.stringify(options))
      )
    );
  };

  // Update item quantity
  const updateQuantity = (itemId, quantity, options = {}) => {
    if (quantity <= 0) {
      removeFromCart(itemId, options);
      return;
    }
    
    setCartItems(prevItems => 
      prevItems.map(item => 
        (item.id === itemId && JSON.stringify(item.options) === JSON.stringify(options))
          ? { ...item, quantity, itemTotal: item.price * quantity }
          : item
      )
    );
  };

  // Clear cart
  const clearCart = () => {
    setCartItems([]);
    setAppliedCoupon(null);
    setCouponDiscount(0);
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
      clearCart,
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
