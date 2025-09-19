import React, { useState, useEffect, useRef, useMemo, memo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext/AuthContext';
import { useLocation as useLocationContext } from '../../context/LocationContext/LocationContext';
import { useCart } from '../../context/CartContext';
import { useCategory } from '../../context/CategoryContext/CategoryContext';
import { useFavorites } from '../../context/FavoritesContext/FavoritesContext';
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
  Heart,
  AlertTriangle,
  Settings,
  Package,
  Home,
  Star,
  Gift,
  UserCircle,
  LogOut,
  ShoppingCart,
  Utensils,
  Crown,
  Sparkles,
  Power
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
  const { favorites } = useFavorites();

  // Get categories from CategoryContext
  const { 
    categories: dbCategories, 
    loading: categoriesLoading,
    error: categoriesError 
  } = useCategory();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState('up');
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [hideLocationBar, setHideLocationBar] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const locationDropdownRef = useRef(null);
  const categorySliderRef = useRef(null);
  
  // Check if we're on a cart or payment page
  const isCartOrPaymentPage = location.pathname === '/cart' || location.pathname === '/payment';
  
  // Check if we're on the products page
  const isProductsPage = location.pathname === '/products';
  
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

  // Handle scroll event to change header styling and detect scroll direction
  useEffect(() => {
    let ticking = false;
    let rafId = null;
    
    // Cache viewport width to avoid repeated DOM queries
    let isMobile = window.innerWidth < 768;
    
    const updateHeaderState = (currentScrollY) => {
      // Always track scrolled state for shadow
      setIsScrolled(currentScrollY > 10);
      
      // If location dropdown is open and the user scrolls, close it
      if (isLocationDropdownOpen && Math.abs(currentScrollY - lastScrollY) > 1) {
        setIsLocationDropdownOpen(false);
      }
      
      // New behavior for location bar
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Scrolling down - hide location bar on all pages
        setHideLocationBar(true);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up - show location bar on all pages
        setHideLocationBar(false);
      }
      
      // Handle main header behavior
      if (isMobile) {
        // On mobile: always keep header sticky, only hide location bar
        if (scrollDirection !== 'up' || isScrollingDown) {
          setScrollDirection('up');
          setIsScrollingDown(false);
        }
      } else {
        // On desktop: always show header (sticky)
        if (scrollDirection !== 'up' || isScrollingDown) {
          setScrollDirection('up');
          setIsScrollingDown(false);
        }
      }
      
      setLastScrollY(currentScrollY);
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        rafId = requestAnimationFrame(() => {
          updateHeaderState(window.scrollY);
        });
        ticking = true;
      }
    };

    const handleResize = () => {
      isMobile = window.innerWidth < 768;
    };
    
    // Use passive listeners for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      document.body.classList.remove('scrolled', 'scrolling-down', 'scrolling-up', 'header-hidden');
    };
  }, [lastScrollY, scrollDirection, isScrollingDown, isProductsPage, isLocationDropdownOpen]);

  // Separate useEffect for DOM class manipulation to avoid excessive updates
  useEffect(() => {
    // Handle main header classes - always sticky on mobile now
    document.body.classList.add('scrolling-up');
    document.body.classList.remove('scrolling-down', 'header-hidden');
    
    // Add products page class for specific styling
    if (isProductsPage) {
      document.body.classList.add('products-page');
    } else {
      document.body.classList.remove('products-page');
    }
    
    // Handle location bar visibility
    if (hideLocationBar) {
      document.body.classList.add('hide-location-bar');
    } else {
      document.body.classList.remove('hide-location-bar');
    }
    
    // Handle scrolled class
    if (isScrolled) {
      document.body.classList.add('scrolled');
    } else {
      document.body.classList.remove('scrolled');
    }
  }, [isScrollingDown, isScrolled, hideLocationBar, isProductsPage]);
  
  // Clean up body scroll lock when component unmounts and handle resize
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
      
      // Close mobile menu when switching to desktop
      if (window.innerWidth >= 768 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      // Cleanup scroll lock on unmount
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      document.body.removeAttribute('data-scroll-y');
      window.removeEventListener('resize', handleResize);
    };
  }, [isMobileMenuOpen]);
  
  // Handle mobile menu body scroll lock/unlock - only on mobile devices
  useEffect(() => {
    const isMobile = window.innerWidth < 768; // Only apply on mobile screens
    
    if (isMobileMenuOpen && isMobile) {
      // Store original scroll position
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      // Store scroll position for restoration
      document.body.setAttribute('data-scroll-y', scrollY.toString());
    } else {
      // Restore scroll position
      const scrollY = document.body.getAttribute('data-scroll-y');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      
      if (scrollY && isMobile) {
        window.scrollTo(0, parseInt(scrollY));
        document.body.removeAttribute('data-scroll-y');
      }
    }
    
    return () => {
      // Cleanup on unmount
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      document.body.removeAttribute('data-scroll-y');
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
    <>
    <header className={`fixed top-0 left-0 right-0 z-50 bg-white transition-all duration-300 ${isScrolled ? 'shadow-lg' : 'shadow-sm'}`} style={{fontFamily: 'sans-serif'}}>
      {/* Mobile Location Overlay */}
      {!isAdminView && isLocationDropdownOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-25 z-[55] transition-opacity duration-200"
          onClick={() => setIsLocationDropdownOpen(false)}
        />
      )}
      
      {/* Mobile Location Bar - Part of sticky header with conditional visibility */}
      {!isAdminView && (
        <div className={`mobile-location-bar md:hidden bg-white border-b border-gray-100 z-[56] ${isLocationDropdownOpen ? 'overflow-visible' : 'overflow-hidden'} transition-all duration-300 ${hideLocationBar ? 'max-h-0 py-0' : 'max-h-20 py-2'}`}>
          <div className="px-3">
            <div className="flex justify-start">
              <div className="relative" ref={locationDropdownRef}>
                <button 
                  className="flex items-center text-xs text-black hover:text-gray-700 transition-colors duration-200 py-1 px-2 rounded-md hover:bg-gray-50"
                  onClick={toggleLocationDropdown}
                  style={{fontFamily: 'sans-serif'}}
                >
                  <MapPin className="h-3 w-3 mr-2" />
                  <span className="truncate max-w-[120px] font-medium">{memoizedUserLocationDisplay}</span>
                  <ChevronDown className="h-3 w-3 ml-1 text-gray-500" />
                  {user && !hasValidDeliveryLocation() && (
                    <AlertTriangle className="h-3 w-3 ml-1 text-amber-500" />
                  )}
                </button>
              
                {/* Mobile Location Dropdown */}
                {isLocationDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white shadow-xl rounded-lg overflow-hidden z-[70] border border-gray-100" style={{fontFamily: 'sans-serif'}}>
                    <div className="px-3 py-2 bg-black text-white border-b border-gray-800">
                      <h3 className="text-xs font-medium tracking-wider">DELIVERY LOCATIONS</h3>
                    </div>
                    {locationsLoading ? (
                      <div className="p-4 text-center">
                        <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
                        <p className="mt-2 text-xs">Loading...</p>
                      </div>
                    ) : locations.length > 0 ? (
                      <ul className="py-2 max-h-48 overflow-y-auto custom-scrollbar">
                        {locations.map((location) => (
                          <li key={location._id} className="hover:bg-gray-50 transition-colors duration-150">
                            <button
                              className={`w-full text-left px-3 py-2 text-xs ${
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
                      <div className="p-3 text-center text-xs text-black">No locations available</div>
                    )}
                    <div className="p-2 bg-gray-50 border-t border-gray-200">
                      <p className="text-xs text-gray-600 italic text-center" style={{fontFamily: 'sans-serif'}}>
                        Orders only in these locations
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Banner with Stars Effect */}
      {!isAdminView && (
        <div className="banner-container bg-gradient-to-r from-gray-500 via-gray-300 to-transparent py-4 px-3 sm:px-5 relative overflow-hidden">
          <div className="stars-container absolute inset-0">
            <div className="star star-1"></div>
            <div className="star star-2"></div>
          </div>
          <div className="container mx-auto flex justify-center items-center relative z-10">
            <p className="text-gray-800 text-sm sm:text-base font-light tracking-wider" style={{fontFamily: 'sans-serif'}}>
              ✨ Fresh Cakes & Pastries Daily ✨
            </p>
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
            
            {/* Navigation Links moved next to logo text on the same line - Premium Design */}
            <div className="flex items-center ml-4 md:ml-6 lg:ml-8 space-x-2 md:space-x-3 lg:space-x-4">
              <Link to="/special" className="nav-item flex items-center gap-2 px-3 py-2 text-sm md:text-base text-gray-700 hover:text-black hover:bg-gray-50 rounded-lg transition-all duration-300 relative group border border-transparent hover:border-gray-200" style={{fontFamily: 'sans-serif'}}>
                <Sparkles className="h-4 w-4 text-gray-600 group-hover:text-black transition-colors duration-300" />
                <span className="relative z-10 font-medium">Special Deals</span>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-full"></div>
              </Link>
              <Link to="/products" className="nav-item flex items-center gap-2 px-3 py-2 text-sm md:text-base text-gray-700 hover:text-black hover:bg-gray-50 rounded-lg transition-all duration-300 relative group border border-transparent hover:border-gray-200" style={{fontFamily: 'sans-serif'}}>
                <Utensils className="h-4 w-4 text-gray-600 group-hover:text-black transition-colors duration-300" />
                <span className="relative z-10 font-medium">Menu</span>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-full"></div>
              </Link>
              
              {/* Location Nav Item with Hover Dropdown - Premium Design */}
              <div className="relative" ref={locationDropdownRef}>
                <button 
                  className="nav-item flex items-center gap-2 px-3 py-2 text-sm md:text-base text-gray-700 hover:text-black hover:bg-gray-50 rounded-lg transition-all duration-300 relative group border border-transparent hover:border-gray-200"
                  onClick={toggleLocationDropdown}
                  onMouseEnter={() => setIsLocationDropdownOpen(true)}
                  style={{fontFamily: 'sans-serif'}}
                >
                  <MapPin className="h-4 w-4 text-gray-600 group-hover:text-black transition-all duration-300 group-hover:scale-110" />
                  <span className="truncate max-w-[120px] sm:max-w-[140px] font-medium relative z-10">{memoizedUserLocationDisplay}</span>
                  <ChevronDown className="h-4 w-4 text-gray-500 transition-all duration-300 group-hover:rotate-180 group-hover:text-gray-700" />
                  {user && !hasValidDeliveryLocation() && (
                    <div className="absolute -top-1 -right-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-full"></div>
                </button>
                
                {/* Location Dropdown */}
                {isLocationDropdownOpen && (
                  <div 
                    className="absolute top-full left-0 mt-3 w-72 bg-white shadow-2xl rounded-lg overflow-hidden z-50 border border-gray-200 transform opacity-0 scale-95 animate-dropdown" 
                    style={{fontFamily: 'sans-serif', animation: 'dropdownFadeIn 0.3s ease-out forwards'}}
                    onMouseLeave={() => setIsLocationDropdownOpen(false)}
                  >
                    <div className="px-4 py-3 bg-gradient-to-r from-gray-900 to-black text-white border-b border-gray-700">
                      <h3 className="text-xs font-medium tracking-wider">AVAILABLE DELIVERY LOCATIONS</h3>
                    </div>
                    {locationsLoading ? (
                      <div className="p-5 text-center">
                        <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-black"></div>
                        <p className="mt-2 text-sm text-gray-600">Loading locations...</p>
                      </div>
                    ) : locations.length > 0 ? (
                      <ul className="py-2 max-h-60 sm:max-h-72 overflow-y-auto custom-scrollbar">
                        {locations.map((location, index) => (
                          <li key={location._id} className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 transition-all duration-200" style={{animationDelay: `${index * 50}ms`}}>
                            <button
                              className={`w-full text-left px-4 py-3 text-xs sm:text-sm transition-all duration-200 hover:pl-6 ${
                                user?.location?._id === location._id
                                  ? 'bg-gradient-to-r from-gray-100 to-gray-50 text-black font-medium border-l-3 border-black shadow-sm'
                                  : 'text-gray-700 hover:text-black'
                              }`}
                              onClick={() => handleLocationSelect(location._id)}
                              style={{fontFamily: 'sans-serif'}}
                            >
                              <span className="flex items-center">
                                <MapPin className="h-3 w-3 mr-2 opacity-60" />
                                {location.area}, {location.city}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-4 text-center text-xs sm:text-sm text-gray-500">No delivery locations available</div>
                    )}
                    <div className="p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-white border-t border-gray-200">
                      <p className="text-xs text-gray-500 italic text-center" style={{fontFamily: 'sans-serif'}}>
                        ✨ Orders can only be placed in these locations
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Navigation Links - Desktop (user/cart section) - Premium Design */}
          <div className="hidden md:flex items-center space-x-3">
            
            {user && (
              <>
                {/* User Menu - Uses role-based display */}
                <UserMenu />
                   {/* Favorites Link - Premium Design */}
              {user && (
                <Link to="/favorites" className="flex items-center px-3 py-2 text-gray-700 hover:text-black hover:bg-gray-50 rounded-lg transition-all duration-300 relative group border border-transparent hover:border-gray-200" style={{fontFamily: 'sans-serif'}}>
                  <Heart className="h-4 w-4 text-gray-600 group-hover:text-red-500 transition-colors duration-300" />
                  {favorites?.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gray-800 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[1.25rem] h-5 flex items-center justify-center font-medium">
                      {favorites.length}
                    </span>
                  )}
                </Link>
              )}
                
                {/* Cart component - Premium Design */}
                <Link to="/cart" className="flex items-center px-3 py-2 text-gray-700 hover:text-black hover:bg-gray-50 rounded-lg transition-all duration-300 relative group border border-transparent hover:border-gray-200" style={{fontFamily: 'sans-serif'}}>
                  <ShoppingBag className="h-4 w-4 text-gray-600 group-hover:text-black transition-colors duration-300" />
                  {memoizedCartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gray-800 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[1.25rem] h-5 flex items-center justify-center font-medium">
                      {memoizedCartCount}
                    </span>
                  )}
                </Link>
              </>
            )}
            
            {!user && (
              <button 
                onClick={toggleAuthPanel}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-black hover:bg-gray-50 rounded-lg transition-all duration-300 border border-transparent hover:border-gray-200"
                style={{fontFamily: 'sans-serif'}}
              >
                <User className="h-4 w-4 text-gray-600 hover:text-black transition-colors duration-300" />
                <span className="text-sm font-medium">Login</span>
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
    </header>

    {/* Mobile Menu Overlay - Outside header for proper stacking */}
    <div 
      className={`fixed inset-0 bg-black bg-opacity-60 z-[100] transition-opacity duration-300 md:hidden ${
        isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={toggleMobileMenu}
    ></div>
    
    {/* Mobile Menu - Outside header for proper stacking */}
    <div 
      className={`md:hidden fixed inset-y-0 right-0 w-[85%] max-w-sm z-[9999] transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full'
      } flex flex-col bg-white`}
      style={{fontFamily: 'sans-serif'}}
    >
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-white">
          <Link to="/" className="flex items-center" onClick={() => closeMobileMenu()}>
            <img src="/images/logo.png" alt="Sweet Cake Logo" className="h-10" />
            <span className="ml-2 text-base font-medium text-black" style={{fontFamily: 'sans-serif'}}>La Patisserie</span>
          </Link>
          <button 
            className="text-gray-600 hover:text-black p-1 rounded hover:bg-gray-50 transition-colors duration-200"
            onClick={toggleMobileMenu}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 flex-1 overflow-y-auto">
          {/* Mobile Search - Compact Design */}
          <div className="relative mb-8">
            <input 
              type="text" 
              placeholder="Search for cakes, cookies, etc..." 
              className="w-full py-3 px-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 focus:border-black focus:ring-2 focus:ring-black/10 focus:outline-none transition-all duration-200 shadow-sm"
              style={{fontFamily: 'sans-serif'}}
              onFocus={(e) => {
                e.preventDefault();
                closeMobileMenu();
                navigate('/products');
              }}
            />
          </div>
          
          {/* Mobile Nav Links - Premium Design */}
          <nav className="space-y-6">
            {/* Account Section */}
            <div>
              <div className="px-2 py-3 mb-5">
                <h3 className="text-xs font-semibold tracking-widest text-gray-500 uppercase flex items-center gap-2" style={{fontFamily: 'sans-serif'}}>
                  <Crown className="h-3 w-3" />
                  ACCOUNT
                </h3>
                <div className="h-px bg-gradient-to-r from-gray-300 to-transparent mt-2" />
              </div>
              
              {user ? (
                <div className="space-y-3">
                  {user.role === 'admin' ? (
                    <>
                      <MobileNavLink 
                        to="/admin/dashboard" 
                        label="DASHBOARD"
                        icon={Settings}
                        onClick={() => closeMobileMenu()}
                      />
                      <MobileNavLink 
                        to="/admin/orders" 
                        label="ORDER MANAGEMENT"
                        icon={Package}
                        onClick={() => closeMobileMenu()}
                      />
                    </>
                  ) : (
                    <MobileNavLink 
                      to="/profile" 
                      label="MY PROFILE"
                      icon={UserCircle}
                      onClick={() => closeMobileMenu()}
                    />
                  )}
                  <MobileNavButton 
                    onClick={() => {
                      logout();
                      closeMobileMenu();
                    }}
                    label="SIGN OUT"
                    icon={Power}
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
                  icon={UserCircle}
                  variant="primary"
                />
              )}
            </div>
            
            {/* Navigation Section */}
            <div>
              <div className="px-2 py-3 mb-5">
                <h3 className="text-xs font-semibold tracking-widest text-gray-500 uppercase flex items-center gap-2" style={{fontFamily: 'sans-serif'}}>
                  <Home className="h-3 w-3" />
                  NAVIGATION
                </h3>
                <div className="h-px bg-gradient-to-r from-gray-300 to-transparent mt-2" />
              </div>
              
              <div className="space-y-3">
                {/* Cart with Badge */}
                <div className="relative">
                  <MobileNavLink 
                    to="/cart" 
                    label="SHOPPING BOX"
                    icon={ShoppingCart}
                    onClick={() => closeMobileMenu()}
                  />
                  {memoizedCartCount > 0 && (
                    <div className="absolute top-3 left-7">
                      <span className="bg-black text-white text-xs px-1.5 py-0.5 rounded-full min-w-[1.25rem] h-5 flex items-center justify-center font-medium" style={{fontFamily: 'sans-serif'}}>
                        {memoizedCartCount}
                      </span>
                    </div>
                  )}
                </div>
                
                <MobileNavLink 
                  to="/products" 
                  label="FULL MENU"
                  icon={Utensils}
                  onClick={() => closeMobileMenu()}
                />

                <MobileNavLink 
                  to="/special" 
                  label="SPECIAL OFFERS"
                  icon={Sparkles}
                  onClick={() => closeMobileMenu()}
                />

                <MobileNavLink 
                  to="/favorites" 
                  label="FAVORITES"
                  icon={Heart}
                  onClick={() => closeMobileMenu()}
                />
              </div>
            </div>
          </nav>
        </div>
        
        {/* Mobile menu footer - Premium Location Display */}
        <div className="mt-auto border-t border-gray-200 bg-white">
          <div className="px-6 py-4">
            <div className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-3 flex items-center gap-2" style={{fontFamily: 'sans-serif'}}>
              <MapPin className="h-3 w-3" />
              DELIVERY LOCATION
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1 flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-black truncate max-w-[140px]" style={{fontFamily: 'sans-serif'}}>
                  {userLocationDisplay}
                </span>
              </div>
              <button 
                className="
                  px-4 py-2 text-xs font-medium
                  bg-black text-white rounded-lg
                  hover:bg-gray-800 hover:shadow-lg hover:shadow-black/20
                  transition-all duration-300
                  flex items-center gap-2
                "
                style={{fontFamily: 'sans-serif'}}
                onClick={() => {
                  closeMobileMenu();
                  navigate('/profile');
                }}
              >
                <Settings className="h-3 w-3" />
                CHANGE
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Mobile Navigation Link Component - Premium Design with Icons
const MobileNavLink = ({ to, label, onClick, icon: IconComponent }) => (
  <Link
    to={to}
    onClick={onClick}
    className="
      flex items-center gap-4 px-4 py-3
      text-gray-700 text-sm font-medium
      hover:text-black hover:bg-gray-50
      rounded-lg transition-all duration-300
      group relative overflow-hidden
      border border-transparent hover:border-gray-100
    "
    style={{fontFamily: 'sans-serif'}}
  >
    {IconComponent && (
      <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
        <IconComponent 
          className="h-4 w-4 text-gray-600 group-hover:text-black transition-colors duration-300" 
        />
      </div>
    )}
    <span className="relative z-10">{label}</span>
    <div className="absolute left-0 top-0 h-full w-0.5 bg-black transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top" />
  </Link>
);

// Mobile Navigation Button Component - Premium Design with Icons
const MobileNavButton = ({ onClick, label, variant = 'default', icon: IconComponent }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return `
          bg-black text-white
          hover:bg-gray-800 hover:shadow-lg hover:shadow-black/20
          border-black
        `;
      case 'logout':
        return `
          bg-red-50 text-red-700 border-red-200
          hover:bg-red-100 hover:text-red-800 hover:border-red-300
        `;
      default:
        return `
          bg-white text-gray-700 border border-gray-200
          hover:bg-gray-50 hover:text-black hover:border-gray-300
        `;
    }
  };

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-4 w-full px-4 py-3
        text-sm font-medium text-left
        rounded-lg transition-all duration-300
        group relative overflow-hidden
        ${getVariantStyles()}
      `}
      style={{fontFamily: 'sans-serif'}}
    >
      {IconComponent && (
        <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
          <IconComponent 
            className={`h-4 w-4 transition-colors duration-300 ${
              variant === 'primary' ? 'text-white' : 
              variant === 'logout' ? 'text-red-600 group-hover:text-red-700' : 
              'text-gray-600 group-hover:text-black'
            }`} 
          />
        </div>
      )}
      <span className="relative z-10">{label}</span>
      {variant === 'primary' && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
    </button>
  );
};

// Export as memoized component to prevent unnecessary re-renders
export default memo(Header);