import React, { createContext, useContext, useState, useEffect } from 'react';
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

  // Load cart based on authentication status
  useEffect(() => {
    const loadCart = async () => {
      if (user && !dbCartLoaded) {
        // User is logged in, load from database
        try {
          setIsLoading(true);
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
          } else {
            setCartItems(dbCartItems);
          }
          
          setDbCartLoaded(true);
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
    console.log('🛒 CartContext: addToCart called', {
      product: product,
      productId: product._id,
      quantity: quantity,
      user: user ? 'logged in' : 'guest'
    });

    try {
      setIsLoading(true);

      if (user) {
        // User is logged in, add to database
        console.log('👤 User logged in, adding to database...');
        const updatedCart = await newCartService.addToCart(product._id, quantity);
        console.log('📦 Database cart response:', updatedCart);
        
        const dbCartItems = updatedCart.items.map(item => ({
          id: item._id,
          productId: item.productId,
          name: item.productDetails.name,
          price: item.productDetails.price,
          image: item.productDetails.image,
          quantity: item.quantity,
          addedAt: item.addedAt
        }));
        
        console.log('💾 Setting cart items to:', dbCartItems);
        setCartItems(dbCartItems);
      } else {
        // Guest user, add to localStorage
        console.log('👻 Guest user, adding to localStorage...');
        setCartItems(prevItems => {
          console.log('📋 Previous cart items:', prevItems);
          const existingItemIndex = prevItems.findIndex(item => item.productId === product._id);
          
          if (existingItemIndex !== -1) {
            // Update existing item quantity
            console.log('📝 Updating existing item at index:', existingItemIndex);
            const updatedItems = [...prevItems];
            updatedItems[existingItemIndex] = {
              ...updatedItems[existingItemIndex],
              quantity: updatedItems[existingItemIndex].quantity + quantity
            };
            console.log('✏️ Updated items:', updatedItems);
            return updatedItems;
          } else {
            // Add new item
            console.log('➕ Adding new item to cart');
            const newItems = [...prevItems, {
              id: Date.now().toString(),
              productId: product._id,
              name: product.name,
              price: product.price,
              image: product.image,
              quantity: quantity,
              addedAt: new Date().toISOString()
            }];
            console.log('🆕 New items array:', newItems);
            return newItems;
          }
        });
      }
      
      console.log('✅ CartContext: addToCart completed successfully');
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update item quantity
  const updateQuantity = async (productId, quantity) => {
    try {
      if (quantity <= 0) {
        await removeFromCart(productId);
        return;
      }

      if (user) {
        // Update in database
        const updatedCart = await newCartService.updateQuantity(productId, quantity);
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
        // Update in localStorage
        setCartItems(prevItems =>
          prevItems.map(item =>
            item.productId === productId
              ? { ...item, quantity }
              : item
          )
        );
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

  const value = {
    cartItems,
    cartCount,
    cartTotal,
    isLoading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getItemQuantity
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
