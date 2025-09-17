import React, { useState, useEffect, useRef, useMemo, memo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext/AuthContext';
import { useLocation as useLocationContext } from '../../context/LocationContext/LocationContext';
import { useCart } from '../../context/CartContext';
import { useCategory } from '../../context/CategoryContext/CategoryContext';
import './Header.css';
import './remove-focus.css';
import './hide-search.css';

// Import UserMenu component
import UserMenu from './UserMenu/UserMenu';

// Import icons
import { 
  User, 
  Menu, 
  X, 
  MapPin, 
  ChevronDown,
  ShoppingBag,
  AlertTriangle,
  Settings,
  Package
} from 'lucide-react';

const Header = ({ isAdminView = false }) => {
  const { 
    user,
    toggleAuthPanel,
    logout
  } = useAuth();
  
  const {
    locations,
    loading: locationsLoading,
    updateUserLocation,
    getCurrentLocationName,
    hasValidDeliveryLocation
  } = useLocationContext();
  
  const { cartCount } = useCart();

  // Get categories from CategoryContext
  const { 
    categories: dbCategories, 
    loading: categoriesLoading,
    error: categoriesError 
  } = useCategory();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const locationDropdownRef = useRef(null);
  const categorySliderRef = useRef(null);
  
  // Check if we're on a cart or payment page
  const isCartOrPaymentPage = location.pathname === '/cart' || location.pathname === '/payment';
  
  // Memoize values that should only update when their dependencies change
  const memoizedCartCount = useMemo(() => cartCount, [cartCount]);
  
  // Use categories from database or fall back to empty array
  const categories = useMemo(() => {
    if (!dbCategories || dbCategories.length === 0) {
      return [];
    }
    
    return dbCategories
      .filter(category => category.isActive)
      .map(category => ({
        _id: category._id,
        id: category._id,
        name: category.name,
        featuredImage: category.featuredImage || null,
        images: category.images || [],
      }));
  }, [dbCategories]);
  
  // Get user's location display name
  const [userLocationDisplay, setUserLocationDisplay] = useState('Select Location');
  
  // Memoize location display to prevent unnecessary re-calculations
  const memoizedUserLocationDisplay = useMemo(() => {
    return userLocationDisplay;
  }, [userLocationDisplay]);
  
  // Update location display once when user changes
  const locationDisplayInitialized = useRef(false);
  const prevLocationIdRef = useRef(user?.location?._id);
  
  useEffect(() => {
    if (user?.location && user.location.area && user.location.city) {
      if (user.hostel && user.hostel.name) {
        setUserLocationDisplay(`${user.hostel.name}, ${user.location.area}`);
      } else {
        setUserLocationDisplay(`${user.location.area}, ${user.location.city}`);
      }
      prevLocationIdRef.current = user.location._id;
    } else {
      setUserLocationDisplay('Select Location');
      prevLocationIdRef.current = null;
    }
    locationDisplayInitialized.current = true;
  }, [user?.uid, user?.location?._id]);

  // Handle scroll event to change header styling
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // Clean up body scroll lock when component unmounts
  useEffect(() => {
    const header = document.querySelector('header');
    if (header) {
      document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
    }
    
    const handleResize = () => {
      const header = document.querySelector('header');
      if (header) {
        document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Handle mobile menu body scroll lock/unlock
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);
  
  // Close location dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target)) {
        setIsLocationDropdownOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Handle location selection with useCallback for better performance
  const handleLocationSelect = useCallback((locationId) => {
    setIsLocationDropdownOpen(false);
    
    if (user) {
      // Navigate to profile page instead of directly updating location
      navigate('/profile');
    } else {
      toggleAuthPanel();
    }
  }, [user, navigate, toggleAuthPanel]);
  
  // Toggle mobile menu with body scroll lock
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Helper function to close mobile menu and ensure scroll restoration
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };
  
  // Toggle location dropdown with useCallback for performance
  const toggleLocationDropdown = useCallback(() => {
    setIsLocationDropdownOpen(prev => !prev);
  }, []);
  
  // Handle category selection with useCallback
  const handleCategorySelect = useCallback((categoryId) => {
    setSelectedCategory(categoryId);
    
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
    
    window.location.href = `/products?category=${categoryId}`;
  }, [isMobileMenuOpen]);
  
  // Render breadcrumb for cart/payment pages
  const renderBreadcrumb = () => {
    if (location.pathname === '/cart') {
      return (
        <div className="flex items-center text-xs sm:text-sm text-black px-2 sm:px-4 py-2 sm:py-3 bg-gray-100" style={{fontFamily: 'sans-serif'}}>
          <Link to="/" className="text-black">Home</Link>
          <span className="mx-1 sm:mx-2">/</span>
          <span className="font-medium text-black truncate">Shopping Box</span>
        </div>
      );
    } else if (location.pathname === '/payment') {
      return (
        <div className="flex items-center text-xs sm:text-sm text-black px-2 sm:px-4 py-2 sm:py-3 bg-gray-100 overflow-x-auto whitespace-nowrap" style={{fontFamily: 'sans-serif'}}>
          <Link to="/" className="text-black flex-shrink-0">Home</Link>
          <span className="mx-1 sm:mx-2 flex-shrink-0">/</span>
          <Link to="/cart" className="text-black flex-shrink-0">Shopping Box</Link>
          <span className="mx-1 sm:mx-2 flex-shrink-0">/</span>
          <span className="font-medium text-black flex-shrink-0">Checkout</span>
        </div>
      );
    }
    return null;
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-white transition-all duration-300 ${isScrolled ? 'shadow-md' : ''}`} style={{fontFamily: 'sans-serif'}}>
      {/* Top Bar - City Selector (hidden in admin view) */}
      {!isAdminView && (
        <div className="bg-white py-2 sm:py-3 px-3 sm:px-5 border-b border-gray-100 shadow-sm">
          <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
            <div className="relative w-full sm:w-auto" ref={locationDropdownRef}>
              <button 
                className="flex items-center text-xs sm:text-sm text-black hover:text-gray-700 transition-colors duration-200 py-1 px-2 rounded-md hover:bg-gray-50"
                onClick={toggleLocationDropdown}
                style={{fontFamily: 'sans-serif'}}
              >
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                <span className="truncate max-w-[140px] sm:max-w-[180px] font-medium">{memoizedUserLocationDisplay}</span>
                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 ml-2 text-gray-500" />
                {user && !hasValidDeliveryLocation() && (
                  <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 ml-2 text-amber-500" />
                )}
              </button>
              
              {/* City Dropdown */}
              {isLocationDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-full sm:w-72 bg-white shadow-xl rounded-lg overflow-hidden z-50 border border-gray-100" style={{fontFamily: 'sans-serif'}}>
                  <div className="px-4 py-3 bg-black text-white border-b border-gray-800">
                    <h3 className="text-xs font-medium tracking-wider">AVAILABLE DELIVERY LOCATIONS</h3>
                  </div>
                  {locationsLoading ? (
                    <div className="p-5 text-center">
                      <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
                      <p className="mt-2 text-sm">Loading locations...</p>
                    </div>
                  ) : locations.length > 0 ? (
                    <ul className="py-2 max-h-60 sm:max-h-72 overflow-y-auto">
                      {locations.map((location) => (
                        <li key={location._id} className="hover:bg-gray-50 transition-colors duration-150">
                          <button
                            className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm ${
                              user?.location?._id === location._id
                                ? 'bg-gray-50 text-black font-medium border-l-2 border-black'
                                : 'text-black'
                            }`}
                            onClick={() => handleLocationSelect(location._id)}
                            style={{fontFamily: 'sans-serif'}}
                          >
                            {location.area}, {location.city}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 text-center text-xs sm:text-sm text-black">No delivery locations available</div>
                  )}
                  <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-200">
                    <p className="text-xs text-gray-600 italic text-center" style={{fontFamily: 'sans-serif'}}>
                      Orders can only be placed in these locations
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Middle Bar - Logo and Profile/Login */}
      <div className="py-2 sm:py-3 px-2 sm:px-4 bg-white">
        <div className="container mx-auto flex justify-between items-center">
          {/* Logo Text on Left with Navigation Links beside it - Hidden on mobile */}
          <div className="hidden md:flex items-center">
            <div className="flex items-center">
              <Link to="/" className="flex items-center header-logo-text">
                <span className="text-lg sm:text-xl md:text-2xl font-bold text-black truncate max-w-[120px] sm:max-w-none" style={{fontFamily: 'sans-serif'}}>La Patisserie</span>
              </Link>
            </div>
            
            {/* Navigation Links moved next to logo text on the same line */}
            <div className="flex items-center ml-4 md:ml-6 lg:ml-8 space-x-4 md:space-x-6 lg:space-x-8">
              <Link to="/special" className="text-sm md:text-base text-black" style={{fontFamily: 'sans-serif'}}>Special Deals</Link>
              <Link to="/products" className="text-sm md:text-base text-black" style={{fontFamily: 'sans-serif'}}>Menu</Link>
            </div>
          </div>
          
          {/* Navigation Links - Desktop (user/cart section) */}
          <div className="hidden md:flex items-center space-x-6">
            
            {user && (
              <>
                {/* User Menu - Uses role-based display */}
                <UserMenu />
                
                {/* Cart component */}
                <Link to="/cart" className="flex items-center text-black relative" style={{fontFamily: 'sans-serif'}}>
                  <ShoppingBag className="h-5 w-5 mr-1" />
                  <span>Box ({memoizedCartCount})</span>
                  {memoizedCartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-black text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                      {memoizedCartCount}
                    </span>
                  )}
                </Link>
              </>
            )}
            
            {!user && (
              <button 
                onClick={toggleAuthPanel}
                className="flex items-center text-black"
                style={{fontFamily: 'sans-serif'}}
              >
                <User className="h-5 w-5 mr-1" />
                <span>Login / Signup</span>
              </button>
            )}
            
            {/* Logo image on right */}
            <Link to="/" className="flex items-center ml-4 header-logo-image">
              <img src="/images/logo.png" alt="Sweet Cake Logo" className="h-12 sm:h-14" />
            </Link>
          </div>
          
          {/* Mobile Icons */}
          <div className="flex justify-between items-center w-full md:hidden">
            {/* User icon for mobile on left */}
            {!user ? (
              <button 
                onClick={toggleAuthPanel}
                className="text-black p-1"
                aria-label="Login"
              >
                <User className="h-6 w-6" />
              </button>
            ) : (
              <Link to="/profile" className="text-black p-1" aria-label="Profile">
               <User className="h-6 w-6" />
              </Link>
            )}
            
            {/* Center Logo Image (only image, no text) */}
            <Link to="/" className="flex items-center justify-center">
              <img src="/images/logo.png" alt="Sweet Cake Logo" className="h-12" />
            </Link>
            
            {/* Mobile Menu Button */}
            <button 
              className="text-black p-1"
              onClick={toggleMobileMenu}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 md:hidden ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={toggleMobileMenu}
      ></div>
      
      {/* Mobile Menu */}
      <div 
        className={`md:hidden fixed inset-y-0 right-0 w-[80%] max-w-xs bg-white z-50 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0 shadow-xl' : 'translate-x-full'
        } flex flex-col`}
        style={{fontFamily: 'sans-serif'}}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <Link to="/" className="flex items-center" onClick={() => closeMobileMenu()}>
            <img src="/images/logo.png" alt="Sweet Cake Logo" className="h-14" />
            <span className="ml-2 text-lg font-bold text-black" style={{fontFamily: 'sans-serif'}}>La Patisserie</span>
          </Link>
          <button 
            className="text-black p-1"
            onClick={toggleMobileMenu}
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          {/* Mobile Search - Redirects to products page */}
          <div className="relative mb-6">
            <input 
              type="text" 
              placeholder="Search for cakes, cookies, etc..." 
              className="w-full py-2 px-4 pr-10 rounded-full border border-gray-300"
              style={{fontFamily: 'sans-serif'}}
              onFocus={(e) => {
                e.preventDefault();
                closeMobileMenu();
                navigate('/products');
              }}
            />
          </div>
          
          {/* Mobile Nav Links - Elegant Design */}
          <nav className="space-y-1">
            {/* Account Section */}
            <div className="mb-8">
              <div className="px-4 py-3 bg-gradient-to-r from-black to-gray-900 -mx-4 mb-6">
                <h3 className="text-sm font-light tracking-widest text-white uppercase" style={{fontFamily: 'sans-serif'}}>
                  ACCOUNT
                </h3>
              </div>
              
              {user ? (
                <div className="space-y-2">
                  {user.role === 'admin' ? (
                    <>
                      <MobileNavLink 
                        to="/admin/dashboard" 
                        label="DASHBOARD"
                        onClick={() => closeMobileMenu()}
                      />
                      <MobileNavLink 
                        to="/admin/orders" 
                        label="ORDER MANAGEMENT"
                        onClick={() => closeMobileMenu()}
                      />
                    </>
                  ) : (
                    <MobileNavLink 
                      to="/profile" 
                      label="MY PROFILE"
                      onClick={() => closeMobileMenu()}
                    />
                  )}
                  <MobileNavButton 
                    onClick={() => {
                      logout();
                      closeMobileMenu();
                    }}
                    label="SIGN OUT"
                    variant="logout"
                  />
                </div>
              ) : (
                <MobileNavButton 
                  onClick={() => {
                    toggleAuthPanel();
                    closeMobileMenu();
                  }}
                  label="LOGIN / REGISTER"
                  variant="primary"
                />
              )}
            </div>
            
            {/* Navigation Section */}
            <div>
              <div className="px-4 py-3 bg-gradient-to-r from-gray-100 to-white -mx-4 mb-6 border-y border-gray-200">
                <h3 className="text-sm font-light tracking-widest text-black uppercase" style={{fontFamily: 'sans-serif'}}>
                  NAVIGATION
                </h3>
              </div>
              
              <div className="space-y-2">
                {/* Cart with Badge */}
                <div className="relative">
                  <MobileNavLink 
                    to="/cart" 
                    label="SHOPPING BOX"
                    onClick={() => closeMobileMenu()}
                  />
                  {memoizedCartCount > 0 && (
                    <div className="absolute right-6 top-1/2 transform -translate-y-1/2">
                      <span className="bg-black text-white text-xs px-2 py-1 tracking-wider font-light" style={{fontFamily: 'sans-serif'}}>
                        {memoizedCartCount}
                      </span>
                    </div>
                  )}
                </div>
                
                <MobileNavLink 
                  to="/products" 
                  label="FULL MENU"
                  onClick={() => closeMobileMenu()}
                />

                <MobileNavLink 
                  to="/special" 
                  label="SPECIAL OFFERS"
                  onClick={() => closeMobileMenu()}
                />
              </div>
            </div>
          </nav>
        </div>
        
        {/* Mobile menu footer - Elegant Location Display */}
        <div className="mt-auto border-t border-gray-300">
          <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-white">
            <div className="text-xs font-light tracking-widest text-gray-600 uppercase mb-2" style={{fontFamily: 'sans-serif'}}>
              DELIVERY LOCATION
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <span className="text-sm font-light text-black truncate max-w-[180px] block" style={{fontFamily: 'sans-serif'}}>
                  {userLocationDisplay}
                </span>
              </div>
              <button 
                className="
                  px-4 py-2 text-xs font-light tracking-widest
                  bg-black text-white
                  hover:bg-gray-800
                  transition-colors duration-300
                "
                style={{fontFamily: 'sans-serif'}}
                onClick={() => {
                  closeMobileMenu();
                  navigate('/profile');
                }}
              >
                CHANGE
              </button>
            </div>
          </div>
        </div>
      </div>

    </header>
  );
};

// Mobile Navigation Link Component - Elegant Design
const MobileNavLink = ({ to, label, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="
      block px-6 py-4
      text-black text-sm font-light tracking-wider
      border-l-2 border-transparent
      hover:border-l-black hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent
      transition-all duration-300
      group relative
    "
    style={{fontFamily: 'sans-serif'}}
  >
    <span className="relative z-10">{label}</span>
    <div className="absolute bottom-0 left-6 right-6 h-px bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
  </Link>
);

// Mobile Navigation Button Component - For Actions
const MobileNavButton = ({ onClick, label, variant = 'default' }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return `
          bg-gradient-to-r from-black to-gray-900 text-white
          hover:from-gray-800 hover:to-gray-700
          border border-gray-800
        `;
      case 'logout':
        return `
          bg-gradient-to-r from-gray-100 to-white text-black
          hover:from-gray-200 hover:to-gray-100
          border border-gray-300
        `;
      default:
        return `
          bg-white text-black border border-gray-300
          hover:bg-gray-50
        `;
    }
  };

  return (
    <button
      onClick={onClick}
      className={`
        block w-full px-6 py-4
        text-sm font-light tracking-wider text-left
        transition-all duration-300
        ${getVariantStyles()}
      `}
      style={{fontFamily: 'sans-serif'}}
    >
      <span className="relative z-10">{label}</span>
    </button>
  );
};

// Export as memoized component to prevent unnecessary re-renders
export default memo(Header);