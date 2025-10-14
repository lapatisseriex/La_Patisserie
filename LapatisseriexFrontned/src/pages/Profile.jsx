import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
// (removed duplicate import of useFavorites)
import { useCart } from '../hooks/useCart';
import Profile from '../components/Auth/Profile/Profile';
import './ProfileStyles.css';
import { useFavorites } from '../context/FavoritesContext/FavoritesContext';
import { fetchFavorites } from '../redux/favoritesSlice';
import { calculatePricing, normalizeCartItem } from '../utils/pricingUtils';
import { 
  User, 
  Package, 
  ShoppingCart, 
  LogOut, 
  Crown,
  Settings,
  MapPin,
  Truck,
  Heart,
  CreditCard,
  Edit3,
  MoreVertical,
  Eye
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
  const [jellyAnimations, setJellyAnimations] = useState({});
  const [animationDirections, setAnimationDirections] = useState({});
  
  // Force refresh favorites function
  const refreshFavorites = useCallback(() => {
    if (user) {
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
  
  // Cart quantity update handlers
  const handleQuantityIncrease = async (productId, currentQuantity, product) => {
    try {
      // Trigger jelly animation
      setAnimationDirections(prev => ({ ...prev, [productId]: 'up' }));
      setJellyAnimations(prev => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
      
      await updateQuantity(productId, currentQuantity + 1);
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
      // Trigger jelly animation
      setAnimationDirections(prev => ({ ...prev, [productId]: 'down' }));
      setJellyAnimations(prev => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
      await updateQuantity(productId, currentQuantity - 1);
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
    } catch (error) {
      console.error('Error removing from cart:', error);
      alert('Failed to remove item. Please try again.');
    }
  };

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
        <h2 className="text-xl font-medium bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent mb-2">Please log in to view your account</h2>
        <p className="text-black">You need to be logged in to access this page.</p>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'orders', label: 'My Orders', icon: Package },
    { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
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
                { id: 'cart', label: 'Shopping Cart', icon: ShoppingCart, color: 'bg-rose-50', count: cartCount },
                { id: 'favorites', label: 'Favorites', icon: Heart, color: 'bg-gray-50', count: favorites?.length || 0 },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className="flex flex-col items-center justify-center p-3 border border-gray-200 bg-white hover:bg-gray-50 transition-all duration-300 shadow-sm no-scrollbar aspect-square relative"
                >
                  <div className={`p-3 rounded-full ${item.color} mb-2 relative`}>
                    <item.icon className="h-5 w-5 text-gray-700" />
                    {item.count > 0 && (
                      <span className="absolute -top-2 -right-2 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center" style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)' }}>
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
                { id: 'cart', label: 'Shopping Cart', icon: ShoppingCart, description: 'View items in your cart', color: 'bg-rose-50', count: cartCount },
                { id: 'favorites', label: 'Favorites', icon: Heart, description: 'View your favorite products', color: 'bg-gray-50', count: favorites?.length || 0 },
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
                        <span className="absolute -top-2 -right-2 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center" style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)' }}>
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
              <style>{`
                .browse-products-btn span {
                  background: linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%);
                  -webkit-background-clip: text;
                  background-clip: text;
                  color: transparent;
                  transition: all 0.3s ease;
                }
                .browse-products-btn:hover span {
                  color: white !important;
                  background: none !important;
                  -webkit-background-clip: unset !important;
                  background-clip: unset !important;
                }
              `}</style>
              <Link 
                to="/products" 
                className="browse-products-btn bg-white border-2 border-[#733857] px-5 py-2 rounded-md hover:bg-gradient-to-r hover:from-[#733857] hover:via-[#8d4466] hover:to-[#412434] transition-all duration-300 shadow-md font-medium transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="transition-all duration-300">
                  Browse Products
                </span>
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
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center shadow-md">
                <h4 className="text-lg font-medium mb-2" style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Error Loading Orders</h4>
                <p className="mb-4" style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{ordersError}</p>
                <button
                  onClick={fetchUserOrders}
                  className="px-4 py-2 bg-white border-2 border-[#733857] rounded-md hover:bg-gradient-to-r hover:from-[#733857] hover:via-[#8d4466] hover:to-[#412434] hover:text-white transition-colors font-medium"
                  style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
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
                  className="inline-flex items-center px-6 py-3 bg-white border-2 border-[#733857] rounded-md hover:bg-gradient-to-r hover:from-[#733857] hover:via-[#8d4466] hover:to-[#412434] hover:text-white transition-all duration-300 shadow-md hover:shadow-lg font-medium"
                  style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
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
              <style>{`
                .gradient-btn span {
                  background: linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%);
                  -webkit-background-clip: text;
                  background-clip: text;
                  color: transparent;
                  transition: all 0.3s ease;
                }
                .gradient-btn:hover span {
                  color: white !important;
                  background: none !important;
                  -webkit-background-clip: unset !important;
                  background-clip: unset !important;
                }
                .gradient-btn:hover .icon {
                  color: white !important;
                }
              `}</style>
              <button className="gradient-btn px-4 py-2 bg-white border-2 border-[#733857] rounded-md hover:bg-gradient-to-r hover:from-[#733857] hover:via-[#8d4466] hover:to-[#412434] transition-all duration-300 flex items-center gap-2 shadow-md font-medium transform hover:scale-[1.02] active:scale-[0.98]">
                <MapPin className="h-4 w-4 icon transition-all duration-300" style={{ color: '#733857' }} />
                <span className="transition-all duration-300">
                  Add New Address
                </span>
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
              <style>{`
                .gradient-btn span {
                  background: linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%);
                  -webkit-background-clip: text;
                  background-clip: text;
                  color: transparent;
                  transition: all 0.3s ease;
                }
                .gradient-btn:hover span {
                  color: white !important;
                  background: none !important;
                  -webkit-background-clip: unset !important;
                  background-clip: unset !important;
                }
              `}</style>
              <Link 
                to="/cart" 
                className="gradient-btn px-5 py-2 bg-white border-2 border-[#733857] rounded-md hover:bg-gradient-to-r hover:from-[#733857] hover:via-[#8d4466] hover:to-[#412434] transition-colors shadow-md font-medium transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="transition-all duration-300">
                  View Full Cart
                </span>
              </Link>
            </div>
            
            {cartLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading your cart...</p>
              </div>
            ) : cartError ? (
              <div className="bg-gray-50 border border-gray-200 p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)' }}>
                    <ShoppingCart className="w-3 h-3 text-white" />
                  </div>
                  <p className="font-medium text-lg" style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Error loading cart</p>
                </div>
                <p className="text-sm mb-4" style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{cartError}</p>
                <div className="flex gap-3">
                  <style>{`
                    .gradient-btn span {
                      background: linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%);
                      -webkit-background-clip: text;
                      background-clip: text;
                      color: transparent;
                      transition: all 0.3s ease;
                    }
                    .gradient-btn:hover span {
                      color: white !important;
                      background: none !important;
                      -webkit-background-clip: unset !important;
                      background-clip: unset !important;
                    }
                  `}</style>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="gradient-btn px-4 py-2 bg-white border-2 border-[#733857] rounded-lg hover:bg-gradient-to-r hover:from-[#733857] hover:via-[#8d4466] hover:to-[#412434] transition-colors text-sm font-medium transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span className="transition-all duration-300">
                      Retry Loading
                    </span>
                  </button>
                  <Link 
                    to="/products" 
                    className="gradient-btn px-4 py-2 bg-white border-2 border-[#733857] rounded-lg hover:bg-gradient-to-r hover:from-[#733857] hover:via-[#8d4466] hover:to-[#412434] transition-colors text-sm font-medium transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span className="transition-all duration-300">
                      Continue Shopping
                    </span>
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
                  <style>{`
                    .gradient-btn span {
                      background: linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%);
                      -webkit-background-clip: text;
                      background-clip: text;
                      color: transparent;
                      transition: all 0.3s ease;
                    }
                    .gradient-btn:hover span {
                      color: white !important;
                      background: none !important;
                      -webkit-background-clip: unset !important;
                      background-clip: unset !important;
                    }
                    .gradient-btn:hover .icon {
                      color: white !important;
                    }
                  `}</style>
                  <Link 
                    to="/products" 
                    className="gradient-btn inline-flex items-center justify-center px-8 py-4 bg-white border-2 border-[#733857] rounded-xl hover:bg-gradient-to-r hover:from-[#733857] hover:via-[#8d4466] hover:to-[#412434] transition-all duration-300 shadow-lg hover:shadow-xl font-medium text-lg transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2 icon transition-all duration-300" style={{ color: '#733857' }} />
                    <span className="transition-all duration-300">
                      Start Shopping
                    </span>
                  </Link>
                  <Link 
                    to="/favorites" 
                    className="gradient-btn inline-flex items-center justify-center px-8 py-4 bg-white border-2 border-[#733857] rounded-xl hover:bg-gradient-to-r hover:from-[#733857] hover:via-[#8d4466] hover:to-[#412434] transition-all duration-300 shadow-md font-medium text-lg transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Heart className="w-5 h-5 mr-2 icon transition-all duration-300" style={{ color: '#733857' }} />
                    <span className="transition-all duration-300">
                      View Favorites
                    </span>
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
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <style>{`
                        .gradient-btn span {
                          background: linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%);
                          -webkit-background-clip: text;
                          background-clip: text;
                          color: transparent;
                          transition: all 0.3s ease;
                        }
                        .gradient-btn:hover span {
                          color: white !important;
                          background: none !important;
                          -webkit-background-clip: unset !important;
                          background-clip: unset !important;
                        }
                      `}</style>
                      <Link 
                        to="/cart" 
                        className="gradient-btn px-6 py-3 bg-white border-2 border-[#733857] rounded-lg hover:bg-gradient-to-r hover:from-[#733857] hover:via-[#8d4466] hover:to-[#412434] transition-all duration-300 font-medium text-center shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <span className="transition-all duration-300">
                          View Full Cart
                        </span>
                      </Link>
                      <Link 
                        to="/checkout" 
                        className="gradient-btn px-6 py-3 bg-white border-2 border-[#733857] rounded-lg hover:bg-gradient-to-r hover:from-[#733857] hover:via-[#8d4466] hover:to-[#412434] transition-all duration-300 font-medium text-center shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <span className="transition-all duration-300">
                          Proceed to Checkout
                        </span>
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
                      // Normalize cart item structure
                      const normalizedItem = normalizeCartItem(item);
                      if (!normalizedItem) return null;
                      
                      const product = normalizedItem.productDetails;
                      const productId = normalizedItem.productId;
                      const productName = product.name || normalizedItem.name || 'Product';
                      const productImage = product.image?.url || product.image || normalizedItem.image || product.images?.[0] || '/placeholder-image.jpg';
                      const quantity = normalizedItem.quantity;
                      
                      // Calculate pricing using centralized utility
                      let pricing = { finalPrice: 0, mrp: 0 };
                      const variant = product?.variants?.[normalizedItem.variantIndex];
                      if (variant) {
                        pricing = calculatePricing(variant);
                      } else {
                        // Fallback for items without variant data
                        const fallbackPrice = parseFloat(product.price || normalizedItem.price || 0) || 0;
                        pricing = { finalPrice: fallbackPrice, mrp: fallbackPrice };
                      }
                      
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
                                  className="text-gray-400 transition-colors p-1 disabled:opacity-50 disabled:cursor-not-allowed group"
                                  style={{ color: '#733857' }}
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
                                    <motion.span 
                                      key={`jelly-profile-${productId}-${jellyAnimations[productId] || 0}`}
                                      initial={{ 
                                        scaleX: 1, 
                                        scaleY: 1,
                                        y: animationDirections[productId] === 'up' ? -10 : animationDirections[productId] === 'down' ? 10 : 0,
                                        opacity: animationDirections[productId] ? 0.7 : 1
                                      }}
                                      animate={{
                                        scaleX: [1, 1.15, 0.95, 1.03, 1],
                                        scaleY: [1, 0.85, 1.05, 0.98, 1],
                                        y: 0,
                                        opacity: 1
                                      }}
                                      transition={{
                                        duration: 0.5,
                                        times: [0, 0.2, 0.5, 0.8, 1],
                                        ease: "easeInOut"
                                      }}
                                      className="w-12 h-8 flex items-center justify-center text-sm font-medium border-x border-gray-300"
                                    >
                                      {quantity}
                                    </motion.span>
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
                                    <div className="text-sm text-gray-600">₹{Math.round(pricing.finalPrice)} each</div>
                                    <div className="font-semibold text-lg text-gray-900">₹{Math.round(pricing.finalPrice * quantity)}</div>
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
                    <style>{`
                      .gradient-btn span {
                        background: linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%);
                        -webkit-background-clip: text;
                        background-clip: text;
                        color: transparent;
                        transition: all 0.3s ease;
                      }
                      .gradient-btn:hover span {
                        color: white !important;
                        background: none !important;
                        -webkit-background-clip: unset !important;
                        background-clip: unset !important;
                      }
                      .gradient-btn:hover .icon {
                        color: white !important;
                      }
                    `}</style>
                    <Link 
                      to="/cart"
                      className="gradient-btn flex items-center justify-center gap-3 p-4 bg-white border-2 border-[#733857] rounded-lg hover:bg-gradient-to-r hover:from-[#733857] hover:via-[#8d4466] hover:to-[#412434] transition-colors group transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <ShoppingCart className="w-5 h-5 icon transition-all duration-300" style={{ color: '#733857' }} />
                      <span className="font-medium transition-all duration-300">Manage Cart</span>
                    </Link>
                    <Link 
                      to="/checkout"
                      className="gradient-btn flex items-center justify-center gap-3 p-4 bg-white border-2 border-[#733857] rounded-lg hover:bg-gradient-to-r hover:from-[#733857] hover:via-[#8d4466] hover:to-[#412434] transition-colors group transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <CreditCard className="w-5 h-5 icon transition-all duration-300" style={{ color: '#733857' }} />
                      <span className="font-medium transition-all duration-300">Checkout</span>
                    </Link>
                    <Link 
                      to="/products"
                      className="gradient-btn flex items-center justify-center gap-3 p-4 bg-white border-2 border-[#733857] rounded-lg hover:bg-gradient-to-r hover:from-[#733857] hover:via-[#8d4466] hover:to-[#412434] transition-colors group transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Package className="w-5 h-5 icon transition-all duration-300" style={{ color: '#733857' }} />
                      <span className="font-medium transition-all duration-300">Continue Shopping</span>
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
                  <span className="ml-2 px-3 py-1 text-white text-sm rounded-full" style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)' }}>
                    {favorites.length} items
                  </span>
                )}
              </h3>
              <Link 
                to="/favorites" 
                className="px-5 py-2 bg-white border-2 border-[#733857] rounded-md hover:bg-gradient-to-r hover:from-[#733857] hover:via-[#8d4466] hover:to-[#412434] hover:text-white transition-colors shadow-md font-medium"
                style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
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
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded-full" style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)' }}></div>
                  <p className="font-medium" style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Error loading favorites</p>
                </div>
                <p className="text-sm mb-3" style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{favError}</p>
                <div className="flex gap-2">
                  <button 
                    onClick={refreshFavorites} 
                    disabled={favLoading}
                    className="px-4 py-2 bg-white border-2 border-[#733857] rounded hover:bg-gradient-to-r hover:from-[#733857] hover:via-[#8d4466] hover:to-[#412434] hover:text-white transition-colors text-sm disabled:opacity-50 font-medium"
                    style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
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
                <style>{`
                  .browse-products-btn span {
                    background: linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                    transition: all 0.3s ease;
                  }
                  .browse-products-btn:hover span {
                    color: white !important;
                    background: none !important;
                    -webkit-background-clip: unset !important;
                    background-clip: unset !important;
                  }
                `}</style>
                <Link 
                  to="/products" 
                  className="browse-products-btn inline-flex items-center px-6 py-3 bg-white border-2 border-[#733857] rounded-md hover:bg-gradient-to-r hover:from-[#733857] hover:via-[#8d4466] hover:to-[#412434] transition-colors shadow-md font-medium transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span className="transition-all duration-300">
                    Browse Products
                  </span>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Favorites Summary */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">Your Favorites</p>
                      <p className="text-sm text-gray-600">{favorites.length} favorite items</p>
                    </div>
                    <Link 
                      to="/favorites" 
                      className="px-6 py-2 bg-white border-2 border-[#733857] rounded-md hover:bg-gradient-to-r hover:from-[#733857] hover:via-[#8d4466] hover:to-[#412434] hover:text-white transition-colors font-medium"
                      style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
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
                        <div className="absolute top-2 left-2 z-10 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)' }}>
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
                            className="flex-1 text-center px-3 py-1 bg-white border border-[#733857] rounded text-sm hover:bg-gradient-to-r hover:from-[#733857] hover:via-[#8d4466] hover:to-[#412434] hover:text-white transition-colors font-medium"
                            style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
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
                      className="font-medium"
                      style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100" style={{ paddingTop: '65px' }}>
      {/* Compact Header Section - Only show on main tab */}
      {activeTab === 'main' && (
        <div className="bg-white shadow-md border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              {/* User Profile Info */}
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="relative">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-white shadow-lg bg-gradient-to-br from-gray-100 to-gray-200">
                    {user && user.profilePhoto && user.profilePhoto.url ? (
                      <img 
                        src={user.profilePhoto.url} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/images/default-avatar.svg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] rounded-full border border-white flex items-center justify-center">
                    <Crown className="w-2 h-2 text-white" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                    Welcome back, <span style={{
                      background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      color: 'transparent'
                    }}>{user?.name || 'Guest'}</span>
                  </h1>
                  <p className="text-gray-600 text-xs sm:text-sm truncate">{user?.email || 'guest@example.com'}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] text-white">
                      Premium Member
                    </span>
                    <span className="text-xs text-gray-500 hidden sm:inline">
                      Member since {new Date(user?.createdAt || Date.now()).getFullYear()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div className="text-center">
                  <div className="text-lg sm:text-xl font-bold" style={{
                    background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent'
                  }}>{orders?.length || 0}</div>
                  <div className="text-xs text-gray-600">Orders</div>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-xl font-bold" style={{
                    background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent'
                  }}>{favorites?.length || 0}</div>
                  <div className="text-xs text-gray-600">Favorites</div>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-xl font-bold" style={{
                    background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent'
                  }}>{cartCount || 0}</div>
                  <div className="text-xs text-gray-600">Cart Items</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Back Button for specific sections */}
      {activeTab !== 'main' && (
        <div className="bg-white border-b border-gray-200 px-3 sm:px-4 py-3">
          <div className="max-w-7xl mx-auto">
            <button 
              onClick={() => setActiveTab('main')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back to Profile</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {activeTab === 'main' ? (
          /* Desktop: Show sidebar + content, Mobile: Show menu grid */
          <div className="hidden lg:grid lg:grid-cols-4 lg:gap-6">
            {/* Desktop Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden sticky top-20">
                <div className="p-4">
                  <h2 className="text-lg font-semibold mb-3" style={{
                    background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent'
                  }}>Account Menu</h2>
                  
                  <nav className="space-y-2">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-left text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      >
                        <tab.icon className="h-4 w-4 flex-shrink-0" />
                        <span className="font-medium text-sm">{tab.label}</span>
                        {tab.id === 'cart' && cartCount > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                            {cartCount}
                          </span>
                        )}
                        {tab.id === 'favorites' && favorites?.length > 0 && (
                          <span className="ml-auto bg-gray-500 text-white text-xs rounded-full px-1.5 py-0.5">
                            {favorites.length}
                          </span>
                        )}
                      </button>
                    ))}
                  </nav>

                  {/* Logout Button */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <style>{`
                      .logout-btn:hover span {
                        color: white !important;
                        background: none !important;
                        -webkit-background-clip: unset !important;
                        background-clip: unset !important;
                      }
                      .logout-btn:hover .icon {
                        color: white !important;
                      }
                    `}</style>
                    <button
                      onClick={logout}
                      className="logout-btn w-full flex items-center space-x-2 px-3 py-2.5 bg-white border-2 border-red-500 text-red-600 rounded-lg hover:bg-red-500 transition-all duration-200"
                    >
                      <LogOut className="h-4 w-4 icon" />
                      <span className="font-medium text-sm">Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 min-h-[400px]">
                <div className="p-6">
                  <div className="text-center py-12">
                    <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Your Account</h3>
                    <p className="text-gray-600">Select an option from the menu to get started</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Content view for specific sections */
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 min-h-[400px]">
            <div className="p-4 sm:p-6">
              {renderContent()}
            </div>
          </div>
        )}

        {/* Mobile Account Menu Grid - Only show on main tab */}
        {activeTab === 'main' && (
          <div className="lg:hidden">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-4">
                <h2 className="text-lg font-semibold mb-4" style={{
                  background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent'
                }}>Account Menu</h2>
                
                <div className="grid grid-cols-2 gap-3">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className="relative flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-200 border border-gray-200 hover:border-gray-300"
                    >
                      <tab.icon className="h-6 w-6 text-gray-600 mb-2" />
                      <span className="font-medium text-sm text-gray-900">{tab.label}</span>
                      {tab.id === 'cart' && cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                          {cartCount}
                        </span>
                      )}
                      {tab.id === 'favorites' && favorites?.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-gray-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                          {favorites.length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Mobile Logout Button */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <style>{`
                    .mobile-logout-btn:hover span {
                      color: white !important;
                      background: none !important;
                      -webkit-background-clip: unset !important;
                      background-clip: unset !important;
                    }
                    .mobile-logout-btn:hover .icon {
                      color: white !important;
                    }
                  `}</style>
                  <button
                    onClick={logout}
                    className="mobile-logout-btn w-full flex items-center justify-center space-x-2 px-4 py-3 bg-white border-2 border-red-500 text-red-600 rounded-lg hover:bg-red-500 transition-all duration-200"
                  >
                    <LogOut className="h-5 w-5 icon" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;





