import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import Profile from '../components/Auth/Profile/Profile';
import './ProfileStyles.css';
import { useFavorites } from '../context/FavoritesContext/FavoritesContext';
import { useRecentlyViewed } from '../context/RecentlyViewedContext/RecentlyViewedContext';
import { fetchFavorites } from '../redux/favoritesSlice';
import { 
  fetchUserPayments, 
  selectPayments, 
  selectPaymentsLoading, 
  selectPaymentsError
} from '../redux/paymentsSlice';
import { calculatePricing, normalizeCartItem } from '../utils/pricingUtils';
import { 
  User, 
  Package, 
  ShoppingCart, 
  LogOut, 
  MapPin,
  Heart,
  CreditCard,
  Edit3,
  MoreVertical,
  Eye,
  Calendar,
  ChevronLeft,
  ChevronRight,
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
  
  // Redux state for payments/transactions
  const payments = useSelector(selectPayments);
  const paymentsLoading = useSelector(selectPaymentsLoading);
  const paymentsError = useSelector(selectPaymentsError);
  
  // Pagination state for transactions
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 6;
  
  // Recently viewed context
  const { recentlyViewed, loading: recentlyViewedLoading, fetchRecentlyViewed } = useRecentlyViewed();
  
  // Validate MongoDB ObjectId format
  const isValidObjectId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  };

  // Filter for valid products
  const validRecentlyViewed = recentlyViewed
    .filter(item => item.productId && item.productId._id && isValidObjectId(item.productId._id))
    .slice(0, 3);
  
  const { favorites, loading: favLoading, error: favError } = useFavorites();
  
  const dispatch = useDispatch();
  
  const refreshFavorites = useCallback(() => {
    if (user) {
      dispatch(fetchFavorites());
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
  
  const handleQuantityIncrease = async (productId, currentQuantity, product) => {
    try {
      await updateQuantity(productId, currentQuantity + 1);
    } catch (error) {
      console.error('Error increasing quantity:', error);
      alert('Failed to update quantity. Please try again.');
    }
  };

  const handleQuantityDecrease = async (productId, currentQuantity, product) => {
    if (currentQuantity <= 1) {
      await handleRemoveFromCart(productId);
      return;
    }
    try {
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
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location]);

  useEffect(() => {
    if (user) {
      fetchUserOrders();
    }
  }, [user]);

  useEffect(() => {
    if (user && activeTab === 'transactions') {
      dispatch(fetchUserPayments());
    }
  }, [user, activeTab, dispatch]);

  useEffect(() => {
    if (user && activeTab === 'recently-viewed') {
      fetchRecentlyViewed();
    }
  }, [user, activeTab, fetchRecentlyViewed]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPaginatedTransactions = () => {
    const startIndex = (currentPage - 1) * transactionsPerPage;
    const endIndex = startIndex + transactionsPerPage;
    return payments.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(payments.length / transactionsPerPage);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    scrollToTop();
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < getTotalPages()) {
      handlePageChange(currentPage + 1);
    }
  };

  // Reset current page when switching to transactions tab
  useEffect(() => {
    if (activeTab === 'transactions') {
      setCurrentPage(1);
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] bg-white" style={{ paddingTop: '65px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div className="relative mb-6">
          <div className="animate-spin h-16 w-16 border-2 border-gray-200 border-t-[#733857]"></div>
          <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center">
            <img src="/images/logo.png" alt="Logo" className="h-8 w-8 bg-white" />
          </div>
        </div>
        <p className="text-sm font-light text-gray-500 tracking-wide" style={{ letterSpacing: '0.05em' }}>Loading your profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center items-center bg-white" style={{ paddingTop: '65px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <User className="h-16 w-16 text-gray-300 mb-6" strokeWidth={1} />
        <h2 className="text-2xl font-light text-gray-900 mb-2 tracking-wide" style={{ letterSpacing: '0.02em' }}>Account Access Required</h2>
        <p className="text-sm text-gray-500 font-light mb-8">Please sign in to view your profile</p>
        <button
          onClick={toggleAuthPanel}
          className="px-6 py-3 border border-[#733857] text-[#733857] text-xs font-bold uppercase tracking-widest hover:bg-[#733857] hover:text-white transition-all duration-300"
          style={{ letterSpacing: '0.12em' }}
        >
          Sign In
        </button>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'recently-viewed', label: 'Recently Viewed', icon: Eye },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'transactions', label: 'Transactions', icon: CreditCard },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'main':
        return (
          <div className="space-y-8">
            {/* Elegant Section Header */}
            <div className="pb-4" style={{ borderBottom: '2px solid rgba(115, 56, 87, 0.1)' }}>
              <h3 className="text-3xl font-light tracking-wide mb-2" style={{ 
                color: '#281c20',
                letterSpacing: '0.03em'
              }}>My Account</h3>
              <p className="text-sm" style={{ 
                color: 'rgba(40, 28, 32, 0.5)',
                letterSpacing: '0.02em'
              }}>Access and manage your personal information</p>
            </div>
            
            {/* Mobile view - Beautiful Cards */}
            <div className="grid grid-cols-2 gap-4 md:hidden">
              {[
                { id: 'profile', label: 'My Profile', icon: User, color: '#733857', gradient: 'linear-gradient(135deg, rgba(115, 56, 87, 0.05), rgba(115, 56, 87, 0.02))' },
                { id: 'addresses', label: 'Addresses', icon: MapPin, color: '#412434', gradient: 'linear-gradient(135deg, rgba(65, 36, 52, 0.05), rgba(65, 36, 52, 0.02))' },
                { id: 'favorites', label: 'Favorites', icon: Heart, color: '#8d4466', count: favorites?.length || 0, gradient: 'linear-gradient(135deg, rgba(141, 68, 102, 0.05), rgba(141, 68, 102, 0.02))' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className="relative group overflow-hidden transition-all duration-300 aspect-square"
                  style={{
                    border: '1px solid rgba(115, 56, 87, 0.15)',
                    backgroundColor: 'white',
                    boxShadow: '0 2px 8px rgba(115, 56, 87, 0.06)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(115, 56, 87, 0.15)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(115, 56, 87, 0.06)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Background gradient */}
                  <div className="absolute inset-0 opacity-100 transition-opacity duration-300" style={{ 
                    background: item.gradient
                  }}></div>
                  
                  <div className="relative flex flex-col items-center justify-center h-full p-4">
                    <div className="relative mb-4">
                      <item.icon className="h-8 w-8 transition-all duration-300" 
                        style={{ color: item.color }} 
                        strokeWidth={1.5} 
                      />
                      {item.count > 0 && (
                        <span className="absolute -top-2 -right-2 text-white text-xs px-2 py-0.5 font-bold min-w-[20px] text-center" style={{ 
                          backgroundColor: item.color,
                          boxShadow: '0 2px 6px rgba(115, 56, 87, 0.3)'
                        }}>
                          {item.count > 99 ? '99' : item.count}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-medium text-center transition-all duration-300" style={{ 
                      color: 'rgba(40, 28, 32, 0.85)',
                      letterSpacing: '0.01em'
                    }}>{item.label}</h4>
                  </div>
                </button>
              ))}
            </div>

            {/* Desktop/tablet view - Elegant Cards */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { id: 'profile', label: 'My Profile', icon: User, description: 'View and edit your personal information', color: '#733857', gradient: 'linear-gradient(135deg, rgba(115, 56, 87, 0.04), rgba(115, 56, 87, 0.01))' },
                { id: 'addresses', label: 'Saved Addresses', icon: MapPin, description: 'Manage your delivery locations', color: '#412434', gradient: 'linear-gradient(135deg, rgba(65, 36, 52, 0.04), rgba(65, 36, 52, 0.01))' },
                { id: 'favorites', label: 'My Favorites', icon: Heart, description: 'Your favorite desserts & pastries', color: '#8d4466', count: favorites?.length || 0, gradient: 'linear-gradient(135deg, rgba(141, 68, 102, 0.04), rgba(141, 68, 102, 0.01))' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className="relative group overflow-hidden transition-all duration-300"
                  style={{
                    border: '1px solid rgba(115, 56, 87, 0.15)',
                    backgroundColor: 'white',
                    boxShadow: '0 2px 8px rgba(115, 56, 87, 0.06)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(115, 56, 87, 0.15)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(115, 56, 87, 0.06)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Background gradient */}
                  <div className="absolute inset-0 transition-opacity duration-300" style={{ 
                    background: item.gradient
                  }}></div>
                  
                  <div className="relative p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="relative flex-shrink-0">
                        <item.icon className="h-7 w-7 transition-all duration-300" 
                          style={{ color: item.color }} 
                          strokeWidth={1.5} 
                        />
                        {item.count > 0 && (
                          <span className="absolute -top-2 -right-2 text-white text-xs px-2 py-0.5 font-bold min-w-[20px] text-center" style={{ 
                            backgroundColor: item.color,
                            boxShadow: '0 2px 6px rgba(115, 56, 87, 0.3)'
                          }}>
                            {item.count > 99 ? '99+' : item.count}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className="text-lg font-medium mb-1 transition-all duration-300" style={{ 
                          color: '#281c20',
                          letterSpacing: '0.01em'
                        }}>{item.label}</h4>
                        <p className="text-sm transition-all duration-300" style={{ 
                          color: 'rgba(40, 28, 32, 0.55)',
                          letterSpacing: '0.01em'
                        }}>{item.description}</p>
                      </div>
                    </div>
                    
                    {/* Arrow indicator */}
                    <div className="flex justify-end">
                      <span className="text-xl transition-transform duration-300 group-hover:translate-x-2" style={{ color: item.color }}>→</span>
                    </div>
                  </div>
                  
                  {/* Decorative corner */}
                  <div className="absolute top-0 right-0 w-0 h-0 transition-all duration-300 opacity-0 group-hover:opacity-100" style={{
                    borderTop: `24px solid ${item.color}`,
                    borderLeft: '24px solid transparent',
                    opacity: 0.08
                  }}></div>
                </button>
              ))}
            </div>
          </div>
        );
        
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="mb-4">
              <h3 className="text-2xl font-light tracking-wide text-black border-b border-gray-200 pb-3" style={{ letterSpacing: '0.02em' }}>Profile Information</h3>
            </div>
            <Profile />
          </div>
        );
      
      case 'orders':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-light tracking-wide text-black border-b border-gray-200 pb-3" style={{ letterSpacing: '0.02em' }}>My Orders</h3>
              <Link 
                to="/products" 
                className="px-5 py-2 border text-xs font-bold tracking-widest transition-all duration-300"
                style={{ 
                  borderColor: '#733857',
                  color: '#733857',
                  letterSpacing: '0.08em'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#733857';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#733857';
                }}
              >
                BROWSE PRODUCTS
              </Link>
            </div>
            
            {ordersLoading ? (
              <div className="bg-white border border-gray-100 p-12 text-center">
                <div className="w-16 h-16 bg-white border border-gray-200 flex items-center justify-center mx-auto mb-6">
                  <Package className="h-8 w-8 animate-pulse" style={{ color: '#733857' }} />
                </div>
                <h4 className="text-lg font-medium mb-2" style={{ color: '#1a1a1a' }}>Loading Orders...</h4>
                <p className="text-sm tracking-wide" style={{ color: 'rgba(26, 26, 26, 0.5)' }}>Please wait while we fetch your order history</p>
              </div>
            ) : ordersError ? (
              <div className="bg-white border border-gray-100 p-8 text-center">
                <h4 className="text-lg font-medium mb-2" style={{ color: '#733857' }}>Error Loading Orders</h4>
                <p className="mb-6 text-sm" style={{ color: 'rgba(26, 26, 26, 0.6)' }}>{ordersError}</p>
                <button
                  onClick={fetchUserOrders}
                  className="px-6 py-2.5 border text-xs font-bold tracking-widest transition-all duration-300"
                  style={{ 
                    borderColor: '#733857',
                    color: '#733857',
                    letterSpacing: '0.08em'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#733857';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#733857';
                  }}
                >
                  TRY AGAIN
                </button>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white border border-gray-100 p-12 text-center">
                <div className="w-16 h-16 bg-white border border-gray-200 flex items-center justify-center mx-auto mb-6">
                  <Package className="h-8 w-8" style={{ color: 'rgba(26, 26, 26, 0.3)' }} />
                </div>
                <h4 className="text-xl font-light mb-3 tracking-wide" style={{ color: '#1a1a1a', letterSpacing: '0.02em' }}>No Orders Yet</h4>
                <p className="text-sm mb-8 tracking-wide" style={{ color: 'rgba(26, 26, 26, 0.5)' }}>Discover our delicious cakes and pastries to place your first order</p>
                <Link 
                  to="/products" 
                  className="inline-flex items-center px-6 py-3 border text-xs font-bold tracking-widest transition-all duration-300"
                  style={{ 
                    borderColor: '#733857',
                    color: '#733857',
                    letterSpacing: '0.08em'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#733857';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#733857';
                  }}
                >
                  START SHOPPING
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

      case 'recently-viewed':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-2xl font-medium text-black border-b border-gray-200 pb-2">
                Recently Viewed
                {validRecentlyViewed?.length > 0 && (
                  <span className="ml-2 px-3 py-1 text-white text-sm rounded-full" style={{ background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)' }}>
                    {validRecentlyViewed.length} items
                  </span>
                )}
              </h3>
              <Link 
                to="/products" 
                className="px-5 py-2 bg-white border-2 border-[#733857] hover:bg-gradient-to-r hover:from-[#733857] hover:via-[#8d4466] hover:to-[#412434] hover:text-white transition-colors shadow-md font-medium"
                style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
              >
                Browse All Products
              </Link>
            </div>
            
            {recentlyViewedLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading recently viewed items...</p>
              </div>
            ) : validRecentlyViewed.length === 0 ? (
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-10 text-center shadow-md">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-200 shadow-md">
                  <Eye className="h-10 w-10 text-gray-500" />
                </div>
                <h4 className="text-xl font-medium text-black mb-3">No Recently Viewed Items</h4>
                <p className="text-gray-600 mb-6">Start browsing our delicious collection to see your recently viewed products here</p>
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
                  className="browse-products-btn inline-flex items-center px-6 py-3 bg-white border-2 border-[#733857] hover:bg-gradient-to-r hover:from-[#733857] hover:via-[#8d4466] hover:to-[#412434] transition-colors shadow-md font-medium transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span className="transition-all duration-300">
                    Start Browsing
                  </span>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Recently Viewed Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">Recently Viewed Products</p>
                      <p className="text-sm text-gray-600">{validRecentlyViewed.length} recently viewed items</p>
                    </div>
                    <Link 
                      to="/products" 
                      className="px-6 py-2 bg-white border-2 border-[#733857] hover:bg-gradient-to-r hover:from-[#733857] hover:via-[#8d4466] hover:to-[#412434] hover:text-white transition-colors font-medium"
                      style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
                    >
                      View All
                    </Link>
                  </div>
                </div>
                
                {/* Recently Viewed Items - Responsive Product Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {validRecentlyViewed.slice(0, 8).map((item) => {
                    if (!item.productId || !item.productId._id) {
                      console.warn('No product data found for recently viewed item:', item);
                      return null;
                    }
                    
                    const product = item.productId;
                    
                    return (
                      <div key={product._id} className="relative">
                        {/* Recently Viewed Badge */}
                        <div className="absolute top-2 left-2 z-10 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)' }}>
                          <Eye className="w-3 h-3" />
                        </div>
                        
                        {/* Product Card */}
                        <ProductCard 
                          product={product} 
                          className="h-full"
                          compact={true}
                        />
                      </div>
                    );
                  })}
                </div>
                
                {validRecentlyViewed.length > 8 && (
                  <div className="text-center">
                    <Link 
                      to="/products" 
                      className="font-medium"
                      style={{ background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
                    >
                      View {validRecentlyViewed.length - 8} more products →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'cart':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-2xl font-light tracking-wide text-black border-b border-gray-200 pb-3" style={{ letterSpacing: '0.02em' }}>
                Shopping Cart
                {cartCount > 0 && (
                  <span className="ml-3 px-2.5 py-1 text-white text-xs font-bold tracking-wider" style={{ backgroundColor: '#733857', letterSpacing: '0.05em' }}>
                    {cartCount} ITEMS
                  </span>
                )}
              </h3>
              <Link 
                to="/cart" 
                className="px-5 py-2 border text-xs font-bold tracking-widest transition-all duration-300"
                style={{ 
                  borderColor: '#733857',
                  color: '#733857',
                  letterSpacing: '0.08em'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#733857';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#733857';
                }}
              >
                VIEW FULL CART
              </Link>
            </div>
            
            {cartLoading ? (
              <div className="bg-white border border-gray-100 p-12 text-center">
                <div className="w-16 h-16 bg-white border border-gray-200 flex items-center justify-center mx-auto mb-6">
                  <ShoppingCart className="h-8 w-8 animate-pulse" style={{ color: '#733857' }} />
                </div>
                <p className="text-sm tracking-wide" style={{ color: 'rgba(26, 26, 26, 0.5)' }}>Loading your cart...</p>
              </div>
            ) : cartError ? (
              <div className="bg-white border border-gray-100 p-8 text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <ShoppingCart className="w-5 h-5" style={{ color: '#733857' }} />
                  <p className="font-medium text-lg" style={{ color: '#733857' }}>Error loading cart</p>
                </div>
                <p className="text-sm mb-6" style={{ color: 'rgba(26, 26, 26, 0.6)' }}>{cartError}</p>
                <div className="flex gap-3 justify-center">
                  <button 
                    onClick={() => window.location.reload()} 
                    className="px-5 py-2 border text-xs font-bold tracking-widest transition-all duration-300"
                    style={{ 
                      borderColor: '#733857',
                      color: '#733857',
                      letterSpacing: '0.08em'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#733857';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#733857';
                    }}
                  >
                    RETRY LOADING
                  </button>
                  <Link 
                    to="/products" 
                    className="px-5 py-2 border text-xs font-bold tracking-widest transition-all duration-300"
                    style={{ 
                      borderColor: '#733857',
                      color: '#733857',
                      letterSpacing: '0.08em'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#733857';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#733857';
                    }}
                  >
                    CONTINUE SHOPPING
                  </Link>
                </div>
              </div>
            ) : cartItems.length === 0 ? (
              <div className="bg-white border border-gray-100 p-12 text-center">
                <div className="w-16 h-16 bg-white border border-gray-200 flex items-center justify-center mx-auto mb-6">
                  <ShoppingCart className="h-8 w-8" style={{ color: 'rgba(26, 26, 26, 0.3)' }} />
                </div>
                <h4 className="text-xl font-light mb-3 tracking-wide" style={{ color: '#1a1a1a', letterSpacing: '0.02em' }}>Your Cart is Empty</h4>
                <p className="text-sm mb-8 tracking-wide max-w-md mx-auto" style={{ color: 'rgba(26, 26, 26, 0.5)' }}>
                  Discover our delicious collection of cakes, pastries, and sweet treats. 
                  Add your favorites to get started!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link 
                    to="/products" 
                    className="inline-flex items-center justify-center px-6 py-3 border text-xs font-bold tracking-widest transition-all duration-300"
                    style={{ 
                      borderColor: '#733857',
                      color: '#733857',
                      letterSpacing: '0.08em'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#733857';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#733857';
                    }}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    START SHOPPING
                  </Link>
                  <Link 
                    to="/favorites" 
                    className="inline-flex items-center justify-center px-6 py-3 border text-xs font-bold tracking-widest transition-all duration-300"
                    style={{ 
                      borderColor: '#733857',
                      color: '#733857',
                      letterSpacing: '0.08em'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#733857';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#733857';
                    }}
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    VIEW FAVORITES
                  </Link>
                </div>
                
                {/* Quick suggestions */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <p className="text-xs mb-3 tracking-wider" style={{ color: 'rgba(26, 26, 26, 0.5)', letterSpacing: '0.08em' }}>POPULAR CATEGORIES:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {['Cakes', 'Pastries', 'Desserts', 'Cookies'].map((category) => (
                      <Link
                        key={category}
                        to={`/products?category=${category.toLowerCase()}`}
                        className="px-4 py-2 bg-white text-gray-600 text-sm hover:bg-rose-50 hover:text-rose-600 transition-colors border border-gray-200 hover:border-rose-200"
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
                        className="gradient-btn px-6 py-3 bg-white border-2 border-[#733857] hover:bg-gradient-to-r hover:from-[#733857] hover:via-[#8d4466] hover:to-[#412434] transition-all duration-300 font-medium text-center shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <span className="transition-all duration-300">
                          View Full Cart
                        </span>
                      </Link>
                      <Link 
                        to="/checkout" 
                        className="gradient-btn px-6 py-3 bg-white border-2 border-[#733857] hover:bg-gradient-to-r hover:from-[#733857] hover:via-[#8d4466] hover:to-[#412434] transition-all duration-300 font-medium text-center shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
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
                                  <div className="flex items-center border border-gray-300">
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
                                    <span 
                                      className="w-12 h-8 flex items-center justify-center text-sm font-medium border-x border-gray-300"
                                    >
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
                                    <div className="text-sm text-gray-600">₹{Math.round(pricing.finalPrice)} each</div>
                                    <div className="font-semibold text-lg text-gray-900">₹{Math.round(pricing.finalPrice * quantity)}</div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                                <Link 
                                  to={`/products/${productId}`}
                                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-center text-sm font-medium flex items-center justify-center gap-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  View Product
                                </Link>
                                <Link 
                                  to="/cart"
                                  className="flex-1 px-4 py-2 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-colors text-center text-sm font-medium flex items-center justify-center gap-2"
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
              <h3 className="text-2xl font-medium text-black border-b border-gray-200 pb-2">
                My Favorites
                {favorites?.length > 0 && (
                  <span className="ml-2 px-3 py-1 text-white text-sm rounded-full" style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)' }}>
                    {favorites.length} items
                  </span>
                )}
              </h3>
              <Link 
                to="/favorites" 
                className="px-5 py-2 bg-white border-2 border-[#733857] hover:bg-gradient-to-r hover:from-[#733857] hover:via-[#8d4466] hover:to-[#412434] hover:text-white transition-colors shadow-md font-medium"
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
              <div className="bg-gray-50 border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4" style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)' }}></div>
                  <p className="font-medium" style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Error loading favorites</p>
                </div>
                <p className="text-sm mb-3" style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{favError}</p>
                <div className="flex gap-2">
                  <button 
                    onClick={refreshFavorites} 
                    disabled={favLoading}
                    className="px-4 py-2 bg-white border-2 border-[#733857] hover:bg-gradient-to-r hover:from-[#733857] hover:via-[#8d4466] hover:to-[#412434] hover:text-white transition-colors text-sm disabled:opacity-50 font-medium"
                    style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
                  >
                    {favLoading ? 'Loading...' : 'Retry Loading'}
                  </button>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-sm"
                  >
                    Reload Page
                  </button>
                </div>
              </div>
            ) : !favorites || favorites.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 p-10 text-center shadow-md">
                <div className="w-20 h-20 bg-white flex items-center justify-center mx-auto mb-6 border border-gray-200 shadow-md">
                  <Heart className="h-10 w-10 text-gray-500" />
                </div>
                <h4 className="text-xl font-medium text-black mb-3">No Favorites Yet</h4>
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
                  className="browse-products-btn inline-flex items-center px-6 py-3 bg-white border-2 border-[#733857] hover:bg-gradient-to-r hover:from-[#733857] hover:via-[#8d4466] hover:to-[#412434] transition-colors shadow-md font-medium transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span className="transition-all duration-300">
                    Browse Products
                  </span>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Favorites Summary */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">Your Favorites</p>
                      <p className="text-sm text-gray-600">{favorites.length} favorite items</p>
                    </div>
                    <Link 
                      to="/favorites" 
                      className="px-6 py-2 bg-white border-2 border-[#733857] hover:bg-gradient-to-r hover:from-[#733857] hover:via-[#8d4466] hover:to-[#412434] hover:text-white transition-colors font-medium"
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

      case 'transactions':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-light tracking-wide text-black border-b border-gray-200 pb-3" style={{ letterSpacing: '0.02em' }}>Transaction History</h3>
              <Link 
                to="/products" 
                className="px-5 py-2 bg-white border-2 border-[#733857] hover:bg-gradient-to-r hover:from-[#733857] hover:via-[#8d4466] hover:to-[#412434] hover:text-white transition-colors shadow-md font-medium"
                style={{ background: 'linear-gradient(90deg, #733857 0%, #8d4466 50%, #412434 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
              >
                Browse All Products
              </Link>
            </div>
            
            {paymentsLoading ? (
              <div className="bg-white border border-gray-100 p-12 text-center">
                <div className="w-16 h-16 bg-white border border-gray-200 flex items-center justify-center mx-auto mb-6">
                  <CreditCard className="h-8 w-8 animate-pulse" style={{ color: '#733857' }} />
                </div>
                <h4 className="text-lg font-medium mb-2" style={{ color: '#1a1a1a' }}>Loading Transactions...</h4>
                <p className="text-sm tracking-wide" style={{ color: 'rgba(26, 26, 26, 0.5)' }}>Please wait while we fetch your transaction history</p>
              </div>
            ) : paymentsError ? (
              <div className="bg-white border border-gray-100 p-8 text-center">
                <h4 className="text-lg font-medium mb-2" style={{ color: '#733857' }}>Error Loading Transactions</h4>
                <p className="mb-6 text-sm" style={{ color: 'rgba(26, 26, 26, 0.6)' }}>{paymentsError}</p>
                <button
                  onClick={() => dispatch(fetchUserPayments())}
                  className="px-6 py-2.5 border text-xs font-bold tracking-widest transition-all duration-300"
                  style={{ 
                    borderColor: '#733857',
                    color: '#733857',
                    letterSpacing: '0.08em'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#733857';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#733857';
                  }}
                >
                  TRY AGAIN
                </button>
              </div>
            ) : payments.length === 0 ? (
              <div className="bg-white border border-gray-100 p-12 text-center">
                <div className="w-16 h-16 bg-white border border-gray-200 flex items-center justify-center mx-auto mb-6">
                  <CreditCard className="h-8 w-8" style={{ color: 'rgba(26, 26, 26, 0.3)' }} />
                </div>
                <h4 className="text-xl font-light mb-3 tracking-wide" style={{ color: '#1a1a1a', letterSpacing: '0.02em' }}>No Transactions Yet</h4>
                <p className="text-sm mb-8 tracking-wide" style={{ color: 'rgba(26, 26, 26, 0.5)' }}>Your payment history will appear here once you make your first purchase</p>
                <Link 
                  to="/products" 
                  className="inline-flex items-center px-6 py-3 border text-xs font-bold tracking-widest transition-all duration-300"
                  style={{ 
                    borderColor: '#733857',
                    color: '#733857',
                    letterSpacing: '0.08em'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#733857';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#733857';
                  }}
                >
                  START SHOPPING
                </Link>
              </div>
            ) : (
              <div>
                <div className="mb-4 flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    {payments.length} transaction{payments.length !== 1 ? 's' : ''} found
                    {getTotalPages() > 1 && (
                      <span className="ml-2">
                        (Page {currentPage} of {getTotalPages()})
                      </span>
                    )}
                  </div>
                  {getTotalPages() > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className="p-2 border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Previous page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm text-gray-600 px-2">
                        {currentPage} / {getTotalPages()}
                      </span>
                      <button
                        onClick={handleNextPage}
                        disabled={currentPage === getTotalPages()}
                        className="p-2 border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Next page"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="grid gap-4 pt-4" style={{ paddingTop: '20px' }}>
                  {getPaginatedTransactions().map((payment) => (
                    <div key={payment._id} className="bg-white border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Transaction #{payment._id?.slice(-8)}</h4>
                            <p className="text-sm text-gray-600">
                              {new Date(payment.createdAt || payment.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">₹{payment.amount}</div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            payment.paymentStatus === 'success' || payment.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                            payment.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            payment.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {payment.paymentStatus?.charAt(0).toUpperCase() + payment.paymentStatus?.slice(1)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Payment Method</p>
                          <p className="font-medium">{payment.paymentMethod || 'Card'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Order ID</p>
                          <p className="font-medium">{payment.orderId || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Transaction ID</p>
                          <p className="font-medium">{payment.gatewayPaymentId || payment._id?.slice(-8)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Items</p>
                          <p className="font-medium">{payment.orderInfo?.itemCount || 0} items</p>
                        </div>
                      </div>
                      
                      {payment.orderInfo && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-sm text-gray-600">
                            Order #{payment.orderInfo.orderNumber} - Status: {payment.orderInfo.orderStatus}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Pagination Controls at Bottom */}
                {getTotalPages() > 1 && (
                  <div className="mt-6 flex justify-center items-center gap-4">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Previous page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>
                    
                    <div className="flex items-center gap-2">
                      {Array.from({ length: getTotalPages() }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`w-8 h-8 flex items-center justify-center text-sm border ${
                            currentPage === page
                              ? 'border-[#733857] bg-[#733857] text-white'
                              : 'border-gray-300 hover:bg-gray-100'
                          } transition-colors`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === getTotalPages()}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Next page"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
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
    <div className="min-h-screen" style={{ paddingTop: '0px', fontFamily: 'system-ui, -apple-system, sans-serif', background: 'linear-gradient(to bottom, #fdfbf9 0%, #ffffff 40%, #fdfbf9 100%)' }}>
      {/* Simple Navigation Bar */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3 text-gray-600 hover:text-[#733857] transition-colors">
              <ChevronLeft className="h-5 w-5" />
              <span className="font-medium">Back to Home</span>
            </Link>
            <div className="flex items-center gap-2">
              <img src="/images/logo.png" alt="La Patisserie" className="h-8 w-auto" />
              <span className="font-semibold text-[#733857]">La Patisserie</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Beautiful Profile Hero - Only show on main tab */}
      {activeTab === 'main' && (
        <div className="relative overflow-hidden" style={{ 
          background: 'linear-gradient(135deg, #fdfbf9 0%, #fff5f0 50%, #fdfbf9 100%)',
          borderBottom: '1px solid rgba(115, 56, 87, 0.1)'
        }}>
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 opacity-5" style={{
            background: 'radial-gradient(circle, #733857 0%, transparent 70%)',
          }}></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 opacity-5" style={{
            background: 'radial-gradient(circle, #8d4466 0%, transparent 70%)',
          }}></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              {/* User Profile Info with Beautiful Layout */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="relative group">
                  {/* Profile Photo with Elegant Frame */}
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28" style={{
                    boxShadow: '0 8px 24px rgba(115, 56, 87, 0.12)'
                  }}>
                    <div className="absolute inset-0 border-2" style={{ 
                      borderColor: '#733857',
                      background: 'linear-gradient(135deg, rgba(253, 251, 249, 0.9), rgba(255, 245, 240, 0.9))'
                    }}></div>
                    <div className="absolute inset-2 bg-white overflow-hidden">
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
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                          <User className="h-10 w-10 sm:h-12 sm:w-12" style={{ color: '#733857', opacity: 0.4 }} />
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Premium Badge */}
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-3 py-1 text-white text-xs font-bold uppercase tracking-widest whitespace-nowrap" 
                    style={{ 
                      backgroundColor: '#733857',
                      letterSpacing: '0.12em',
                      boxShadow: '0 4px 12px rgba(115, 56, 87, 0.3)'
                    }}>
                    Member
                  </div>
                </div>
                
                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-3xl sm:text-4xl font-light mb-2" style={{ 
                    color: '#281c20',
                    letterSpacing: '0.03em'
                  }}>
                    {user?.name || 'Guest'}
                  </h1>
                  <p className="text-sm mb-4" style={{ 
                    color: 'rgba(40, 28, 32, 0.6)',
                    letterSpacing: '0.02em'
                  }}>
                    {user?.email || 'guest@example.com'}
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" style={{ color: '#733857', opacity: 0.7 }} strokeWidth={1.5} />
                      <span className="text-xs" style={{ 
                        color: 'rgba(40, 28, 32, 0.6)',
                        letterSpacing: '0.05em'
                      }}>
                        Joined {new Date(user?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Elegant Stats Cards */}
              <div className="grid grid-cols-3 gap-4 sm:gap-6">
                {[
                  { icon: Package, value: orders?.length || 0, label: 'Orders', color: '#733857' },
                  { icon: Heart, value: favorites?.length || 0, label: 'Favorites', color: '#8d4466' },
                  { icon: ShoppingCart, value: cartCount || 0, label: 'In Cart', color: '#412434' }
                ].map((stat, index) => (
                  <div key={index} className="relative group">
                    <div className="bg-white p-4 sm:p-6 text-center transition-all duration-300 hover:shadow-lg" style={{
                      border: '1px solid rgba(115, 56, 87, 0.15)',
                      boxShadow: '0 2px 8px rgba(115, 56, 87, 0.05)'
                    }}>
                      <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-3 transition-transform duration-300 group-hover:scale-110" 
                        style={{ color: stat.color, opacity: 0.8 }} 
                        strokeWidth={1.5} 
                      />
                      <div className="text-3xl sm:text-4xl font-light mb-2" style={{ 
                        color: stat.color,
                        letterSpacing: '0.02em'
                      }}>
                        {stat.value}
                      </div>
                      <div className="text-xs uppercase tracking-wider font-medium" style={{ 
                        color: 'rgba(40, 28, 32, 0.6)',
                        letterSpacing: '0.08em'
                      }}>
                        {stat.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Back Button for specific sections */}
      {activeTab !== 'main' && (
        <div className="bg-white border-b border-gray-200 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <button 
              onClick={() => setActiveTab('main')}
              className="flex items-center gap-2 text-gray-500 hover:text-[#733857] transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium uppercase tracking-wider" style={{ letterSpacing: '0.08em' }}>Back</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {activeTab === 'main' ? (
          /* Desktop: Show sidebar + content, Mobile: Show menu grid */
          <div className="hidden lg:grid lg:grid-cols-4 lg:gap-8">
            {/* Beautiful Desktop Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white sticky top-24" style={{
                border: '1px solid rgba(115, 56, 87, 0.15)',
                boxShadow: '0 2px 12px rgba(115, 56, 87, 0.06)'
              }}>
                <div className="p-6">
                  {/* Elegant Header */}
                  <div className="mb-6 pb-4" style={{ borderBottom: '2px solid rgba(115, 56, 87, 0.1)' }}>
                    <h2 className="text-lg font-light tracking-wide" style={{ 
                      color: '#281c20',
                      letterSpacing: '0.03em'
                    }}>Your Account</h2>
                    <p className="text-xs mt-1" style={{ 
                      color: 'rgba(40, 28, 32, 0.5)',
                      letterSpacing: '0.02em'
                    }}>Manage your profile & preferences</p>
                  </div>
                  
                  <nav className="space-y-2">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="w-full group relative overflow-hidden transition-all duration-300"
                      >
                        <div className="flex items-center gap-3 px-4 py-3 relative z-10 transition-all duration-300" style={{
                          backgroundColor: 'transparent',
                          borderLeft: '2px solid transparent'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderLeftColor = '#733857';
                          e.currentTarget.style.backgroundColor = 'rgba(115, 56, 87, 0.04)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderLeftColor = 'transparent';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}>
                          <tab.icon className="h-5 w-5 flex-shrink-0 transition-all duration-300" 
                            style={{ color: 'rgba(115, 56, 87, 0.7)' }} 
                            strokeWidth={1.5} 
                          />
                          <span className="font-medium text-sm text-left transition-all duration-300" style={{ 
                            color: 'rgba(40, 28, 32, 0.8)',
                            letterSpacing: '0.02em'
                          }}>{tab.label}</span>
                          {tab.id === 'favorites' && favorites?.length > 0 && (
                            <span className="ml-auto text-white text-xs px-2 py-1 font-bold" style={{ 
                              backgroundColor: '#733857',
                              letterSpacing: '0.08em',
                              boxShadow: '0 2px 6px rgba(115, 56, 87, 0.25)'
                            }}>
                              {favorites.length}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </nav>

                  {/* Elegant Logout Button */}
                  <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(115, 56, 87, 0.1)' }}>
                    <button
                      onClick={logout}
                      className="w-full flex items-center justify-center gap-3 px-4 py-3 transition-all duration-300"
                      style={{
                        border: '1px solid rgba(115, 56, 87, 0.3)',
                        color: '#733857',
                        backgroundColor: 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#733857';
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.borderColor = '#733857';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#733857';
                        e.currentTarget.style.borderColor = 'rgba(115, 56, 87, 0.3)';
                      }}
                    >
                      <LogOut className="h-4 w-4" strokeWidth={1.5} />
                      <span className="font-medium text-sm uppercase tracking-wider" style={{ letterSpacing: '0.08em' }}>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-white shadow-lg border border-gray-200 min-h-[400px]">
                <div className="p-6 sm:p-8">
                  {activeTab === 'main' ? (
                    <div className="text-center py-12">
                      <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Your Account</h3>
                      <p className="text-gray-600">Select an option from the menu to get started</p>
                    </div>
                  ) : (
                    renderContent()
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Desktop: Show sidebar + content with selected component, Mobile: Show content only */
          <div className="hidden lg:grid lg:grid-cols-4 lg:gap-8">
            {/* Beautiful Desktop Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white sticky top-24" style={{
                border: '1px solid rgba(115, 56, 87, 0.15)',
                boxShadow: '0 2px 12px rgba(115, 56, 87, 0.06)'
              }}>
                <div className="p-6">
                  {/* Elegant Header */}
                  <div className="mb-6 pb-4" style={{ borderBottom: '2px solid rgba(115, 56, 87, 0.1)' }}>
                    <h2 className="text-lg font-light tracking-wide" style={{ 
                      color: '#281c20',
                      letterSpacing: '0.03em'
                    }}>Your Account</h2>
                    <p className="text-xs mt-1" style={{ 
                      color: 'rgba(40, 28, 32, 0.5)',
                      letterSpacing: '0.02em'
                    }}>Manage your profile & preferences</p>
                  </div>
                  
                  <nav className="space-y-2">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="w-full group relative overflow-hidden transition-all duration-300"
                      >
                        <div className="flex items-center gap-3 px-4 py-3 relative z-10 transition-all duration-300" style={{
                          backgroundColor: activeTab === tab.id ? 'rgba(115, 56, 87, 0.08)' : 'transparent',
                          borderLeft: `2px solid ${activeTab === tab.id ? '#733857' : 'transparent'}`
                        }}
                        onMouseEnter={(e) => {
                          if (activeTab !== tab.id) {
                            e.currentTarget.style.borderLeftColor = '#733857';
                            e.currentTarget.style.backgroundColor = 'rgba(115, 56, 87, 0.04)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (activeTab !== tab.id) {
                            e.currentTarget.style.borderLeftColor = 'transparent';
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}>
                          <tab.icon className="h-5 w-5 flex-shrink-0 transition-all duration-300" 
                            style={{ color: activeTab === tab.id ? '#733857' : 'rgba(115, 56, 87, 0.7)' }} 
                            strokeWidth={1.5} 
                          />
                          <span className="font-medium text-sm text-left transition-all duration-300" style={{ 
                            color: activeTab === tab.id ? '#733857' : 'rgba(40, 28, 32, 0.8)',
                            letterSpacing: '0.02em'
                          }}>{tab.label}</span>
                          {tab.id === 'favorites' && favorites?.length > 0 && (
                            <span className="ml-auto text-white text-xs px-2 py-1 font-bold" style={{ 
                              backgroundColor: '#733857',
                              letterSpacing: '0.08em',
                              boxShadow: '0 2px 6px rgba(115, 56, 87, 0.25)'
                            }}>
                              {favorites.length}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </nav>

                  {/* Elegant Logout Button */}
                  <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(115, 56, 87, 0.1)' }}>
                    <button
                      onClick={logout}
                      className="w-full flex items-center justify-center gap-3 px-4 py-3 transition-all duration-300"
                      style={{
                        border: '1px solid rgba(115, 56, 87, 0.3)',
                        color: '#733857',
                        backgroundColor: 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#733857';
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.borderColor = '#733857';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#733857';
                        e.currentTarget.style.borderColor = 'rgba(115, 56, 87, 0.3)';
                      }}
                    >
                      <LogOut className="h-4 w-4" strokeWidth={1.5} />
                      <span className="font-medium text-sm uppercase tracking-wider" style={{ letterSpacing: '0.08em' }}>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Main Content with Selected Component */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 min-h-[400px]">
                <div className="p-6 sm:p-8">
                  {renderContent()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Content view for specific sections */}
        {activeTab !== 'main' && (
          <div className="lg:hidden bg-white border border-gray-200 min-h-[400px]">
            <div className="p-6 sm:p-8">
              {renderContent()}
            </div>
          </div>
        )}

        {/* Beautiful Mobile Account Menu - Only show on main tab */}
        {activeTab === 'main' && (
          <div className="lg:hidden">
            <div className="bg-white" style={{
              border: '1px solid rgba(115, 56, 87, 0.15)',
              boxShadow: '0 2px 12px rgba(115, 56, 87, 0.06)'
            }}>
              <div className="p-6">
                {/* Elegant Mobile Header */}
                <div className="mb-6 pb-4" style={{ borderBottom: '2px solid rgba(115, 56, 87, 0.1)' }}>
                  <h2 className="text-lg font-light tracking-wide" style={{ 
                    color: '#281c20',
                    letterSpacing: '0.03em'
                  }}>Your Account</h2>
                  <p className="text-xs mt-1" style={{ 
                    color: 'rgba(40, 28, 32, 0.5)',
                    letterSpacing: '0.02em'
                  }}>Manage your profile & preferences</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className="relative group overflow-hidden transition-all duration-300"
                      style={{
                        border: '1px solid rgba(115, 56, 87, 0.2)',
                        backgroundColor: 'white'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#733857';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(115, 56, 87, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(115, 56, 87, 0.2)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div className="flex flex-col items-center justify-center p-6 relative z-10">
                        <div className="relative mb-3">
                          <tab.icon className="h-7 w-7 transition-all duration-300" 
                            style={{ color: 'rgba(115, 56, 87, 0.7)' }} 
                            strokeWidth={1.5} 
                          />
                          {tab.id === 'favorites' && favorites?.length > 0 && (
                            <span className="absolute -top-2 -right-2 text-white text-xs px-2 py-0.5 font-bold min-w-[20px] text-center" style={{ 
                              backgroundColor: '#733857',
                              letterSpacing: '0.08em',
                              boxShadow: '0 2px 6px rgba(115, 56, 87, 0.3)'
                            }}>
                              {favorites.length}
                            </span>
                          )}
                        </div>
                        <span className="font-medium text-xs text-left transition-all duration-300" style={{ 
                          color: 'rgba(40, 28, 32, 0.8)',
                          letterSpacing: '0.02em'
                        }}>{tab.label}</span>
                      </div>
                      {/* Decorative corner accent */}
                      <div className="absolute top-0 right-0 w-0 h-0 transition-all duration-300 opacity-0 group-hover:opacity-100" style={{
                        borderTop: '20px solid rgba(115, 56, 87, 0.08)',
                        borderLeft: '20px solid transparent'
                      }}></div>
                    </button>
                  ))}
                </div>

                {/* Elegant Mobile Logout Button */}
                <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(115, 56, 87, 0.1)' }}>
                  <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 transition-all duration-300"
                    style={{
                      border: '1px solid rgba(115, 56, 87, 0.3)',
                      color: '#733857',
                      backgroundColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#733857';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.borderColor = '#733857';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#733857';
                      e.currentTarget.style.borderColor = 'rgba(115, 56, 87, 0.3)';
                    }}
                  >
                    <LogOut className="h-5 w-5" strokeWidth={1.5} />
                    <span className="font-medium text-sm uppercase tracking-wider" style={{ letterSpacing: '0.08em' }}>Sign Out</span>
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





