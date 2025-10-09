import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAuth } from '../hooks/useAuth';
// (removed duplicate import of useFavorites)
import { useCart } from '../hooks/useCart';
import Profile from '../components/Auth/Profile/Profile';
import './ProfileStyles.css';
import { useFavorites } from '../context/FavoritesContext/FavoritesContext';
import { fetchFavorites } from '../redux/favoritesSlice';
import { 
  User, 
  Package, 
  ShoppingCart, 
  LogOut, 
  Crown,
  Settings,
  MapPin,
  Lock,
  Truck,
  Heart,
  CreditCard,
  Bell,
  Eye,
  Edit3,
  MoreVertical
} from 'lucide-react';
import ProductCard from '../components/Products/ProductCard';
import OrderCard from '../components/Orders/OrderCard';

const ProfilePage = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('main');
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);
  const { favorites, loading: favLoading, error: favError } = useFavorites();
  
  // Add dispatch for manual favorites refresh
  const dispatch = useDispatch();
  const [favoritesRetryCount, setFavoritesRetryCount] = useState(0);
  
  // Force refresh favorites function
  const refreshFavorites = useCallback(() => {
    if (user) {
      console.log('Manually refreshing favorites...');
      dispatch(fetchFavorites());
      setFavoritesRetryCount(prev => prev + 1);
    }
  }, [dispatch, user]);
  const { 
    cartItems, 
    cartTotal, 
    cartCount, 
    isLoading: cartLoading, 
    error: cartError,
    updateQuantity,
    removeFromCart,
    addToCart
  } = useCart();
  
  // Debug logs for favorites and cart
  console.log('Profile Page - Favorites Debug:', {
    favorites,
    favLoading,
    favError,
    favoritesLength: favorites?.length,
    favoritesStructure: favorites?.slice(0, 1) // Show first item structure
  });
  
  console.log('Profile Page - Cart Debug:', {
    cartItems,
    cartLoading,
    cartError,
    cartCount,
    cartTotal,
    cartItemsStructure: cartItems?.slice(0, 1) // Show first item structure
  });

  // Cart quantity update handlers
  const handleQuantityIncrease = async (productId, currentQuantity, product) => {
    try {
      await updateQuantity(productId, currentQuantity + 1);
      console.log(`✅ Quantity increased for ${product.name || 'product'}`);
    } catch (error) {
      console.error('Error increasing quantity:', error);
      alert('Failed to update quantity. Please try again.');
    }
  };

  const handleQuantityDecrease = async (productId, currentQuantity, product) => {
    if (currentQuantity <= 1) {
      // Remove item if quantity would go to 0
      await handleRemoveFromCart(productId);
      return;
    }
    try {
      await updateQuantity(productId, currentQuantity - 1);
      console.log(`✅ Quantity decreased for ${product.name || 'product'}`);
    } catch (error) {
      console.error('Error decreasing quantity:', error);
      alert('Failed to update quantity. Please try again.');
    }
  };

  const handleRemoveFromCart = async (productId) => {
    if (!confirm('Are you sure you want to remove this item from your cart?')) {
      return;
    }
    try {
      await removeFromCart(productId);
      console.log('✅ Item removed from cart');
    } catch (error) {
      console.error('Error removing from cart:', error);
      alert('Failed to remove item. Please try again.');
    }
  };

  console.log('Profile Page - Cart Debug (final state):', {
    cartItems,
    cartLoading,
    cartError,
    cartCount,
    cartTotal,
    cartItemsLength: cartItems?.length,
    cartStructure: cartItems?.slice(0, 1)
  });
  
  // Log user data to check profile photo
  console.log('Profile Page - User data:', user);
  console.log('Profile Photo data:', user?.profilePhoto);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Fetch user orders
  const fetchUserOrders = async () => {
    if (!user) return;
    
    setOrdersLoading(true);
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/payments/orders/user`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data.orders || []);
      setOrdersError(null);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrdersError(error.message);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Handle navigation state to set active tab
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
      // Clear the state to prevent it from persisting
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location]);

  // Fetch orders when user changes or activeTab is orders
  useEffect(() => {
    if (user && activeTab === 'orders') {
      fetchUserOrders();
    }
  }, [user, activeTab]);



  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh]">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-black"></div>
          <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center">
            <img src="/images/logo.png" alt="Cake Logo" className="h-8 w-8 rounded-full bg-white" />
          </div>
        </div>
        <p className="mt-4 text-lg font-medium text-black">Loading your profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] pt-8 flex flex-col justify-center items-center">
        <h2 className="text-xl font-medium text-black mb-2">Please log in to view your account</h2>
        <p className="text-black">You need to be logged in to access this page.</p>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'orders', label: 'My Orders', icon: Package },
    { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'cart', label: 'Shopping Cart', icon: ShoppingCart },
    { id: 'favorites', label: 'Favorites', icon: Heart },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'main':
        return (
          <div className="space-y-3 md:space-y-6">
            <h3 className="text-xl md:text-2xl font-serif font-semibold text-black mb-3 md:mb-6 border-b border-gray-200 pb-2">My Account</h3>
            
            {/* Mobile view - Square buttons in 2 columns */}
            <div className="grid grid-cols-2 gap-3 md:hidden">
              {[
                { id: 'profile', label: 'My Profile', icon: User, color: 'bg-blue-50' },
                { id: 'orders', label: 'My Orders', icon: Package, color: 'bg-amber-50' },
                { id: 'addresses', label: 'Saved Addresses', icon: MapPin, color: 'bg-purple-50' },
                { id: 'security', label: 'Security', icon: Lock, color: 'bg-gray-50' },
                { id: 'cart', label: 'Shopping Cart', icon: ShoppingCart, color: 'bg-rose-50', count: cartCount },
                { id: 'favorites', label: 'Favorites', icon: Heart, color: 'bg-red-50', count: favorites?.length || 0 },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className="flex flex-col items-center justify-center p-3 border border-gray-200 bg-white hover:bg-gray-50 transition-all duration-300 shadow-sm no-scrollbar aspect-square relative"
                >
                  <div className={`p-3 rounded-full ${item.color} mb-2 relative`}>
                    <item.icon className="h-5 w-5 text-gray-700" />
                    {item.count > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {item.count > 99 ? '99+' : item.count}
                      </span>
                    )}
                  </div>
                  <h4 className="font-medium text-gray-900 text-center text-sm">{item.label}</h4>
                </button>
              ))}
            </div>

            {/* Desktop/tablet view - Rectangular bars */}
            <div className="hidden md:grid md:grid-cols-2 gap-4">
              {[
                { id: 'profile', label: 'My Profile', icon: User, description: 'View/Edit Profile', color: 'bg-blue-50' },
                { id: 'orders', label: 'My Orders', icon: Package, description: 'Track Orders, Returns, Buy Again', color: 'bg-amber-50' },
                { id: 'addresses', label: 'Saved Addresses', icon: MapPin, description: 'Manage your saved addresses', color: 'bg-purple-50' },
                { id: 'security', label: 'Security', icon: Lock, description: 'Manage security settings', color: 'bg-gray-50' },
                { id: 'cart', label: 'Shopping Cart', icon: ShoppingCart, description: 'View items in your cart', color: 'bg-rose-50', count: cartCount },
                { id: 'favorites', label: 'Favorites', icon: Heart, description: 'View your favorite products', color: 'bg-red-50', count: favorites?.length || 0 },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className="flex items-center justify-between gap-3 px-5 py-4 border border-gray-200 bg-white hover:bg-gray-50 transition-all duration-300 shadow-sm rounded-md relative"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${item.color} flex-shrink-0 relative`}>
                      <item.icon className="h-5 w-5 text-gray-700" />
                      {item.count > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {item.count > 99 ? '99+' : item.count}
                        </span>
                      )}
                    </div>
                    <div className="text-left">
                      <h4 className="font-medium text-gray-900">{item.label}</h4>
                      <p className="text-gray-500 text-sm">{item.description}</p>
                    </div>
                  </div>
                  <span className="text-gray-400">›</span>
                </button>
              ))}
            </div>
          </div>
        );
        
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="mb-4">
              <h3 className="text-2xl font-serif font-semibold text-black border-b border-gray-200 pb-2">Profile Information</h3>
            </div>
            <Profile />
          </div>
        );
      
      case 'orders':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-serif font-semibold text-black border-b border-gray-200 pb-2">My Orders</h3>
              <Link 
                to="/products" 
                className="px-5 py-2 bg-gradient-to-r from-rose-400 to-pink-500 text-white rounded-md hover:from-rose-500 hover:to-pink-600 transition-all duration-300 shadow-md font-medium"
              >
                Browse Products
              </Link>
            </div>
            
            {ordersLoading ? (
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-10 text-center shadow-md">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-200 shadow-md">
                  <Package className="h-10 w-10 text-gray-500 animate-pulse" />
                </div>
                <h4 className="text-xl font-serif font-medium text-black mb-3">Loading Orders...</h4>
                <p className="text-gray-600">Please wait while we fetch your order history</p>
              </div>
            ) : ordersError ? (
              <div className="bg-red-50 rounded-lg border border-red-200 p-6 text-center shadow-md">
                <h4 className="text-lg font-medium text-red-800 mb-2">Error Loading Orders</h4>
                <p className="text-red-600 mb-4">{ordersError}</p>
                <button 
                  onClick={fetchUserOrders}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-10 text-center shadow-md">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-200 shadow-md">
                  <Package className="h-10 w-10 text-gray-500" />
                </div>
                <h4 className="text-xl font-serif font-medium text-black mb-3">No Orders Yet</h4>
                <p className="text-gray-600 mb-6">Discover our delicious cakes and pastries to place your first order</p>
                <Link 
                  to="/products" 
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-rose-400 to-pink-500 text-white rounded-md hover:from-rose-500 hover:to-pink-600 transition-all duration-300 shadow-md hover:shadow-lg font-medium"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div>
                <div className="mb-4 text-sm text-gray-600">
                  {orders.length} order{orders.length !== 1 ? 's' : ''} found
                </div>
                <div className="grid gap-6 pt-4" style={{ paddingTop: '20px' }}>
                  {orders.map((order) => (
                    <OrderCard 
                      key={order._id} 
                      order={order}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'addresses':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xl font-semibold text-gray-900">Saved Addresses</h3>
              <button className="px-4 py-2 bg-gradient-to-r from-rose-400 to-pink-500 text-white rounded-none hover:from-rose-500 hover:to-pink-600 transition-all duration-300 flex items-center gap-2 shadow-md">
                <MapPin className="h-4 w-4" />
                Add New Address
              </button>
            </div>
            
            <div className="grid gap-4">
              {/* Current Delivery Location */}
              {user.location && (
                <div className="border-2 border-gray-200 rounded-none p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-gray-600" />
                      <span className="font-medium text-gray-900">Current Delivery Location</span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-none">Active</span>
                    </div>
                    <button className="text-gray-600 hover:text-black">
                      <Edit3 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-gray-600">
                    {(() => {
                      if (typeof user.location === 'object' && user.location.area) {
                        return `${user.location.area}, ${user.location.city} - ${user.location.pincode}`;
                      } else if (typeof user.location === 'string') {
                        return 'Location loading...';
                      }
                      return 'Location not specified';
                    })()}
                  </p>
                  {user.hostel && (
                    <p className="text-gray-500 text-sm mt-1">
                      Hostel: {typeof user.hostel === 'object' && user.hostel.name ? user.hostel.name : 
                               typeof user.hostel === 'string' ? 'Loading hostel info...' : 'Not specified'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Security Settings</h3>
            </div>
            
            <div className="space-y-4">
              {/* Phone Number Input */}
              <div className="border-2 border-gray-200 rounded-none p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Enter your phone number"
                  value={user.phone || ''}
                  onChange={(e) => {
                    // Handle phone number update
                    console.log('Phone number:', e.target.value);
                  }}
                />
              </div>

              {/* Change Password */}
              <div className="border-2 border-gray-200 rounded-none p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Lock className="h-5 w-5 text-gray-600" />
                      Password
                    </h4>
                    <p className="text-gray-600 text-sm mt-1">
                      Last updated: Never
                    </p>
                  </div>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-none hover:bg-gray-50 transition-colors">
                    Change Password
                  </button>
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="border-2 border-gray-200 rounded-none p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Eye className="h-5 w-5 text-gray-600" />
                      Privacy Settings
                    </h4>
                    <p className="text-gray-600 text-sm mt-1">
                      Manage your privacy preferences
                    </p>
                  </div>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-none hover:bg-gray-50 transition-colors">
                    Manage
                  </button>
                </div>
              </div>

              {/* Notifications */}
              <div className="border-2 border-gray-200 rounded-none p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Bell className="h-5 w-5 text-gray-600" />
                      Notifications
                    </h4>
                    <p className="text-gray-600 text-sm mt-1">
                      Control notification preferences
                    </p>
                  </div>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-none hover:bg-gray-50 transition-colors">
                    Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'cart':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-2xl font-serif font-semibold text-black border-b border-gray-200 pb-2">
                Shopping Cart
                {cartCount > 0 && (
                  <span className="ml-2 px-3 py-1 bg-rose-500 text-white text-sm rounded-full">
                    {cartCount} items
                  </span>
                )}
              </h3>
              <Link 
                to="/cart" 
                className="px-5 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors shadow-md font-medium"
              >
                View Full Cart
              </Link>
            </div>
            
            {cartLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading your cart...</p>
              </div>
            ) : cartError ? (
              <div className="bg-red-50 border border-red-200 p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-3 h-3 text-white" />
                  </div>
                  <p className="text-red-600 font-medium text-lg">Error loading cart</p>
                </div>
                <p className="text-red-600 text-sm mb-4">{cartError}</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => window.location.reload()} 
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                  >
                    Retry Loading
                  </button>
                  <Link 
                    to="/products" 
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            ) : cartItems.length === 0 ? (
              <div className="bg-gradient-to-br from-gray-50 to-rose-50 rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center shadow-sm">
                <div className="w-24 h-24 bg-gradient-to-br from-rose-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-lg">
                  <ShoppingCart className="h-12 w-12 text-rose-400" />
                </div>
                <h4 className="text-2xl font-serif font-medium text-black mb-4">Your Cart is Empty</h4>
                <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                  Discover our delicious collection of cakes, pastries, and sweet treats. 
                  Add your favorites to get started!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link 
                    to="/products" 
                    className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl hover:from-rose-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl font-medium text-lg"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Start Shopping
                  </Link>
                  <Link 
                    to="/favorites" 
                    className="inline-flex items-center justify-center px-8 py-4 bg-white text-rose-600 border-2 border-rose-200 rounded-xl hover:bg-rose-50 hover:border-rose-300 transition-all duration-300 shadow-md font-medium text-lg"
                  >
                    <Heart className="w-5 h-5 mr-2" />
                    View Favorites
                  </Link>
                </div>
                
                {/* Quick suggestions */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-3">Popular categories:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {['Cakes', 'Pastries', 'Desserts', 'Cookies'].map((category) => (
                      <Link
                        key={category}
                        to={`/products?category=${category.toLowerCase()}`}
                        className="px-4 py-2 bg-white text-gray-600 rounded-full text-sm hover:bg-rose-50 hover:text-rose-600 transition-colors border border-gray-200 hover:border-rose-200"
                      >
                        {category}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Enhanced Cart Summary */}
                <div className="bg-gradient-to-r from-rose-50 via-pink-50 to-rose-50 p-6 rounded-xl border border-rose-200 shadow-sm">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <h4 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-rose-500" />
                        Cart Summary
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Total Items:</span>
                          <span className="ml-2 font-medium text-gray-900">{cartCount}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="ml-2 font-semibold text-rose-600">₹{(parseFloat(cartTotal) || 0).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        *Taxes and delivery charges will be calculated at checkout
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link 
                        to="/cart" 
                        className="px-6 py-3 bg-white text-rose-600 border-2 border-rose-500 rounded-lg hover:bg-rose-50 transition-all duration-300 font-medium text-center shadow-sm hover:shadow-md"
                      >
                        View Full Cart
                      </Link>
                      <Link 
                        to="/checkout" 
                        className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg hover:from-rose-600 hover:to-pink-600 transition-all duration-300 font-medium text-center shadow-md hover:shadow-lg"
                      >
                        Proceed to Checkout
                      </Link>
                    </div>
                  </div>
                </div>
                
                {/* Cart Items - Full List Layout like Cart Page */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Package className="w-5 h-5 text-gray-600" />
                      Cart Items ({cartItems.length})
                    </h4>
                  </div>
                  
                  <div className="divide-y divide-gray-100">
                    {cartItems.map((item) => {
                      // Handle different data structures from cart
                      const product = item.productDetails || item.product || item;
                      const productId = item.productId || item.id || product._id;
                      const productName = product.name || item.name || 'Product';
                      const productPrice = parseFloat(product.price || item.price || 0) || 0;
                      const productImage = product.image?.url || product.image || item.image || product.images?.[0] || '/placeholder-image.jpg';
                      const quantity = parseInt(item.quantity) || 1;
                      
                      return (
                        <div key={productId} className="p-6 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start gap-4">
                            {/* Product Image */}
                            <div className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                              <img 
                                src={productImage} 
                                alt={productName} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = '/placeholder-image.jpg';
                                }}
                              />
                            </div>
                            
                            {/* Product Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h5 className="font-semibold text-gray-900 text-base md:text-lg mb-1">{productName}</h5>
                                  <p className="text-sm text-gray-600">Premium quality handcrafted item</p>
                                </div>
                                <button 
                                  onClick={() => handleRemoveFromCart(productId)}
                                  className="text-gray-400 hover:text-red-500 transition-colors p-1 disabled:opacity-50 disabled:cursor-not-allowed group"
                                  title="Remove from cart"
                                  disabled={cartLoading}
                                >
                                  {cartLoading ? (
                                    <div className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <Package className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                  )}
                                </button>
                              </div>
                              
                              {/* Mobile/Desktop Layout */}
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                {/* Quantity Controls */}
                                <div className="flex items-center gap-3">
                                  <span className="text-sm text-gray-600">Quantity:</span>
                                  <div className="flex items-center border border-gray-300 rounded-lg">
                                    <button 
                                      onClick={() => handleQuantityDecrease(productId, quantity, product)}
                                      className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      disabled={cartLoading}
                                    >
                                      {cartLoading ? (
                                        <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                      ) : (
                                        '-'
                                      )}
                                    </button>
                                    <span className="w-12 h-8 flex items-center justify-center text-sm font-medium border-x border-gray-300">
                                      {quantity}
                                    </span>
                                    <button 
                                      onClick={() => handleQuantityIncrease(productId, quantity, product)}
                                      className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      disabled={cartLoading}
                                    >
                                      {cartLoading ? (
                                        <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                      ) : (
                                        '+'
                                      )}
                                    </button>
                                  </div>
                                </div>
                                
                                {/* Price Information */}
                                <div className="flex items-center justify-between md:justify-end gap-6">
                                  <div className="text-right">
                                    <div className="text-sm text-gray-600">₹{productPrice > 0 ? productPrice.toFixed(2) : '0.00'} each</div>
                                    <div className="font-semibold text-lg text-gray-900">₹{((productPrice * quantity) || 0).toFixed(2)}</div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                                <Link 
                                  to={`/products/${productId}`}
                                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-center text-sm font-medium flex items-center justify-center gap-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  View Product
                                </Link>
                                <Link 
                                  to="/cart"
                                  className="flex-1 px-4 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors text-center text-sm font-medium flex items-center justify-center gap-2"
                                >
                                  <Edit3 className="w-4 h-4" />
                                  Edit in Cart
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Show more button if there are many items */}
                  {cartItems.length > 5 && (
                    <div className="p-6 border-t border-gray-200 text-center">
                      <Link 
                        to="/cart"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                      >
                        <MoreVertical className="w-4 h-4" />
                        View All {cartItems.length} Items in Cart
                      </Link>
                    </div>
                  )}
                </div>
                
                {/* Quick Actions */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link 
                      to="/cart"
                      className="flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                    >
                      <ShoppingCart className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
                      <span className="font-medium text-gray-900">Manage Cart</span>
                    </Link>
                    <Link 
                      to="/checkout"
                      className="flex items-center justify-center gap-3 p-4 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors group"
                    >
                      <CreditCard className="w-5 h-5 text-rose-600 group-hover:text-rose-700" />
                      <span className="font-medium text-rose-700">Checkout</span>
                    </Link>
                    <Link 
                      to="/products"
                      className="flex items-center justify-center gap-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
                    >
                      <Package className="w-5 h-5 text-blue-600 group-hover:text-blue-700" />
                      <span className="font-medium text-blue-700">Continue Shopping</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'favorites':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-2xl font-serif font-semibold text-black border-b border-gray-200 pb-2">
                My Favorites
                {favorites?.length > 0 && (
                  <span className="ml-2 px-3 py-1 bg-red-500 text-white text-sm rounded-full">
                    {favorites.length} items
                  </span>
                )}
              </h3>
              <Link 
                to="/favorites" 
                className="px-5 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors shadow-md font-medium"
              >
                View All Favorites
              </Link>
            </div>
            
            {favLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading your favorites...</p>
              </div>
            ) : favError ? (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <p className="text-red-600 font-medium">Error loading favorites</p>
                </div>
                <p className="text-red-600 text-sm mb-3">{favError}</p>
                <div className="flex gap-2">
                  <button 
                    onClick={refreshFavorites} 
                    disabled={favLoading}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm disabled:opacity-50"
                  >
                    {favLoading ? 'Loading...' : 'Retry Loading'}
                  </button>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
                  >
                    Reload Page
                  </button>
                </div>
              </div>
            ) : !favorites || favorites.length === 0 ? (
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-10 text-center shadow-md">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-200 shadow-md">
                  <Heart className="h-10 w-10 text-gray-500" />
                </div>
                <h4 className="text-xl font-serif font-medium text-black mb-3">No Favorites Yet</h4>
                <p className="text-gray-600 mb-6">Add your favorite cakes and pastries here</p>
                <Link 
                  to="/products" 
                  className="inline-flex items-center px-6 py-3 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors shadow-md font-medium"
                >
                  Browse Products
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Favorites Summary */}
                <div className="bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-lg border">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">Your Favorites</p>
                      <p className="text-sm text-gray-600">{favorites.length} favorite items</p>
                    </div>
                    <Link 
                      to="/favorites" 
                      className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors font-medium"
                    >
                      View All
                    </Link>
                  </div>
                </div>
                
                {/* Favorites Items Preview - Full Product Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {favorites.slice(0, 8).map((item) => {
                    // Handle different data structures from backend
                    const product = item.productDetails || item.product || item;
                    if (!product) {
                      console.warn('No product data found for favorite item:', item);
                      return null;
                    }
                    
                    return (
                      <div key={product._id || product.id || item.productId} className="relative">
                        {/* Favorite Badge */}
                        <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                          <Heart className="w-3 h-3 fill-current" />
                        </div>
                        
                        {/* Product Card */}
                        <ProductCard 
                          product={product} 
                          className="h-full"
                          compact={true}
                        />
                        
                        {/* Favorite-specific actions */}
                        <div className="mt-2 flex gap-2">
                          <Link 
                            to={`/products/${product._id || product.id}`} 
                            className="flex-1 text-center px-3 py-1 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200 transition-colors"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {favorites.length > 8 && (
                  <div className="text-center">
                    <Link 
                      to="/favorites" 
                      className="text-red-500 hover:text-red-600 font-medium"
                    >
                      View {favorites.length - 8} more favorites →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-4 sm:py-8 pt-8 sm:pt-12 px-3 sm:px-6 profile-page-container no-scrollbar" style={{ paddingTop: '80px' }}>
      <div className="bg-white shadow-xl rounded-2xl border border-gray-100 transition-all duration-300 hover:shadow-2xl no-scrollbar" style={{ position: 'relative', zIndex: 1 }}>
        {/* Header Section - Light Black and White Design */}
  <div className="bg-gradient-to-r from-gray-50 to-gray-100 relative overflow-visible">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-gray-200 to-transparent opacity-60"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-gradient-to-tr from-gray-300 to-gray-200 opacity-20"></div>
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('/images/cake-pattern.png')] bg-repeat"></div>
          
      
          
          <div className="relative p-4 md:p-10" style={{ zIndex: 10 }}>
            <div className="flex flex-row md:flex-row items-center justify-between gap-3 md:gap-6">
              <div className="flex items-center gap-3 md:gap-5">
                {/* Profile Image with Animated Border */}
                <div className="relative group">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-gray-400 via-gray-500 to-gray-400 opacity-60 animate-pulse-subtle"></div>
                  <div className="w-16 h-16 md:w-28 md:h-28 rounded-full overflow-hidden border-2 md:border-4 border-white shadow-lg relative z-10 transition-all duration-300 group-hover:scale-105">
                    {user && user.profilePhoto && user.profilePhoto.url && user.profilePhoto.url.trim() !== '' ? (
                      <img 
                        src={user.profilePhoto.url} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.log('Image failed to load:', e);
                          e.target.onerror = null;
                          e.target.src = '/images/default-avatar.svg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                        <User className="h-8 w-8 md:h-12 md:w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-left">
                  <h1 className="text-xl md:text-4xl font-bold text-gray-800 font-serif">
                    My Account
                  </h1>
                  <p className="text-gray-700 text-xs md:text-base mt-0 md:mt-1 font-light">
                    Welcome, <span className="font-medium">{user?.name || user?.email || 'User'}</span>
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Account Options Dropdown */}
                <div className="relative settings-button">
                  <button 
                    onClick={() => setShowAccountMenu(!showAccountMenu)}
                    className={`p-2 md:p-3 bg-white rounded-full border transition-all duration-300 flex items-center justify-center relative ${
                      showAccountMenu 
                        ? 'border-gray-400 shadow-md' 
                        : 'border-gray-200 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <Settings className={`h-4 w-4 md:h-5 md:w-5 ${showAccountMenu ? 'text-black' : 'text-gray-700 hover:text-black'}`} />
                  </button>
                  
                  {showAccountMenu && (
                    <>
                      {/* Overlay to close the menu when clicking outside */}
                      <div 
                        className="settings-overlay" 
                        onClick={() => setShowAccountMenu(false)}
                      ></div>
                      
                      <div 
                        className="absolute right-0 sm:right-0 mt-2 w-56 md:w-64 bg-white rounded-lg shadow-xl border border-gray-100 settings-dropdown"
                        style={{ 
                          maxWidth: 'calc(100vw - 20px)', 
                          right: '-10px'
                        }}
                      >
                        <div className="p-3 border-b border-gray-100">
                          <p className="text-xs font-medium text-gray-500">ACCOUNT OPTIONS</p>
                        </div>
                        <div className="py-1">
                          {[
                            { id: 'profile', label: 'My Profile', icon: User },
                            { id: 'orders', label: 'My Orders', icon: Package },
                            { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
                            { id: 'security', label: 'Security Settings', icon: Lock },
                            { id: 'cart', label: 'Shopping Cart', icon: ShoppingCart },
                            { id: 'favorites', label: 'Favorites', icon: Heart }
                          ].map((item) => (
                            <button
                              key={item.id}
                              onClick={() => {
                                setActiveTab(item.id);
                                setShowAccountMenu(false);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <item.icon className="h-4 w-4 text-gray-500" />
                              {item.label}
                            </button>
                          ))}
                        </div>
                        <div className="p-2 border-t border-gray-100">
                          <button
                            onClick={() => {
                              setShowAccountMenu(false);
                              handleLogout();
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-md"
                          >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                {isAdmin && (
                  <div className="px-3 md:px-5 py-1.5 md:py-2.5 bg-white rounded-lg flex items-center gap-1 md:gap-2 border border-gray-200 shadow-md transition-all duration-300 hover:shadow-lg group">
                    <div className="p-1 md:p-1.5 rounded-full bg-gradient-to-r from-gray-600 to-gray-800 group-hover:from-gray-700 group-hover:to-black transition-all duration-300">
                      <Crown className="h-3 w-3 md:h-4 md:w-4 text-white" />
                    </div>
                    <span className="text-xs md:text-sm font-medium text-gray-800 group-hover:text-black">ADMIN</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs - Mobile Friendly Big Box Buttons */}
        <div className="border-b border-gray-100 bg-white shadow-sm">
          {/* Mobile View - Only show breadcrumb navigation when not in main view */}
          {activeTab !== 'main' && (
            <div className="md:hidden px-3 py-2 border-b border-gray-100">
              <button 
                onClick={() => setActiveTab('main')}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-200 w-full shadow-sm"
              >
                <span className="text-gray-800 text-lg">←</span>
                <span className="font-medium text-gray-800">Back to My Account</span>
              </button>
            </div>
          )}
          
          {/* Desktop View - Horizontal Layout with No Scrollbar */}
          <div className="hidden md:flex justify-between px-6 flex-wrap">
            <button
              onClick={() => setActiveTab('main')}
              className={`relative flex items-center gap-2 px-4 py-4 text-sm font-medium transition-all duration-300 ${
                activeTab === 'main'
                  ? 'text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className={`p-1.5 rounded-full transition-all duration-300 ${
                activeTab === 'main' 
                  ? 'bg-gradient-to-r from-gray-200 to-gray-300' 
                  : 'bg-gray-50 group-hover:bg-gray-100'
              }`}>
                <User className={`h-4 w-4 ${activeTab === 'main' ? 'text-gray-800' : 'text-gray-500'}`} />
              </div>
              My Account
              
              {/* Active Indicator */}
              {activeTab === 'main' && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-gray-600 to-black"></div>
              )}
            </button>
            
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-4 text-sm font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className={`p-1.5 rounded-full transition-all duration-300 ${
                  activeTab === tab.id 
                    ? 'bg-gradient-to-r from-gray-200 to-gray-300' 
                    : 'bg-gray-50 group-hover:bg-gray-100'
                }`}>
                  <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? 'text-gray-800' : 'text-gray-500'}`} />
                </div>
                {tab.label}
                
                {/* Active Indicator */}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-gray-600 to-black"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Admin Quick Access */}
        {isAdmin && (
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-100 px-6 py-3">
            <div className="flex flex-wrap items-center gap-3 md:gap-4">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-full bg-gradient-to-r from-gray-600 to-black">
                  <Crown className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-800">Admin Quick Access:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/admin/dashboard"
                  className="px-4 py-1.5 bg-white text-gray-800 rounded-full text-xs border border-gray-300 hover:border-gray-500 hover:bg-gray-50 transition-all duration-300 shadow-sm flex items-center gap-1.5"
                >
                  <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                  Dashboard
                </Link>
                <Link
                  to="/admin/orders"
                  className="px-4 py-1.5 bg-white text-gray-800 rounded-full text-xs border border-gray-300 hover:border-gray-500 hover:bg-gray-50 transition-all duration-300 shadow-sm flex items-center gap-1.5"
                >
                  <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                  Order Management
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Content Section */}
        <div className="p-3 md:p-8 lg:p-10 bg-white relative">
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-gray-50 to-transparent opacity-30 pointer-events-none"></div>
          <div className="relative" style={{ zIndex: 5 }}>
            {renderContent()}
          </div>
        </div>

        {/* Logout Section */}
        <div className="p-3 md:p-6 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
          <button
            onClick={handleLogout}
            className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-3 bg-white border border-gray-200 hover:border-gray-400 text-gray-800 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 font-medium shadow-sm hover:shadow-md group"
          >
            <div className="p-1 rounded-full bg-gray-100 group-hover:bg-gray-200 transition-colors duration-300">
              <LogOut className="h-3.5 w-3.5 text-gray-500 group-hover:text-gray-800" />
            </div>
            <span className="group-hover:text-gray-900">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;





