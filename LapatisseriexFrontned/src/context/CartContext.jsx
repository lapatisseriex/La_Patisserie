import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from './AuthContext/AuthContext';
import newCartService from '../services/newCartService';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dbCartLoaded, setDbCartLoaded] = useState(false);
  const { user } = useAuth();
  const updateTimeoutRef = useRef({});

  // Load cart based on authentication status
  const cartLoadedRef = useRef(false);
  const lastCartFetchTimestamp = useRef(0);
  const minimumFetchInterval = 3000; // 3 seconds

  useEffect(() => {
    const loadCart = async () => {
      // Prevent loading cart multiple times in a short interval
      const now = Date.now();
      const timeSinceLastFetch = now - lastCartFetchTimestamp.current;
      
      if (timeSinceLastFetch < minimumFetchInterval && cartLoadedRef.current) {
        console.log(`🛑 Skipping cart fetch - last fetch was ${timeSinceLastFetch}ms ago`);
        return;
      }

      if (user && !dbCartLoaded) {
        // User is logged in, load from database
        try {
          setIsLoading(true);
          lastCartFetchTimestamp.current = Date.now();
          
          // Try to get cart from cache first
          const cachedCart = localStorage.getItem('lapatisserie_cart_cache');
          const cachedTimestamp = localStorage.getItem('lapatisserie_cart_cache_timestamp');
          
          // Use cache if it exists and is less than 30 seconds old
          if (cachedCart && cachedTimestamp && (Date.now() - parseInt(cachedTimestamp, 10) < 30000)) {
            console.log('📦 Using cached cart data');
            const parsedCart = JSON.parse(cachedCart);
            setCartItems(parsedCart.items);
            setDbCartLoaded(true);
            setIsLoading(false);
            cartLoadedRef.current = true;
            return;
          }
          
          const dbCart = await newCartService.getCart();
          
          // Convert database cart format to local format
          const dbCartItems = dbCart.items.map(item => ({
            id: item._id,
            productId: item.productId,
            name: item.productDetails.name,
            price: item.productDetails.price,
            image: item.productDetails.image,
            quantity: item.quantity,
            addedAt: item.addedAt
          }));

          // Merge with any local cart items
          const localCart = getLocalCart();
          if (localCart.length > 0) {
            console.log('🔄 Merging local cart with database cart');
            // Merge local items with database cart
            await mergeLocalCartWithDatabase(localCart);
            // Clear local storage after merge
            localStorage.removeItem('lapatisserie_cart');
            // Fetch updated cart
            const updatedDbCart = await newCartService.getCart();
            const updatedCartItems = updatedDbCart.items.map(item => ({
              id: item._id,
              productId: item.productId,
              name: item.productDetails.name,
              price: item.productDetails.price,
              image: item.productDetails.image,
              quantity: item.quantity,
              addedAt: item.addedAt
            }));
            setCartItems(updatedCartItems);
            
            // Cache the cart
            localStorage.setItem('lapatisserie_cart_cache', JSON.stringify({
              items: updatedCartItems,
              total: updatedDbCart.cartTotal,
              count: updatedDbCart.cartCount
            }));
            localStorage.setItem('lapatisserie_cart_cache_timestamp', Date.now().toString());
          } else {
            setCartItems(dbCartItems);
            
            // Cache the cart
            localStorage.setItem('lapatisserie_cart_cache', JSON.stringify({
              items: dbCartItems,
              total: dbCart.cartTotal,
              count: dbCart.cartCount
            }));
            localStorage.setItem('lapatisserie_cart_cache_timestamp', Date.now().toString());
          }
          
          setDbCartLoaded(true);
          cartLoadedRef.current = true;
        } catch (error) {
          console.error('❌ Error loading cart from database:', error);
          // Fallback to localStorage if database fails
          loadLocalCart();
        } finally {
          setIsLoading(false);
        }
      } else if (!user) {
        // User not logged in, load from localStorage
        loadLocalCart();
        setDbCartLoaded(false);
        cartLoadedRef.current = true;
      }
    };

    loadCart();
  }, [user, dbCartLoaded]);

  const getLocalCart = () => {
    try {
      const storedCart = localStorage.getItem('lapatisserie_cart');
      return storedCart ? JSON.parse(storedCart) : [];
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      return [];
    }
  };

  const loadLocalCart = () => {
    const localCart = getLocalCart();
    setCartItems(localCart);
  };

  const saveLocalCart = (items) => {
    try {
      localStorage.setItem('lapatisserie_cart', JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  };

  const mergeLocalCartWithDatabase = async (localItems) => {
    for (const localItem of localItems) {
      try {
        await newCartService.addToCart(localItem.productId, localItem.quantity);
      } catch (error) {
        console.error('Error merging local cart item:', error);
      }
    }
  };

  // Save cart to localStorage for guests
  useEffect(() => {
    if (!user) {
      saveLocalCart(cartItems);
    }
  }, [cartItems, user]);

  // Add item to cart
  const addToCart = async (product, quantity = 1) => {
    try {
      setIsLoading(true);

      if (user) {
        // User is logged in, add to database
        const updatedCart = await newCartService.addToCart(product._id, quantity);
        
        const dbCartItems = updatedCart.items.map(item => ({
          id: item._id,
          productId: item.productId,
          name: item.productDetails.name,
          price: item.productDetails.price,
          image: item.productDetails.image,
          quantity: item.quantity,
          addedAt: item.addedAt
        }));
        
        setCartItems(dbCartItems);
      } else {
        // Guest user, add to localStorage
        setCartItems(prevItems => {
          const existingItemIndex = prevItems.findIndex(item => item.productId === product._id);
          
          if (existingItemIndex !== -1) {
            // Update existing item quantity
            const updatedItems = [...prevItems];
            updatedItems[existingItemIndex] = {
              ...updatedItems[existingItemIndex],
              quantity: updatedItems[existingItemIndex].quantity + quantity
            };
            return updatedItems;
          } else {
            // Add new item
            return [...prevItems, {
              id: Date.now().toString(),
              productId: product._id,
              name: product.name,
              price: product.price,
              image: product.image,
              quantity: quantity,
              addedAt: new Date().toISOString()
            }];
          }
        });
      }
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced database update function
  const debouncedDatabaseUpdate = useCallback((productId, quantity) => {
    // Clear existing timeout for this product
    if (updateTimeoutRef.current[productId]) {
      clearTimeout(updateTimeoutRef.current[productId]);
    }

    // Set new timeout
    updateTimeoutRef.current[productId] = setTimeout(async () => {
      try {
        await newCartService.updateQuantity(productId, quantity);
      } catch (error) {
        console.error('❌ Error updating quantity in database:', error);
      }
      delete updateTimeoutRef.current[productId];
    }, 300); // 300ms debounce
  }, []);

  // Update item quantity
  const updateQuantity = async (productId, quantity) => {
    try {
      if (quantity <= 0) {
        await removeFromCart(productId);
        return;
      }

      // Optimistic update - update UI immediately
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.productId === productId
            ? { ...item, quantity }
            : item
        )
      );

      if (user) {
        // Debounced database update
        debouncedDatabaseUpdate(productId, quantity);
      }
    } catch (error) {
      console.error('❌ Error updating quantity:', error);
      throw error;
    }
  };

  // Remove item from cart
  const removeFromCart = async (productId) => {
    try {
      if (user) {
        // Remove from database
        const updatedCart = await newCartService.removeFromCart(productId);
        const dbCartItems = updatedCart.items.map(item => ({
          id: item._id,
          productId: item.productId,
          name: item.productDetails.name,
          price: item.productDetails.price,
          image: item.productDetails.image,
          quantity: item.quantity,
          addedAt: item.addedAt
        }));
        setCartItems(dbCartItems);
      } else {
        // Remove from localStorage
        setCartItems(prevItems =>
          prevItems.filter(item => item.productId !== productId)
        );
      }
    } catch (error) {
      console.error('❌ Error removing from cart:', error);
      throw error;
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    try {
      if (user) {
        // Clear database cart
        await newCartService.clearCart();
      }
      // Clear local state and localStorage
      setCartItems([]);
    } catch (error) {
      console.error('❌ Error clearing cart:', error);
      throw error;
    }
  };

  // Get item quantity by product ID
  const getItemQuantity = (productId) => {
    const item = cartItems.find(item => item.productId === productId);
    return item ? item.quantity : 0;
  };

  // Calculate totals
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(updateTimeoutRef.current).forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
    };
  }, []);

  const value = useMemo(() => ({
    cartItems,
    cartCount,
    cartTotal,
    isLoading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getItemQuantity
  }), [cartItems, cartCount, cartTotal, isLoading, addToCart, updateQuantity, removeFromCart, clearCart, getItemQuantity]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
