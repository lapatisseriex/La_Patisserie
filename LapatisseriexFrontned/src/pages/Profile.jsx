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
  ExternalLink,
  LayoutDashboard,
  GraduationCap,
  AlertTriangle} from 'lucide-react';
import ProductCard from '../components/Products/ProductCard';
import OrderCard from '../components/Orders/OrderCard';
import { Toaster, toast } from 'react-hot-toast';

const ProfilePage = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('main');
  const [profileDirty, setProfileDirty] = useState(false);
  const [unsavedBlockNotice, setUnsavedBlockNotice] = useState(false); // now used as a modal open flag
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
  
  // Donations state
  const [donations, setDonations] = useState([]);
  const [donationStats, setDonationStats] = useState(null);
  const [donationsLoading, setDonationsLoading] = useState(false);
  const [donationsError, setDonationsError] = useState(null);
  // Delete account modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ackPersonal, setAckPersonal] = useState(false);
  const [ackOrders, setAckOrders] = useState(false);
  const [ackStreak, setAckStreak] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  
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
  
  const handleQuantityIncrease = (productId, currentQuantity, product) => {
    // Fire-and-forget for instant UI updates
    updateQuantity(productId, currentQuantity + 1).catch(error => {
      console.error('Error increasing quantity:', error);
      toast.error('Failed to update quantity. Please try again.');
    });
  };

  const handleQuantityDecrease = (productId, currentQuantity, product) => {
    if (currentQuantity <= 1) {
      handleRemoveFromCart(productId);
      return;
    }
    // Fire-and-forget for instant UI updates
    updateQuantity(productId, currentQuantity - 1).catch(error => {
      console.error('Error decreasing quantity:', error);
      toast.error('Failed to update quantity. Please try again.');
    });
  };

  const handleRemoveFromCart = async (productId) => {
    if (!confirm('Are you sure you want to remove this item from your cart?')) {
      return;
    }
    try {
      await removeFromCart(productId);
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove item. Please try again.');
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
          'Authorization': `Bearer ${authToken}`}});

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

  // Fetch user donations
  const fetchUserDonations = async () => {
    if (!user) return;
    
    setDonationsLoading(true);
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/donations/user`, {
        headers: {
          'Authorization': `Bearer ${authToken}`}});

      if (!response.ok) {
        throw new Error('Failed to fetch donations');
      }

      const data = await response.json();
      if (data.success) {
        setDonations(data.data.donations || []);
        setDonationStats(data.data.stats || null);
        setDonationsError(null);
      } else {
        throw new Error(data.message || 'Failed to fetch donations');
      }
    } catch (error) {
      console.error('Error fetching donations:', error);
      setDonationsError(error.message);
    } finally {
      setDonationsLoading(false);
    }
  };

  // Fetch donation summary (for stats card)
  const fetchDonationSummary = async () => {
    if (!user) return;
    
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/donations/user/summary`, {
        headers: {
          'Authorization': `Bearer ${authToken}`}});

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDonationStats(data.data.totalStats || null);
        }
      }
    } catch (error) {
      console.error('Error fetching donation summary:', error);
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
      fetchDonationSummary();
    }
  }, [user]);

  // Warn on browser/tab close when there are unsaved changes in profile
  useEffect(() => {
    const handler = (e) => {
      if (profileDirty) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [profileDirty]);

  // Block in-app navigation clicks and back/forward while editing profile with unsaved changes (use toast, not alerts)
  useEffect(() => {
    if (!(profileDirty && activeTab === 'profile')) return;

    let lastToast = 0;
    const minGap = 1500;
    const showUnsavedToast = () => {
      const now = Date.now();
      if (now - lastToast > minGap) {
        lastToast = now;
  toast('You have unsaved profile changes. Save or cancel before leaving.', { icon: '⚠️' });
        setUnsavedBlockNotice(true);
      }
    };

    const clickHandler = (e) => {
      const el = e.target.closest ? e.target.closest('a[href]') : null;
      if (el) {
        const href = el.getAttribute('href') || '';
        if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
          e.preventDefault();
          showUnsavedToast();
        }
      }
    };
    const popHandler = (e) => {
      showUnsavedToast();
      history.pushState(null, '', location.href);
    };

    document.addEventListener('click', clickHandler, true);
    window.addEventListener('popstate', popHandler);
    // Push a state so that back will hit our handler first
    history.pushState(null, '', location.href);

    return () => {
      document.removeEventListener('click', clickHandler, true);
      window.removeEventListener('popstate', popHandler);
    };
  }, [profileDirty, activeTab, location.href]);

  // For modal UX, don't auto-close; users dismiss explicitly

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

  useEffect(() => {
    if (user && activeTab === 'donations') {
      fetchUserDonations();
    }
  }, [user, activeTab]);

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
      <div className="flex flex-col justify-center items-center min-h-[60vh] bg-white" style={{ paddingTop: '65px'}}>
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
      <div className="min-h-[60vh] flex flex-col justify-center items-center bg-white" style={{ paddingTop: '65px'}}>
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
        <Toaster position="top-center" gutter={8} />
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'recently-viewed', label: 'Recently Viewed', icon: Eye },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    ...(donationStats?.donationCount > 0 ? [{ id: 'donations', label: 'My Contributions', icon: GraduationCap }] : []),
    { id: 'transactions', label: 'Transactions', icon: CreditCard },
  ];

  // Prevent navigation between tabs if profile has unsaved changes
  const guardedSetActiveTab = (nextTab) => {
    if (profileDirty && activeTab === 'profile' && nextTab !== 'profile') {
  toast('Unsaved profile changes. Save or cancel first.', { icon: '⚠️' });
      setUnsavedBlockNotice(true);
      return;
    }
    setActiveTab(nextTab);
  };

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
                ...(donationStats?.donationCount > 0 ? [{ id: 'donations', label: 'Donations', icon: GraduationCap, color: '#4a7c59', count: donationStats?.donationCount || 0, gradient: 'linear-gradient(135deg, rgba(74, 124, 89, 0.05), rgba(74, 124, 89, 0.02))' }] : []),
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => guardedSetActiveTab(item.id)}
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
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { id: 'profile', label: 'My Profile', icon: User, description: 'View and edit your personal information', color: '#733857', gradient: 'linear-gradient(135deg, rgba(115, 56, 87, 0.04), rgba(115, 56, 87, 0.01))' },
                { id: 'addresses', label: 'Saved Addresses', icon: MapPin, description: 'Manage your delivery locations', color: '#412434', gradient: 'linear-gradient(135deg, rgba(65, 36, 52, 0.04), rgba(65, 36, 52, 0.01))' },
                { id: 'favorites', label: 'My Favorites', icon: Heart, description: 'Your favorite desserts & pastries', color: '#8d4466', count: favorites?.length || 0, gradient: 'linear-gradient(135deg, rgba(141, 68, 102, 0.04), rgba(141, 68, 102, 0.01))' },
                ...(donationStats?.donationCount > 0 ? [{ id: 'donations', label: 'My Contributions', icon: GraduationCap, description: 'Your contribution to student life', color: '#4a7c59', count: donationStats?.donationCount || 0, gradient: 'linear-gradient(135deg, rgba(74, 124, 89, 0.04), rgba(74, 124, 89, 0.01))' }] : []),
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => guardedSetActiveTab(item.id)}
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
            {unsavedBlockNotice && profileDirty && (
              <div className="fixed inset-0 z-[10000]" role="dialog" aria-modal="true" aria-labelledby="unsaved-modal-title">
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/40" onClick={() => setUnsavedBlockNotice(false)}></div>
                {/* Modal */}
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border" style={{ borderColor: '#EF4444', background: 'white' }}>
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#EF4444' }}>
                            <AlertTriangle className="h-7 w-7 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 id="unsaved-modal-title" className="text-xl md:text-2xl font-bold mb-1" style={{ color: '#991B1B' }}>Unsaved changes</h3>
                          <p className="text-sm md:text-base" style={{ color: '#7F1D1D' }}>Save or cancel your edits before leaving this section.</p>
                        </div>
                      </div>
                      <div className="mt-6 flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setUnsavedBlockNotice(false)}
                          className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-gray-50"
                          style={{ borderColor: 'rgba(0,0,0,0.1)', color: '#1F2937' }}
                        >Close</button>
                      </div>
                    </div>
                    <div className="h-1 w-full" style={{ background: 'linear-gradient(to right, #fecaca, #ef4444, #fecaca)' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div className="mb-4">
              <h3 className="text-2xl font-light tracking-wide text-black border-b border-gray-200 pb-3" style={{ letterSpacing: '0.02em' }}>Profile Information</h3>
            </div>
            <Profile onDirtyChange={setProfileDirty} />

            {/* Danger Zone */}
            <div className="mt-8 border rounded-md bg-white">
              <div className="p-4 md:p-6">
                <h4 className="text-lg font-semibold mb-2" style={{ color: '#991B1B' }}>Danger Zone</h4>
                <p className="text-sm mb-4" style={{ color: 'rgba(153,27,27,0.85)' }}>
                  Deleting your account is permanent and cannot be undone.
                </p>
                <button
                  type="button"
                  onClick={() => { setShowDeleteModal(true); setAckPersonal(false); setAckOrders(false); setAckStreak(false); setDeleteError(''); }}
                  className="px-5 py-3 font-semibold rounded-md border transition-colors"
                  style={{ background: '#DC2626', color: 'white', borderColor: '#DC2626' }}
                  onMouseEnter={(e)=>{ e.currentTarget.style.background='#B91C1C'; e.currentTarget.style.borderColor='#B91C1C'; }}
                  onMouseLeave={(e)=>{ e.currentTarget.style.background='#DC2626'; e.currentTarget.style.borderColor='#DC2626'; }}
                >
                  Delete Account
                </button>
              </div>
            </div>

            {/* Delete Account Modal */}
            {showDeleteModal && (
              <div className="fixed inset-0 z-[10010]" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
                <div className="absolute inset-0 bg-black/50" onClick={() => !deleting && setShowDeleteModal(false)}></div>
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl bg-white">
                    <div className="p-6 md:p-8">
                      <h3 id="delete-modal-title" className="text-xl md:text-2xl font-bold mb-2" style={{ color: '#111827' }}>Delete your account?</h3>
                      <p className="text-sm md:text-base mb-4" style={{ color: '#374151' }}>To proceed, please acknowledge all of the following:</p>

                      <div className="space-y-3 md:space-y-4 mb-4">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input type="checkbox" className="mt-1" checked={ackPersonal} onChange={(e)=>setAckPersonal(e.target.checked)} />
                          <span className="text-sm md:text-base">I understand my personal data will be deleted.</span>
                        </label>
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input type="checkbox" className="mt-1" checked={ackOrders} onChange={(e)=>setAckOrders(e.target.checked)} />
                          <span className="text-sm md:text-base">I understand my orders and transactions data will be deleted.</span>
                        </label>
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input type="checkbox" className="mt-1" checked={ackStreak} onChange={(e)=>setAckStreak(e.target.checked)} />
                          <span className="text-sm md:text-base">I understand my order streak and offer/coupon codes will be deleted.</span>
                        </label>
                      </div>

                      {deleteError && (
                        <div className="mb-4 text-sm p-3 rounded-md" style={{ background:'#FEF2F2', color:'#991B1B', border:'1px solid #FCA5A5' }}>
                          {deleteError}
                        </div>
                      )}

                      <div className="mt-2 flex items-center justify-end gap-3">
                        <button
                          type="button"
                          disabled={deleting}
                          onClick={() => setShowDeleteModal(false)}
                          className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ borderColor: 'rgba(0,0,0,0.1)', color: '#1F2937' }}
                        >Cancel</button>
                        <button
                          type="button"
                          disabled={!(ackPersonal && ackOrders && ackStreak) || deleting}
                          onClick={async ()=>{
                            setDeleteError('');
                            setDeleting(true);
                            try {
                              const token = localStorage.getItem('authToken');
                              if (!token) throw new Error('Authentication required');
                              const res = await fetch(`${import.meta.env.VITE_API_URL}/users/${user.uid}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` }
                              });
                              if (!res.ok) {
                                const data = await res.json().catch(()=>({message:'Failed to delete account'}));
                                throw new Error(data.message || 'Failed to delete account');
                              }
                              toast.success('Your account and related data were deleted.');
                              await logout();
                              navigate('/');
                            } catch (err) {
                              console.error('Delete account error:', err);
                              setDeleteError(err.message || 'Failed to delete account. Please try again.');
                            } finally {
                              setDeleting(false);
                            }
                          }}
                          className="px-5 py-2.5 text-sm font-semibold rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ background: '#DC2626', color: 'white' }}
                        >{deleting ? 'Deleting…' : 'Delete Account'}</button>
                      </div>
                    </div>
                    <div className="h-1 w-full" style={{ background: 'linear-gradient(to right, #fecaca, #ef4444, #fecaca)' }}></div>
                  </div>
                </div>
              </div>
            )}
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
          <div className="space-y-4 md:space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-2xl font-medium text-black border-b border-gray-200 pb-2">
                Recently Viewed
                {validRecentlyViewed?.length > 0 && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({validRecentlyViewed.length} items)
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
              <div className="text-center py-4 sm:py-5 md:py-8">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 border-b-2 border-[#733857] mx-auto"></div>
                <p className="mt-2 sm:mt-3 md:mt-4 text-sm sm:text-base text-gray-600">Loading recently viewed items...</p>
              </div>
            ) : validRecentlyViewed.length === 0 ? (
              <div className="text-center py-6 sm:py-8 md:py-12">
                <div className="mx-auto mb-4 sm:mb-6 flex h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 items-center justify-center border border-[#733857]/20">
                  <Eye className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-[#733857]" />
                </div>
                <h4 className="text-xl sm:text-2xl md:text-3xl font-light tracking-wide text-[#1a1a1a] mb-2 sm:mb-3">No recently viewed items</h4>
                <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6 md:mb-8 max-w-md mx-auto">
                  Browse our collection to see your recently viewed products here.
                </p>
                <Link 
                  to="/products" 
                  className="inline-flex items-center gap-2 border border-[#733857] px-4 py-2 sm:px-6 sm:py-3 text-sm font-medium tracking-wide text-[#733857] transition-colors duration-300 hover:bg-[#733857] hover:text-white"
                >
                  Start Browsing
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Recently Viewed Summary */}
               
                
                {/* Recently Viewed Items - Responsive Product Cards */}
                <div className="grid grid-cols-2 gap-3 xs:gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                  {validRecentlyViewed.slice(0, 8).map((item) => {
                    if (!item.productId || !item.productId._id) {
                      console.warn('No product data found for recently viewed item:', item);
                      return null;
                    }
                    
                    const product = item.productId;
                    
                    return (
                      <div key={product._id} className="relative">
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
          <div className="space-y-4 md:space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-2xl font-medium text-black border-b border-gray-200 pb-2">
                My Favorites
                {favorites?.length > 0 && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({favorites.length} items)
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
              <div className="text-center py-4 sm:py-5 md:py-8">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 border-b-2 border-[#733857] mx-auto"></div>
                <p className="mt-2 sm:mt-3 md:mt-4 text-sm sm:text-base text-gray-600">Loading your favorites...</p>
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
              <div className="text-center py-6 sm:py-8 md:py-12">
                <div className="mx-auto mb-4 sm:mb-6 flex h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 items-center justify-center border border-[#733857]/20">
                  <Heart className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-[#733857]" />
                </div>
                <h4 className="text-xl sm:text-2xl md:text-3xl font-light tracking-wide text-[#1a1a1a] mb-2 sm:mb-3">No favorites yet</h4>
                <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6 md:mb-8 max-w-md mx-auto">
                  Save the treats you love to revisit them whenever you like.
                </p>
                <Link 
                  to="/products" 
                  className="inline-flex items-center gap-2 border border-[#733857] px-4 py-2 sm:px-6 sm:py-3 text-sm font-medium tracking-wide text-[#733857] transition-colors duration-300 hover:bg-[#733857] hover:text-white"
                >
                  Browse Products
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Favorites Summary */}
              
                
                {/* Favorites Items Preview - Responsive Product Cards */}
                <div className="grid grid-cols-2 gap-3 xs:gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
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

      case 'donations':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-light tracking-wide text-black border-b border-gray-200 pb-3" style={{ letterSpacing: '0.02em' }}>
                Your Contribution to Student Life
              </h3>
              <div className="text-sm font-medium px-3 py-1.5 rounded-full bg-gradient-to-r from-[#f7eef3] to-[#f1e8ed] text-[#733857]">
                கற்பிப்போம் பயிலகம்
              </div>
            </div>
            
            {donationsLoading ? (
              <div className="bg-white border border-gray-100 p-12 text-center">
                <div className="w-16 h-16 bg-white border border-gray-200 flex items-center justify-center mx-auto mb-6">
                  <GraduationCap className="h-8 w-8 animate-pulse" style={{ color: '#733857' }} />
                </div>
                <h4 className="text-lg font-medium mb-2" style={{ color: '#1a1a1a' }}>Loading Your Contributions...</h4>
                <p className="text-sm tracking-wide" style={{ color: 'rgba(26, 26, 26, 0.5)' }}>Please wait while we fetch your donation history</p>
              </div>
            ) : donationsError ? (
              <div className="bg-white border border-gray-100 p-8 text-center">
                <h4 className="text-lg font-medium mb-2" style={{ color: '#733857' }}>Error Loading Donations</h4>
                <p className="mb-6 text-sm" style={{ color: 'rgba(26, 26, 26, 0.6)' }}>{donationsError}</p>
                <button
                  onClick={fetchUserDonations}
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
            ) : donations.length === 0 ? (
              <div className="bg-white border border-gray-100 p-12 text-center">
                <div className="w-16 h-16 bg-white border border-gray-200 flex items-center justify-center mx-auto mb-6">
                  <GraduationCap className="h-8 w-8" style={{ color: '#733857' }} />
                </div>
                <h4 className="text-lg font-medium mb-2" style={{ color: '#1a1a1a' }}>No Contributions Yet</h4>
                <p className="text-sm tracking-wide mb-6" style={{ color: 'rgba(26, 26, 26, 0.5)' }}>Start making a difference in student lives by adding donations to your orders</p>
                <Link
                  to="/products"
                  className="inline-flex items-center px-6 py-2.5 border text-xs font-bold tracking-widest transition-all duration-300"
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
            ) : (
              <>
                {/* Donation Statistics */}
                {donationStats && (
                  <div className="bg-gradient-to-br from-[#f7eef3] to-[#f1e8ed] rounded-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-[#412434]">
                        Impact Summary
                      </h4>
                      <GraduationCap className="h-6 w-6 text-[#733857]" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[#733857]">₹{donationStats.totalAmount || 0}</div>
                        <div className="text-xs text-[#8d4466] font-medium uppercase tracking-wider">Total Donated</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[#733857]">{donationStats.donationCount || 0}</div>
                        <div className="text-xs text-[#8d4466] font-medium uppercase tracking-wider">Contributions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[#733857]">
                          {donationStats.lastDonation 
                            ? new Date(donationStats.lastDonation).toLocaleDateString('en-US', { month: 'short' })
                            : 'N/A'
                          }
                        </div>
                        <div className="text-xs text-[#8d4466] font-medium uppercase tracking-wider">Last Contribution</div>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-white/50 rounded-md">
                      <p className="text-xs text-[#412434] text-center font-medium">
                        Thank you for supporting education initiatives and making a difference in student lives! 🎓
                      </p>
                    </div>
                  </div>
                )}

                {/* Donations List */}
                <div className="space-y-4">
                  {donations.map((donation, index) => (
                    <div key={index} className="bg-white border border-gray-100 p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <GraduationCap className="h-4 w-4 text-[#733857]" />
                            <span className="font-semibold text-[#412434]">
                              {donation.initiativeName}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {donation.initiativeDescription}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Order: #{donation.orderNumber}</span>
                            <span>•</span>
                            <span>{new Date(donation.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short', 
                              day: 'numeric'
                            })}</span>
                            <span>•</span>
                            <span className="capitalize">{donation.paymentMethod}</span>
                            <span>•</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              donation.paymentStatus === 'completed' 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {donation.paymentStatus}
                            </span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-xl font-bold text-[#733857]">₹{donation.donationAmount}</div>
                          {donation.deliveryLocation && (
                            <div className="text-xs text-gray-500 mt-1">
                              📍 {donation.deliveryLocation}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {donations.length > 0 && (
                  <div className="text-center pt-6 border-t border-gray-100">
                    <p className="text-sm text-gray-600 mb-2">
                      Keep making a difference! Add donations to your next order.
                    </p>
                    <Link 
                      to="/products"
                      className="inline-flex items-center px-4 py-2 text-xs font-medium text-[#733857] hover:text-white hover:bg-[#733857] border border-[#733857] transition-all duration-300"
                    >
                      Continue Shopping
                    </Link>
                  </div>
                )}
              </>
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
                          <div className="w-10 h-10 flex items-center justify-center">
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
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                              Status: {payment.orderInfo.orderStatus}
                            </p>
                            {payment.orderId && (
                              <Link
                                to={`/orders/${payment.orderId}`}
                                className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-[#733857] text-white hover:bg-[#8d4466] transition-colors rounded"
                              >
                                <ExternalLink className="w-3 h-3" />
                                View Order
                              </Link>
                            )}
                          </div>
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
    <div className="min-h-screen overflow-x-hidden max-w-full" style={{ background: 'linear-gradient(to bottom, #fdfbf9 0%, #ffffff 40%, #fdfbf9 100%)' }}>
      
      {/* Beautiful Profile Hero - Only show on main tab for small/medium devices */}
      {activeTab === 'main' && (
        <div className="relative overflow-hidden max-w-full lg:hidden" style={{ 
          background: 'linear-gradient(135deg, #fffcfe 0%, #fff5f8 30%, #fef2f5 50%, #fff5f8 70%, #fffcfe 100%)',
          borderBottom: '1px solid rgba(115, 56, 87, 0.15)'
        }}>
          
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-12 lg:py-16">
            <div className="flex flex-col gap-4 sm:gap-6 md:gap-8">{" "}
              {/* User Profile Info with Beautiful Layout */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                <div className="relative group flex-shrink-0">
                  {/* Profile Photo with Elegant Frame */}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full sm:rounded-none" style={{
                    boxShadow: '0 8px 24px rgba(115, 56, 87, 0.12)'
                  }}>
                    <div className="absolute inset-0 border-2 rounded-full sm:rounded-none" style={{ 
                      borderColor: '#733857',
                      background: 'linear-gradient(135deg, rgba(253, 251, 249, 0.9), rgba(255, 245, 240, 0.9))'
                    }}></div>
                    <div className="absolute inset-2 bg-white overflow-hidden rounded-full sm:rounded-none">
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
                          <User className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12" style={{ color: '#733857', opacity: 0.4 }} />
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Premium Badge */}
               
                </div>
                
                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light mb-1 sm:mb-2" style={{ 
                    color: '#281c20',
                    letterSpacing: '0.03em'
                  }}>
                    {user?.name || 'Guest'}
                  </h1>
                  <p className="text-xs sm:text-sm mb-3 sm:mb-4" style={{ 
                    color: 'rgba(40, 28, 32, 0.6)',
                    letterSpacing: '0.02em'
                  }}>
                    {user?.email || 'guest@example.com'}
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: '#733857', opacity: 0.7 }} strokeWidth={1.5} />
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

              {/* Elegant Stats Cards - Hidden on large screens */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
                {[
                  { icon: Package, value: orders?.length || 0, label: 'Orders', color: '#733857' },
                  { icon: Heart, value: favorites?.length || 0, label: 'Favorites', color: '#8d4466' },
                  { icon: GraduationCap, value: donationStats?.donationCount || 0, label: 'Contributions', color: '#412434' }
                ].map((stat, index) => (
                  <div key={index} className="relative group">
                    <div className="p-2 sm:p-3 md:p-4 lg:p-6 text-center transition-all duration-300">
                      <stat.icon className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 mx-auto mb-1 sm:mb-2 md:mb-3 transition-transform duration-300 group-hover:scale-110" 
                        style={{ color: stat.color, opacity: 0.8 }} 
                        strokeWidth={1.5} 
                      />
                      <div className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-light mb-0.5 sm:mb-1 md:mb-2" style={{ 
                        color: stat.color,
                        letterSpacing: '0.02em'
                      }}>
                        {stat.value}
                      </div>
                      <div className="text-[8px] sm:text-[10px] md:text-xs uppercase tracking-wider font-medium" style={{ 
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
        <div className="bg-white border-b border-gray-200 py-3 md:py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <button 
              onClick={() => guardedSetActiveTab('main')}
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {activeTab === 'main' ? (
          /* Desktop: Show sidebar + content, Mobile: Show menu grid */
          <div className="hidden lg:grid lg:grid-cols-4 lg:gap-8">
            {/* Minimal Profile Card Layout - Desktop Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white sticky top-24 border border-gray-100">
                {/* Profile Card Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full border-2 border-[#722F37] overflow-hidden mb-3">
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
                        <div className="w-full h-full flex items-center justify-center bg-gray-50">
                          <User className="h-10 w-10 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-base font-medium text-[#281C20] mb-1">
                      {user?.name || 'Guest'}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {user?.email || 'guest@example.com'}
                    </p>
                  </div>
                </div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-px bg-gray-100 border-b border-gray-100">
                  <div className="bg-white p-4 text-center">
                    <div className="text-lg font-semibold text-[#722F37]">{orders?.length || 0}</div>
                    <div className="text-xs text-gray-500 uppercase">Orders</div>
                  </div>
                  <div className="bg-white p-4 text-center">
                    <div className="text-lg font-semibold text-[#722F37]">{favorites?.length || 0}</div>
                    <div className="text-xs text-gray-500 uppercase">Saved</div>
                  </div>
                  <div className="bg-white p-4 text-center">
                    <div className="text-lg font-semibold text-[#722F37]">{donationStats?.donationCount || 0}</div>
                    <div className="text-xs text-gray-500 uppercase">Gifts</div>
                  </div>
                </div>
                
                {/* Navigation Menu */}
                <nav className="p-3">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => guardedSetActiveTab(tab.id)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded group"
                    >
                      <div className="flex items-center gap-3">
                        <tab.icon className="h-4 w-4 text-gray-400 group-hover:text-[#722F37] transition-colors" strokeWidth={2} />
                        <span className="font-medium">{tab.label}</span>
                      </div>
                      {tab.id === 'favorites' && favorites?.length > 0 && (
                        <span className="text-xs font-semibold text-[#722F37] bg-[#722F37]/10 px-2 py-0.5 rounded-full">
                          {favorites.length}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>

                {/* Logout Button */}
                <div className="p-3 border-t border-gray-100">
                  <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors rounded"
                  >
                    <LogOut className="h-4 w-4" strokeWidth={2} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Desktop Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-white  min-h-[400px]">
                <div className="p-6 sm:p-8">
                  {activeTab === 'main' ? (
                    <div className="relative overflow-hidden" style={{
                      background: 'linear-gradient(135deg, rgba(255, 252, 254, 0.5) 0%, rgba(254, 242, 245, 0.3) 100%)',
                      border: '1px solid rgba(115, 56, 87, 0.08)'
                    }}>
                      {/* Decorative accent */}
                      <div className="absolute top-0 right-0 w-32 h-32 opacity-5" style={{
                        background: 'radial-gradient(circle, rgba(190, 24, 93, 0.3) 0%, transparent 70%)'
                      }}></div>
                      
                      <div className="relative py-12 sm:py-16 lg:py-20 px-4 sm:px-6 text-center">
                        {/* Icon with elegant frame */}
                        <div className="relative inline-block mb-6 sm:mb-8">
                          <div className="absolute inset-0 blur-xl opacity-20" style={{ background: 'linear-gradient(135deg, #733857, #BE185D)' }}></div>
                          <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto border-2 flex items-center justify-center transition-all duration-500 hover:scale-110" style={{
                            borderColor: 'rgba(115, 56, 87, 0.2)',
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(253, 242, 248, 0.6))',
                            backdropFilter: 'blur(10px)',
                            boxShadow: '0 8px 32px rgba(115, 56, 87, 0.12)'
                          }}>
                            <User className="h-10 w-10 sm:h-12 sm:w-12" style={{ 
                              color: '#733857',
                              opacity: 0.7
                            }} strokeWidth={1.5} />
                          </div>
                        </div>
                        
                        {/* Heading */}
                        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extralight mb-3 sm:mb-4" style={{ 
                          color: '#281c20',
                          letterSpacing: '0.05em'}}>
                          Welcome to Your Account
                        </h3>
                        
                        {/* Description */}
                        <p className="text-xs sm:text-sm lg:text-base max-w-md mx-auto mb-6 sm:mb-8" style={{ 
                          color: 'rgba(40, 28, 32, 0.6)',
                          letterSpacing: '0.02em',
                          lineHeight: '1.6'}}>
                          Select an option from the menu to manage your profile, view orders, and explore your account
                        </p>
                        
                        {/* Action cards */}
                     
                      </div>
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
            {/* Minimal Profile Card Layout - Desktop Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white sticky top-24 border border-gray-100">
                {/* Profile Card Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full border-2 border-[#722F37] overflow-hidden mb-3">
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
                        <div className="w-full h-full flex items-center justify-center bg-gray-50">
                          <User className="h-10 w-10 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-base font-medium text-[#281C20] mb-1">
                      {user?.name || 'Guest'}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {user?.email || 'guest@example.com'}
                    </p>
                  </div>
                </div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-px bg-gray-100 border-b border-gray-100">
                  <div className="bg-white p-4 text-center">
                    <div className="text-lg font-semibold text-[#722F37]">{orders?.length || 0}</div>
                    <div className="text-xs text-gray-500 uppercase">Orders</div>
                  </div>
                  <div className="bg-white p-4 text-center">
                    <div className="text-lg font-semibold text-[#722F37]">{favorites?.length || 0}</div>
                    <div className="text-xs text-gray-500 uppercase">Saved</div>
                  </div>
                  <div className="bg-white p-4 text-center">
                    <div className="text-lg font-semibold text-[#722F37]">{donationStats?.donationCount || 0}</div>
                    <div className="text-xs text-gray-500 uppercase">Gifts</div>
                  </div>
                </div>
                
                {/* Navigation Menu */}
                <nav className="p-3">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => guardedSetActiveTab(tab.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors rounded group ${
                        activeTab === tab.id 
                          ? 'bg-[#722F37]/10 text-[#722F37]' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <tab.icon className={`h-4 w-4 transition-colors ${
                          activeTab === tab.id ? 'text-[#722F37]' : 'text-gray-400 group-hover:text-[#722F37]'
                        }`} strokeWidth={2} />
                        <span className="font-medium">{tab.label}</span>
                      </div>
                      {tab.id === 'favorites' && favorites?.length > 0 && (
                        <span className="text-xs font-semibold text-[#722F37] bg-[#722F37]/10 px-2 py-0.5 rounded-full">
                          {favorites.length}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>

                {/* Logout Button */}
                <div className="p-3 border-t border-gray-100">
                  <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors rounded"
                  >
                    <LogOut className="h-4 w-4" strokeWidth={2} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Desktop Main Content with Selected Component */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 min-h-[400px]">
                <div className="p-4 md:p-6 lg:p-8">
                  {renderContent()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Content view for specific sections */}
        {activeTab !== 'main' && (
          <div className="lg:hidden bg-white border border-gray-200 min-h-[400px]">
            <div className="p-4 md:p-6 lg:p-8">
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
              <div className="p-4 md:p-6">
                {/* Admin Dashboard quick access (mobile only) */}
                {isAdmin && (
                  <div className="mb-6">
                    <Link
                      to="/admin/dashboard"
                      className="w-full flex items-center justify-between px-4 py-3 bg-black text-white shadow-sm hover:shadow-md transition-all duration-300"
                      style={{  }}
                    >
                      <span className="flex items-center gap-2 font-semibold">
                        <LayoutDashboard className="h-5 w-5" />
                        Admin Dashboard
                      </span>
                      <span className="text-xs opacity-80">Open</span>
                    </Link>
                  </div>
                )}
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
                      onClick={() => guardedSetActiveTab(tab.id)}
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
      {/* Page-level toaster for consistent notifications */}
      <Toaster position="top-center" gutter={10} toastOptions={{
        style: { fontSize: '0.9rem' },
        duration: 4000
      }} />
    </div>
  );
};

export default ProfilePage;





