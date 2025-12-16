import React, { useState, useEffect, useRef, useMemo, memo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

import { useLocation as useLocationContext } from '../../context/LocationContext/LocationContext';
import { useHostel } from '../../context/HostelContext/HostelContext';
import { useCart } from '../../hooks/useCart';
import { useCategory } from '../../context/CategoryContext/CategoryContext';
import { useFavorites } from '../../context/FavoritesContext/FavoritesContext';
import SparkAnimation from '../common/SparkAnimation/SparkAnimation';
import { useSparkAnimationContext } from '../../context/SparkAnimationContext/SparkAnimationContext';
import { useDeliveryAvailability } from '../../context/DeliveryAvailabilityContext';
import DebugUserState from '../common/DebugUserState';
import './Header.css';
import './remove-focus.css';

// Import UserMenu component
import UserMenu from './UserMenu/UserMenu';
import NotificationBell from '../Notifications/NotificationBell';
import AnnouncementBanner from './AnnouncementBanner';

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
  Package,
  Home,
  Star,
  Gift,
  UserCircle,
  LogOut,
  ShoppingCart,
  Utensils,
  Crown,
  Power,
  Phone,
  Navigation,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';

const Header = ({ isAdminView = false }) => {
  const { 
    user,
    toggleAuthPanel,
    logout,
    getCurrentUser: fetchFreshUserData
  } = useAuth();
  
  const { sparks } = useSparkAnimationContext();
  
  // Delivery availability context
  const { 
    deliveryStatus, 
    loading: deliveryLoading, 
    detectUserLocation 
  } = useDeliveryAvailability();
  
  // Debug log for sparks (only when sparks change)
  useEffect(() => {
    if (sparks.length > 0) {
      console.log('🎇 Header sparks:', sparks.length, 'active sparks');
    }
  }, [sparks.length]);
  
  const locationContext = useLocationContext();
  const {
    locations = [],
    loading: locationsLoading = false,
    updateUserLocation,
    getCurrentLocationName,
    hasValidDeliveryLocation
  } = locationContext || {};
  
  const hostelContext = useHostel();
  const {
    hostels = [],
    fetchHostelsByLocation,
    fetchHostelById
  } = hostelContext || {};
  
  const { cartCount = 0 } = useCart();
  
  // Get categories from CategoryContext with error handling
  const categoryContext = useCategory();
  const { 
    categories = [],
    fetchCategories,
    loading: categoriesLoading = false,
    error: categoriesError = null 
  } = categoryContext || {};
  
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState('up');
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [hideLocationBar, setHideLocationBar] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const locationDropdownRef = useRef(null);
  const megaMenuRef = useRef(null);
  const categorySliderRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const megaMenuTimeoutRef = useRef(null);
  
  // Check if we're on a cart or payment page
  const isCartOrPaymentPage = location.pathname === '/cart' || location.pathname === '/payment';
  
  // Check if we're on the products page
  const isProductsPage = location.pathname === '/products';
  
  // Memoize values that should only update when their dependencies change
  const memoizedCartCount = useMemo(() => cartCount, [cartCount]);
  
  // Use categories from database or fall back to empty array
  const filteredCategories = useMemo(() => {
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return [];
    }
    
    return categories
      .filter(category => 
        category.isActive && 
        category.name !== '__SPECIAL_IMAGES__' && 
        !category.name?.includes('__SPECIAL_IMAGES__') &&
        !category.name?.includes('_SPEC')
      )
      .map(category => ({
        _id: category._id,
        id: category._id,
        name: category.name,
        featuredImage: category.featuredImage || null,
        images: category.images || []}));
  }, [categories]);
  
  // Get user's location display name
  const [userLocationDisplay, setUserLocationDisplay] = useState('Select Location');
  const [isRefreshingLocation, setIsRefreshingLocation] = useState(false);
  const [isCartHovered, setIsCartHovered] = useState(false);
  
  // Memoize location display to prevent unnecessary re-calculations and ensure it updates properly
  const memoizedUserLocationDisplay = useMemo(() => {
    // If user has no location set at all, show "Select Location"
    if (!user?.location && !user?.userAddress?.fullAddress) {
      return 'Select Location';
    }
    
    // Priority 1: User's precise sublocation from Google autocomplete
    if (user?.userAddress?.fullAddress) {
      return user.userAddress.fullAddress;
    }
    
    // If we have a valid user location object, display it immediately
    if (user?.location && typeof user.location === 'object' && user.location.area && user.location.city) {
      const hostelName = user.hostel && typeof user.hostel === 'object' ? user.hostel.name : '';
      return hostelName 
        ? `${hostelName}, ${user.location.area}` 
        : `${user.location.area}, ${user.location.city}`;
    }
    
    // Otherwise use the computed display text
    return userLocationDisplay;
  }, [userLocationDisplay, user?.location, user?.hostel, user?.userAddress]);
  
  // Update location display once when user changes
  const locationDisplayInitialized = useRef(false);
  const prevLocationIdRef = useRef(user?.location?._id);
  
  // Helper function to find location by ID in locations array
  const findLocationById = useCallback((locationId) => {
    if (!locationId || !locations || locations.length === 0) return null;
    return locations.find(loc => loc._id === locationId);
  }, [locations]);
  
  // Helper function to find hostel by ID in hostels array
  const findHostelById = useCallback((hostelId) => {
    if (!hostelId || !hostels || hostels.length === 0) return null;
    return hostels.find(h => h._id === hostelId);
  }, [hostels]);
  
  // Effect to fetch hostel data when user has hostel ID but we don't have the hostel details
  useEffect(() => {
    const needsHostelFetch = user?.hostel && 
                           typeof user.hostel === 'string' && 
                           !findHostelById(user.hostel) && 
                           fetchHostelById;
                           
    if (needsHostelFetch) {
      console.log('Header - Fetching hostel by ID for display:', user.hostel);
      fetchHostelById(user.hostel).catch(err => {
        console.warn('Header - Failed to fetch hostel by ID:', err);
      });
    }
  }, [user?.hostel, hostels, fetchHostelById, findHostelById]);
  
  useEffect(() => {
    // Priority 1: User's precise sublocation
    if (user?.userAddress?.fullAddress) {
      setUserLocationDisplay(user.userAddress.fullAddress);
      locationDisplayInitialized.current = true;
      return;
    }
    
    // If user location is already a populated object, use it directly
    if (user?.location && typeof user.location === 'object' && user.location.area && user.location.city) {
      const hostelName = user.hostel && typeof user.hostel === 'object' ? user.hostel.name : '';
      const displayText = hostelName 
        ? `${hostelName}, ${user.location.area}` 
        : `${user.location.area}, ${user.location.city}`;
      
      setUserLocationDisplay(displayText);
      locationDisplayInitialized.current = true;
      return;
    }

    console.log('Header - User state update:', {
      user: user ? {
        uid: user.uid,
        name: user.name,
        email: user.email,
        location: user.location ? (
          typeof user.location === 'object' ? {
            _id: user.location._id,
            area: user.location.area,
            city: user.location.city
          } : { _id: user.location, type: 'string-id' }
        ) : null,
        hostel: user.hostel ? (
          typeof user.hostel === 'object' ? {
            _id: user.hostel._id,
            name: user.hostel.name
          } : { _id: user.hostel, type: 'string-id' }
        ) : null
      } : null,
      locationsAvailable: locations ? locations.length : 0,
      hostelsAvailable: hostels ? hostels.length : 0
    });
    
    if (user?.location) {
      let locationObj = null;
      let hostelObj = null;
      
      // Handle populated location object
      if (typeof user.location === 'object' && user.location.area && user.location.city) {
        locationObj = user.location;
      } 
      // Handle location as string ID - look it up in locations array
      else if (typeof user.location === 'string') {
        locationObj = findLocationById(user.location);
        console.log('Header - Looking up location by ID:', user.location, 'found:', locationObj);
      }
      
      // Handle populated hostel object
      if (user.hostel) {
        if (typeof user.hostel === 'object' && user.hostel.name) {
          hostelObj = user.hostel;
        } 
        // Handle hostel as string ID - look it up in hostels array
        else if (typeof user.hostel === 'string') {
          hostelObj = findHostelById(user.hostel);
          console.log('Header - Looking up hostel by ID:', user.hostel, 'found:', hostelObj);
        }
      }
      
      // Set display based on what we found
      if (locationObj && locationObj.area && locationObj.city) {
        const displayText = hostelObj && hostelObj.name 
          ? `${hostelObj.name}, ${locationObj.area}` 
          : `${locationObj.area}, ${locationObj.city}`;
        
        // console.log('Header - Setting location display:', displayText); // Uncomment for debugging
        
        setUserLocationDisplay(displayText);
        prevLocationIdRef.current = locationObj._id;
      } else if (typeof user.location === 'string') {
        // Location ID exists but we couldn't find the location details
        console.warn('Header - User has location ID but location not found in locations array, refreshing...');
        if (!isRefreshingLocation && fetchFreshUserData && localStorage.getItem('authToken')) {
          setIsRefreshingLocation(true);
          setUserLocationDisplay('Loading location...');
          prevLocationIdRef.current = null;
          
          fetchFreshUserData().then(() => {
            setIsRefreshingLocation(false);
          }).catch(() => {
            setIsRefreshingLocation(false);
            setUserLocationDisplay('Select Location');
          });
        } else if (!fetchFreshUserData) {
          // Fallback: show a generic message if we can't refresh
          setUserLocationDisplay('Location set');
        }
      } else {
        setUserLocationDisplay('Select Location');
        prevLocationIdRef.current = null;
      }
    } else {
      setUserLocationDisplay('Select Location');
      prevLocationIdRef.current = null;
    }
    locationDisplayInitialized.current = true;
  }, [user?.uid, user?.location, user?.hostel, user?.userAddress, locations, hostels, findLocationById, findHostelById, fetchFreshUserData, isRefreshingLocation]);
  
  // Effect to fetch hostels when user has location but hostel lookup failed
  useEffect(() => {
    if (user?.location && user?.hostel && typeof user.hostel === 'string') {
      const locationId = typeof user.location === 'object' ? user.location._id : user.location;
      
      // Only fetch if we don't already have hostels for this location
      const hostelExists = findHostelById(user.hostel);
      if (!hostelExists && fetchHostelsByLocation && locationId) {
        console.log('Header - Fetching hostels for location to resolve hostel lookup:', locationId);
        fetchHostelsByLocation(locationId).catch(error => {
          console.error('Header - Error fetching hostels:', error);
        });
      }
    }
  }, [user?.location, user?.hostel, findHostelById, fetchHostelsByLocation]);

  // Handle scroll event to change header styling and detect scroll direction
  useEffect(() => {
    let ticking = false;
    let rafId = null;
    
    // Cache viewport width to avoid repeated DOM queries
    let isMobile = window.innerWidth < 768;
    
    const updateHeaderState = (currentScrollY) => {
      // Always track scrolled state for shadow
      setIsScrolled(currentScrollY > 10);
      
      // If location dropdown is open and the user scrolls significantly, close it
      // Increase threshold on mobile to prevent accidental closing during touch interactions
      // Don't close if currently navigating
      const scrollThreshold = isMobile ? 20 : 10;
      if (isLocationDropdownOpen && !isNavigating && Math.abs(currentScrollY - lastScrollY) > scrollThreshold) {
        setIsLocationDropdownOpen(false);
      }
      
      // New behavior for location bar - but keep it visible on mobile for settings access
      if (!isMobile) {
        // Only hide location bar on desktop
        if (currentScrollY > lastScrollY && currentScrollY > 50) {
          // Scrolling down - hide location bar on desktop only
          setHideLocationBar(true);
        } else if (currentScrollY < lastScrollY) {
          // Scrolling up - show location bar
          setHideLocationBar(false);
        }
      } else {
        // On mobile, always keep location bar visible for settings access
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
  }, [lastScrollY, scrollDirection, isScrollingDown, isProductsPage, isLocationDropdownOpen, isNavigating]);

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
  }, []);
  
  // Close location dropdown and mega menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close if currently navigating
      if (!isNavigating && locationDropdownRef.current && !locationDropdownRef.current.contains(event.target)) {
        setIsLocationDropdownOpen(false);
      }
      if (megaMenuRef.current && !megaMenuRef.current.contains(event.target)) {
        setIsMegaMenuOpen(false);
        setHoveredCategory(null);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNavigating]);
  
  // Handle location selection - navigate to profile (same as desktop behavior)
  const handleLocationSelect = useCallback((locationId) => {
    setIsLocationDropdownOpen(false);
    if (user) {
      navigate('/profile');
    } else {
      toggleAuthPanel();
    }
  }, [user, navigate, toggleAuthPanel]);
  
  // Toggle location dropdown with useCallback for performance
  const toggleLocationDropdown = useCallback(() => {
    setIsLocationDropdownOpen(prev => !prev);
  }, []);
  
  // Handle location dropdown hover with delay
  const handleLocationHoverEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    // Close mega menu when opening location dropdown
    setIsMegaMenuOpen(false);
    setHoveredCategory(null);
    setIsLocationDropdownOpen(true);
  }, []);
  
  const handleLocationHoverLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsLocationDropdownOpen(false);
    }, 150); // Small delay to prevent accidental closing
  }, []);

  // Handle mega menu hover with delay
  const handleMegaMenuEnter = useCallback(() => {
    if (megaMenuTimeoutRef.current) {
      clearTimeout(megaMenuTimeoutRef.current);
    }
    // Close location dropdown when opening mega menu
    setIsLocationDropdownOpen(false);
    setIsMegaMenuOpen(true);
    // Set first category as default hover if filteredCategories exist
    if (filteredCategories.length > 0 && !hoveredCategory) {
      setHoveredCategory(filteredCategories[0]);
    }
  }, [categories, hoveredCategory]);
  
  const handleMegaMenuLeave = useCallback(() => {
    megaMenuTimeoutRef.current = setTimeout(() => {
      setIsMegaMenuOpen(false);
      setHoveredCategory(null);
    }, 150);
  }, []);

  const handleCategoryHover = useCallback((category) => {
    setHoveredCategory(category);
  }, []);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (megaMenuTimeoutRef.current) {
        clearTimeout(megaMenuTimeoutRef.current);
      }
    };
  }, []);
  
  // Handle category selection with useCallback
  const handleCategorySelect = useCallback((categoryId) => {
    setSelectedCategory(categoryId);
    
    window.location.href = `/products?category=${categoryId}`;
  }, []);
  
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
    {/* Infinite Running Announcement Banner - Above Header - Hidden on mobile for cart/payment pages */}
    <div className={isCartOrPaymentPage ? 'hidden md:block' : ''}>
      <AnnouncementBanner />
    </div>
    
    <header className="md:fixed md:left-0 md:right-0 md:z-50 bg-white shadow-sm transition-all duration-300 header-with-banner">
      
      {/* Mobile Top Header Bar - Shop Name and Logo */}
      <div className="block md:hidden py-2 px-3 bg-white border-b border-gray-100">
        <div className="flex justify-between items-center">
          {/* Left side - Shop Name */}
          <Link to="/" className="flex items-center">
            <span className="text-xl font-dancing font-semibold tracking-wide" style={{color: '#733857'}}>
              La Patisserie
            </span>
          </Link>
          
          {/* Right side - Logo */}
          <Link to="/" className="flex items-center">
            <img src="/images/logo.png" alt="Sweet Cake Logo" className="h-8 opacity-90" />
          </Link>
        </div>
      </div>
      
      {/* Mobile Location Bar - Display only, no dropdown */}
      {!isAdminView && (
        <div className={`mobile-location-bar md:hidden bg-white border-b border-gray-200 z-[56] transition-all duration-300 ${hideLocationBar ? 'max-h-0 py-0' : 'max-h-20 py-2'}`}>
          <div className="px-3">
            <div className="flex justify-between items-center">
              <button 
                onClick={() => {
                  if (user) {
                    navigate('/profile');
                  } else {
                    toggleAuthPanel();
                  }
                }}
                className="flex items-center text-xs py-1 px-2 rounded-md hover:bg-gray-50 transition-colors duration-200 active:bg-gray-100" 
                style={{ color: 'rgba(40, 28, 32, 0.7)'}}
              >
                <img 
                  src="/compass.png" 
                  alt="Location" 
                  className="h-4 w-4 mr-2" 
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const icon = document.createElement('div');
                    icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>';
                    icon.className = 'h-4 w-4 mr-2 inline-block';
                    e.target.parentNode.insertBefore(icon, e.target);
                  }}
                />
                <span className="truncate max-w-[120px] font-light">{memoizedUserLocationDisplay}</span>
                {user && typeof hasValidDeliveryLocation === 'function' && !hasValidDeliveryLocation() && (
                  <AlertTriangle className="h-3 w-3 ml-1 text-amber-400" />
                )}
                <ChevronDown className="h-3 w-3 ml-1 opacity-60" />
              </button>
              
              {/* Mobile Notification Bell - Right Side - Only show when user is logged in */}
              {user && (
                <div className="flex items-center">
                  <NotificationBell />
                </div>
              )}
            </div>
            
            {/* Delivery Status Indicator - Mobile */}
            <div className="mt-2">
              {deliveryLoading ? (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Checking delivery...</span>
                </div>
              ) : deliveryStatus.checked ? (
                deliveryStatus.available ? (
                  <div className="flex items-center gap-1.5 text-xs text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>Delivery available</span>
                    {deliveryStatus.matchedLocation && (
                      <span className="text-green-500">• {deliveryStatus.matchedLocation.area}</span>
                    )}
                  </div>
                ) : (
                  <Link 
                    to="/checkout"
                    className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700"
                  >
                    <XCircle className="h-3 w-3" />
                    <span>Delivery unavailable • Tap to set location</span>
                  </Link>
                )
              ) : (
                <Link 
                  to="/checkout"
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700"
                >
                  <Navigation className="h-3 w-3" />
                  <span>Set delivery location</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Middle Bar - Logo and Profile/Login - Hidden on mobile */}
      <div className="hidden md:block py-2 sm:py-3 px-2 sm:px-4 bg-white border-b border-gray-200">
        <div className="container mx-auto flex justify-between items-center">
          {/* Logo Text on Left with Navigation Links beside it - Hidden on mobile */}
          <div className="hidden md:flex items-center">
            <div className="flex items-center">
              <Link to="/" className="flex items-center header-logo-text">
                <span className="transition-colors duration-300 sm:text-xl md:text-2xl truncate max-w-[120px] sm:max-w-none font-dancing font-semibold tracking-wide" style={{color: '#733857'}}>
                  La Patisserie
                  <div className="sugar-sprinkles">
                    {[...Array(15)].map((_, i) => (
                      <span 
                        key={i} 
                        className="sprinkle" 
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                          animationDelay: `${Math.random() * 0.5}s`
                        }}
                      />
                    ))}
                  </div>
                </span>
              </Link>
            </div>
            
            {/* Navigation Links moved next to logo text on the same line - Premium Design */}
            <div className="flex items-center ml-4 md:ml-6 lg:ml-8 space-x-2 md:space-x-3 lg:space-x-4">
              {/* Menu Nav Item with Mega Dropdown - Premium Design */}
              <div 
                className="relative" 
                ref={megaMenuRef}
                onMouseEnter={handleMegaMenuEnter}
                onMouseLeave={handleMegaMenuLeave}
              >
                <Link to="/products" className="nav-item flex items-center gap-2 px-3 py-2 text-sm md:text-base rounded-lg transition-all duration-300 relative group text-center md:text-center align-middle font-sans" style={{color: '#281c20'}}>
                  <img 
                    src="/food.png" 
                    alt="Menu" 
                    className="h-5 w-5 transition-all duration-300 group-hover:scale-110 align-middle" 
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const icon = document.createElement('div');
                      icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path></svg>';
                      icon.className = 'h-5 w-5 transition-all duration-300 group-hover:scale-110 align-middle inline-block';
                      e.target.parentNode.insertBefore(icon, e.target);
                    }}
                  />
                  <span className="relative z-10 font-light" style={{color: '#733857', verticalAlign: 'middle'}}>Menu</span>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#733857] to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-full"></div>
                </Link>
                
                {/* Invisible bridge to prevent hover gap */}
                {isMegaMenuOpen && (
                  <div className="absolute top-full left-0 w-full h-3 bg-transparent" />
                )}
                
                {/* Mega Menu Dropdown */}
                {isMegaMenuOpen && filteredCategories.length > 0 && (
                  <div
                    className="absolute top-full left-0 mt-3 w-[600px] h-[400px] bg-white backdrop-blur-sm shadow-lg rounded-lg overflow-hidden z-50 border border-gray-100 transform opacity-0 scale-95 animate-dropdown"
                    style={{ animation: 'dropdownFadeIn 0.3s ease-out forwards', boxShadow: '0 8px 32px rgba(40, 28, 32, 0.15), 0 4px 16px rgba(40, 28, 32, 0.1)'}}
                  >
                    <div className="flex h-full">
                      {/* Categories Sidebar */}
                      <div className="w-1/2 bg-white border-r border-gray-100">
                        <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100">
                          <h3 className="text-sm font-light tracking-wide uppercase" style={{color: '#281c20'}}>Categories</h3>
                        </div>
                        <div className="p-4 overflow-y-auto h-[calc(100%-110px)] custom-scrollbar">
                          <div className="space-y-1">
                            {filteredCategories.map((category) => (
                              <button
                                key={category._id}
                                className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-300 group relative backdrop-filter backdrop-blur-sm ${
                                  hoveredCategory?._id === category._id
                                    ? 'bg-gray-50/80 transform translateY(-1px)'
                                    : 'hover:bg-gray-50/80 hover:transform hover:translateY(-1px)'
                                }`}
                                style={{
                                  color: hoveredCategory?._id === category._id ? '#281c20' : '#281c20'}}
                                onMouseEnter={() => handleCategoryHover(category)}
                                onClick={() => {
                                  setIsMegaMenuOpen(false);
                                  navigate(`/products?category=${category._id}`);
                                }}
                              >
                                <span className="relative z-10 font-light text-sm">{category.name}</span>
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#733857] to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-full"></div>
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {/* Premium View All Products Button */}
                        <div className="p-4 border-t border-gray-100">
                          <button
                            onClick={() => {
                              setIsMegaMenuOpen(false);
                              navigate('/products');
                            }}
                            className="w-full group relative overflow-hidden py-3 px-4 transition-all duration-500 transform hover:scale-[1.02] hover:shadow-lg"
                            style={{
                              background: 'linear-gradient(135deg, #281c20 0%, #733857 50%, #281c20 100%)',
                              backgroundSize: '200% 200%',
                              animation: 'gradientShift 3s ease infinite'
                            }}
                          >
                            {/* Animated background overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                            
                            {/* Button content */}
                            <div className="relative flex items-center justify-center gap-2 text-white">
                              <img 
                                src="/menu.png" 
                                alt="Products Icon" 
                                className="h-4 w-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" 
                              />
                              <span className="font-medium text-sm tracking-wide">VIEW ALL PRODUCTS</span>
                              <div className="ml-1 transition-all duration-300 group-hover:translate-x-1">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="stroke-current">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                              </div>
                            </div>
                            
                            {/* Sparkle effects */}
                            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="absolute top-2 left-4 w-1 h-1 bg-white rounded-full animate-ping"></div>
                              <div className="absolute top-4 right-6 w-1 h-1 bg-white rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
                              <div className="absolute bottom-3 left-8 w-1 h-1 bg-white rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
                            </div>
                          </button>
                        </div>
                      </div>
                      
                      {/* Dynamic Image Display */}
                      <div className="w-1/2 bg-white flex flex-col">
                        <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100">
                          <h3 className="text-sm font-light tracking-wide uppercase" style={{color: '#281c20'}}>
                            {hoveredCategory ? hoveredCategory.name : 'Select Category'}
                          </h3>
                        </div>
                        <div className="flex-1 flex items-center justify-center p-6">
                          {hoveredCategory && hoveredCategory.featuredImage ? (
                            <div className="relative w-full h-full max-w-[200px] max-h-[200px] rounded-lg overflow-hidden shadow-sm">
                              <img 
                                src={hoveredCategory.featuredImage} 
                                alt={hoveredCategory.name}
                                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                              <div className="hidden w-full h-full bg-gray-50/50 items-center justify-center backdrop-blur-sm">
                                <Utensils className="h-16 w-16" style={{color: '#281c20', opacity: 0.4}} />
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-full max-w-[200px] max-h-[200px] bg-gray-50/50 rounded-lg flex items-center justify-center border border-gray-100 backdrop-blur-sm">
                              <div className="text-center">
                                <Utensils className="h-16 w-16 mx-auto mb-3" style={{color: '#281c20', opacity: 0.4}} />
                                <p className="text-sm font-light" style={{color: '#281c20', opacity: 0.6}}>
                                  {hoveredCategory ? 'No Image Available' : 'Hover over a category'}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                       
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Location Nav Item with Hover Dropdown - Premium Design */}
              <div 
                className="relative" 
                ref={locationDropdownRef}
                onMouseEnter={handleLocationHoverEnter}
                onMouseLeave={handleLocationHoverLeave}
              >
                <button 
                  className="nav-item flex items-center gap-2 px-3 py-2 text-sm md:text-base transition-all duration-300 relative group text-center md:text-center align-middle"
                  onClick={toggleLocationDropdown}
                  style={{ color: '#281c20'}}
                >
                  <img 
                    src="/compass.png" 
                    alt="Location" 
                    className="h-5 w-5 transition-all duration-300 group-hover:scale-110 align-middle" 
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const icon = document.createElement('div');
                      icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>';
                      icon.className = 'h-5 w-5 transition-all duration-300 group-hover:scale-110 align-middle inline-block';
                      e.target.parentNode.insertBefore(icon, e.target);
                    }}
                  />
                  <span className="truncate max-w-[120px] sm:max-w-[140px] font-light relative z-10" style={{color: '#733857', verticalAlign: 'middle'}}>{memoizedUserLocationDisplay}</span>
                  <ChevronDown className="h-4 w-4 transition-all duration-300 group-hover:rotate-180 align-middle" style={{color: '#281c20'}} />
                  {user && typeof hasValidDeliveryLocation === 'function' && !hasValidDeliveryLocation() && (
                    <div className="absolute -top-1 -right-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#733857] to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-full"></div>
                </button>
                
                {/* Invisible bridge to prevent hover gap */}
                {isLocationDropdownOpen && (
                  <div className="absolute top-full left-0 w-full h-3 bg-transparent" />
                )}
                
                {/* Location Dropdown */}
                {isLocationDropdownOpen && (
                  <div
                    className="absolute top-full left-0 mt-3 w-56 bg-white backdrop-blur-sm overflow-hidden z-50 border border-gray-100 transform opacity-0 scale-95 animate-dropdown"
                    style={{ 
                      animation: 'dropdownFadeIn 0.3s ease-out forwards',
                      boxShadow: '0 8px 32px rgba(40, 28, 32, 0.15), 0 4px 16px rgba(40, 28, 32, 0.1)'
                    }}
                  >
                    {user ? (
                      // User is logged in - show profile link
                      <>
                        <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100">
                          <h3 className="text-xs font-light tracking-wide uppercase" style={{color: '#281c20'}}>Settings</h3>
                        </div>
                        <div className="p-2">
                          <Link
                            to="/profile"
                            className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50/80 hover:transform hover:translateY(-1px) transition-all duration-300 font-light relative group backdrop-filter backdrop-blur-sm"
                            style={{ color: '#281c20'}}
                            onClick={() => setIsLocationDropdownOpen(false)}
                          >
                            <img 
                              src="/gamification.png" 
                              alt="Settings Icon" 
                              className="h-4 w-4 transition-all duration-300 group-hover:scale-110" 
                            />
                            <span className="relative z-10">Edit in settings</span>
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#733857] to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-full"></div>
                          </Link>
                        </div>
                      </>
                    ) : (
                      // User is not logged in - show location selection dropdown
                      <>
                        <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100">
                          <h3 className="text-xs font-light tracking-wide uppercase" style={{color: '#281c20'}}>Select Location</h3>
                        </div>
                        <div 
                          className="p-2 max-h-48 overflow-y-auto" 
                          style={{
                            scrollbarWidth: 'none', 
                            msOverflowStyle: 'none',
                            WebkitScrollbar: 'none'
                          }}
                        >
                          {locations && locations.length > 0 ? (
                            locations.map(location => (
                              <button
                                key={location._id}
                                onClick={() => handleLocationSelect(location._id)}
                                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50/80 hover:transform hover:translateY(-1px) transition-all duration-300 font-light relative group backdrop-filter backdrop-blur-sm text-left"
                                style={{ color: '#281c20'}}
                              >
                                <img 
                                  src="/compass.png" 
                                  alt="Location Icon" 
                                  className="h-4 w-4 transition-all duration-300 group-hover:scale-110" 
                                />
                                <span className="relative z-10 truncate">
                                  {location.area}, {location.city} - {location.pincode}
                                </span>
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#733857] to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-full"></div>
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-gray-500 text-sm">
                              No locations available
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              {/* Contact Nav Item - Premium Design */}
             
            </div>
          </div>
          
          {/* Navigation Links - Desktop (user/cart section) - Premium Design */}
          <div className="hidden md:flex items-center space-x-4">
            {user && (
              <>
                {/* Admin Dashboard Button - Show only for admins - Positioned first */}
                {user.role === 'admin' && (
                  <div className="bg-[#281c20]/50 backdrop-blur-sm rounded-lg border border-[#733857]/30">
                    <Link to="/admin/dashboard" className="flex items-center px-4 py-3 text-white hover:text-[#A855F7] rounded-lg transition-all duration-300 relative group">
                      <Settings className="h-5 w-5 text-white group-hover:text-[#A855F7] transition-colors duration-300" />
                      <span className="ml-2 text-sm font-light">Dashboard</span>
                    </Link>
                  </div>
                )}

                {/* User Menu - Uses role-based display */}
                <UserMenu />

                {/* Notification Bell - Only show when user is logged in */}
                {user && <NotificationBell />}

                {/* Cart component - Premium Design with Tooltip */}
                <div className="tooltip">
                  <div className="tooltip-content">
                    <div className="animate-bounce text-[#A855F7] -rotate-10 text-sm font-black italic select-none">Cart</div>
                  </div>
                  <Link 
                    to="/cart" 
                    className="flex items-center px-3 py-2 rounded-lg transition-all duration-300 relative group" 
                    style={{ color: '#281c20'}}
                    data-cart-icon="true"
                  >
                    <img 
                      src="/ice-cream-cart.png" 
                      alt="Cart" 
                      className="h-5 w-5 transition-all duration-300 group-hover:scale-110" 
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const icon = document.createElement('div');
                        icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"></circle><circle cx="19" cy="21" r="1"></circle><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path></svg>';
                        icon.className = 'h-5 w-5 transition-all duration-300 group-hover:scale-110 inline-block';
                        e.target.parentNode.insertBefore(icon, e.target);
                      }}
                    />
                    {memoizedCartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-gradient-to-r from-[#733857] to-[#281c20] text-white text-xs px-1.5 py-0.5 rounded-full min-w-[1.25rem] h-5 flex items-center justify-center font-light shadow-lg">
                        {memoizedCartCount}
                      </span>
                    )}
                  </Link>
                </div>
              </>
            )}
            
            {/* WhatsApp Icon - Near Login */}
           
            
            {!user && (
              <button 
                onClick={toggleAuthPanel}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 group text-black hover:bg-black/5 profile-icon-btn"
              >
                <User className="h-4 w-4 transition-all duration-300 text-black" />
                <span className="text-sm font-light text-black transition-all duration-300">
                  Login
                </span>
              </button>
            )}
            
            {/* Logo image on right */}
            <Link to="/" className="flex items-center ml-4 header-logo-image">
              <img src="/images/logo.png" alt="Sweet Cake Logo" className="h-12 sm:h-14 opacity-90" />
            </Link>
          </div>
        </div>
      </div>
    </header>
    
    {/* Spark Animations */}
    {sparks.map(spark => (
      <SparkAnimation
        key={spark.id}
        startPosition={{ x: spark.startX, y: spark.startY }}
        endPosition={{ x: spark.endX, y: spark.endY }}
        onAnimationComplete={() => {}}
        isVisible={true}
        sparkId={spark.id}
      />
    ))}

    </>
  );
};

// Export as memoized component to prevent unnecessary re-renders
export default memo(Header);
