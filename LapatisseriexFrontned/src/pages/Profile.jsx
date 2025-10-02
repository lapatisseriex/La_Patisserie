import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Profile from '../components/Auth/Profile/Profile';
import CartComponent from '../components/common/CartComponent';
import FavoritesComponent from '../components/common/FavoritesComponent';
import useInitializeUserData from '../hooks/useInitializeUserData';
import './ProfileStyles.css';
import { useFavorites } from '../context/FavoritesContext/FavoritesContext';
import { 
  User, 
  Package, 
  ShoppingCart, 
  LogOut, 
  Crown,
  Settings,
  MapPin,
  Lock,
  Phone,
  Truck,
  Heart,
  CreditCard,
  Bell,
  Eye,
  Edit3,
  MoreVertical
} from 'lucide-react';

const ProfilePage = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('main');
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const { favorites, loading: favLoading, error: favError } = useFavorites();
  
  // Initialize user data (cart and favorites) when user logs in
  useInitializeUserData();
  
  // Log user data to check profile photo
  console.log('Profile Page - User data:', user);
  console.log('Profile Photo data:', user?.profilePhoto);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };



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
    { id: 'tracking', label: 'Order Tracking', icon: Truck },
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
                { id: 'tracking', label: 'Order Tracking', icon: Truck, color: 'bg-green-50' },
                { id: 'addresses', label: 'Saved Addresses', icon: MapPin, color: 'bg-purple-50' },
                { id: 'security', label: 'Security', icon: Lock, color: 'bg-gray-50' },
                { id: 'cart', label: 'Shopping Cart', icon: ShoppingCart, color: 'bg-rose-50' },
                { id: 'favorites', label: 'Favorites', icon: Heart, color: 'bg-red-50' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className="flex flex-col items-center justify-center p-3 border border-gray-200 bg-white hover:bg-gray-50 transition-all duration-300 shadow-sm no-scrollbar aspect-square"
                >
                  <div className={`p-3 rounded-full ${item.color} mb-2`}>
                    <item.icon className="h-5 w-5 text-gray-700" />
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
                { id: 'tracking', label: 'Order Tracking', icon: Truck, description: 'Track your active deliveries', color: 'bg-green-50' },
                { id: 'addresses', label: 'Saved Addresses', icon: MapPin, description: 'Manage your saved addresses', color: 'bg-purple-50' },
                { id: 'security', label: 'Security', icon: Lock, description: 'Manage security settings', color: 'bg-gray-50' },
                { id: 'cart', label: 'Shopping Cart', icon: ShoppingCart, description: 'View items in your cart', color: 'bg-rose-50' },
                { id: 'favorites', label: 'Favorites', icon: Heart, description: 'View your favorite products', color: 'bg-red-50' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className="flex items-center justify-between gap-3 px-5 py-4 border border-gray-200 bg-white hover:bg-gray-50 transition-all duration-300 shadow-sm rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${item.color} flex-shrink-0`}>
                      <item.icon className="h-5 w-5 text-gray-700" />
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
          </div>
        );

      case 'tracking':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-serif font-semibold text-black border-b border-gray-200 pb-2">Order Tracking</h3>
            </div>
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-10 text-center shadow-md">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-200 shadow-md">
                <Truck className="h-10 w-10 text-gray-500" />
              </div>
              <h4 className="text-xl font-serif font-medium text-black mb-3">No Active Deliveries</h4>
              <p className="text-gray-600">Track your sweet treats in real-time once they're on the way</p>
            </div>
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
                    {typeof user.location === 'object' 
                      ? `${user.location.area}, ${user.location.city} - ${user.location.pincode}`
                      : 'Location not specified'
                    }
                  </p>
                  {user.hostel && (
                    <p className="text-gray-500 text-sm mt-1">
                      Hostel: {typeof user.hostel === 'object' ? user.hostel.name : user.hostel}
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
              {/* Change Phone Number */}
              <div className="border-2 border-gray-200 rounded-none p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Phone className="h-5 w-5 text-gray-600" />
                      Phone Number
                    </h4>
                    <p className="text-gray-600 text-sm mt-1">
                      Current: {user.phone || 'Not set'}
                    </p>
                  </div>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-none hover:bg-gray-50 transition-colors">
                    Change Number
                  </button>
                </div>
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
              <h3 className="text-2xl font-serif font-semibold text-black border-b border-gray-200 pb-2">Shopping Cart</h3>
              <Link 
                to="/cart" 
                className="px-5 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors shadow-md font-medium"
              >
                View Full Cart
              </Link>
            </div>
            <CartComponent showHeader={false} isProfileTab={true} />
          </div>
        );

      case 'favorites':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-2xl font-serif font-semibold text-black border-b border-gray-200 pb-2">My Favorites</h3>
              <Link 
                to="/favorites" 
                className="px-5 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors shadow-md font-medium"
              >
                View All Favorites
              </Link>
            </div>
            <FavoritesComponent showHeader={false} isProfileTab={true} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-4 sm:py-8 pt-4 sm:pt-8 px-3 sm:px-6 profile-page-container no-scrollbar">
      <div className="bg-white shadow-xl rounded-2xl border border-gray-100 transition-all duration-300 hover:shadow-2xl no-scrollbar">
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
                    Welcome, <span className="font-medium">{user?.name || user?.phone || 'User'}</span>
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





