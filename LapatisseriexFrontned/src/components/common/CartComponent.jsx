import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  FaTrash, 
  FaMapMarkerAlt, 
  FaTag, 
  FaShoppingCart, 
  FaExclamationTriangle,
  FaPlus,
  FaMinus 
} from 'react-icons/fa';
import { Trash2, ShoppingCart, Plus, Minus, AlertTriangle } from 'lucide-react';
import { 
  fetchCart, 
  updateCartQuantity, 
  removeFromCart, 
  clearCart 
} from '../../redux/cartSlice';
import { useAuth } from '../../hooks/useAuth';

const CartComponent = ({ showHeader = true, showActions = true, isProfileTab = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redux state
  const {
    items: cartItems,
    cartTotal,
    cartCount,
    isLoading,
    error: cartError
  } = useSelector(state => state.cart);

  const [stockError, setStockError] = useState('');

  useEffect(() => {
    if (user) {
      dispatch(fetchCart());
    }
  }, [dispatch, user]);

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    
    dispatch(updateCartQuantity({ productId, quantity: newQuantity }));
  };

  const handleRemoveItem = (productId) => {
    dispatch(removeFromCart(productId));
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      dispatch(clearCart());
    }
  };

  const handleCheckout = () => {
    navigate('/payment');
  };

  const getItemAvailability = (item) => {
    try {
      const prod = item.productDetails;
      if (!prod) {
        return { unavailable: false, tracks: false, stock: Infinity, variantIndex: 0 };
      }
      
      const vi = Number.isInteger(item?.productDetails?.variantIndex) ? item.productDetails.variantIndex : 0;
      const variant = prod?.variants?.[vi];
      if (!variant) {
        return { unavailable: false, tracks: false, stock: Infinity, variantIndex: vi };
      }

      return {
        unavailable: !variant.available,
        tracks: variant.trackQuantity,
        stock: variant.stock || 0,
        variantIndex: vi
      };
    } catch (error) {
      console.error('Error getting item availability:', error);
      return { unavailable: false, tracks: false, stock: Infinity, variantIndex: 0 };
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
        <p className="mt-4 text-gray-600">Loading your cart...</p>
      </div>
    );
  }

  if (cartError) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">Error loading cart: {cartError}</p>
        <button 
          onClick={() => dispatch(fetchCart())}
          className="bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Your cart is empty</h3>
        <p className="text-gray-500 mb-6">Add some delicious items to your cart!</p>
        {!isProfileTab && (
          <Link 
            to="/products" 
            className="inline-flex items-center bg-rose-500 text-white px-6 py-3 rounded-lg hover:bg-rose-600 transition-colors"
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Start Shopping
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className={`${isProfileTab ? '' : 'container mx-auto px-4 py-8'}`}>
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
          <div className="text-sm text-gray-600">
            {cartCount} {cartCount === 1 ? 'item' : 'items'}
          </div>
        </div>
      )}

      {stockError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            {stockError}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {cartItems.map((item) => {
          const availability = getItemAvailability(item);
          const isUnavailable = availability.unavailable;
          const hasStockIssue = availability.tracks && item.quantity > availability.stock;

          return (
            <div 
              key={item.id || item.productId} 
              className={`bg-white border rounded-lg p-4 ${isUnavailable || hasStockIssue ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}
            >
              <div className="flex items-center space-x-4">
                {/* Product Image */}
                <div className="w-20 h-20 flex-shrink-0">
                  <img
                    src={item.image || '/placeholder-image.jpg'}
                    alt={item.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>

                {/* Product Details */}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  <p className="text-gray-600">₹{item.price}</p>
                  
                  {isUnavailable && (
                    <p className="text-red-600 text-sm font-medium">Currently unavailable</p>
                  )}
                  {hasStockIssue && (
                    <p className="text-red-600 text-sm">
                      Only {availability.stock} available (you have {item.quantity})
                    </p>
                  )}
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                    disabled={isLoading}
                    className="p-1 rounded-full border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  
                  <span className="w-12 text-center font-semibold">{item.quantity}</span>
                  
                  <button
                    onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                    disabled={isLoading || (availability.tracks && item.quantity >= availability.stock)}
                    className="p-1 rounded-full border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Item Total */}
                <div className="text-right">
                  <p className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</p>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => handleRemoveItem(item.productId)}
                  disabled={isLoading}
                  className="text-red-500 hover:text-red-700 p-2 disabled:opacity-50"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cart Summary */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold">Total:</span>
          <span className="text-2xl font-bold text-rose-600">₹{cartTotal?.toFixed(2) || '0.00'}</span>
        </div>

        {showActions && (
          <div className="flex gap-4">
            <button
              onClick={handleClearCart}
              disabled={isLoading}
              className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
            >
              Clear Cart
            </button>
            
            <button
              onClick={handleCheckout}
              disabled={isLoading || cartItems.some(item => getItemAvailability(item).unavailable)}
              className="flex-1 bg-rose-500 text-white py-3 px-4 rounded-lg hover:bg-rose-600 disabled:opacity-50 transition-colors"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartComponent;