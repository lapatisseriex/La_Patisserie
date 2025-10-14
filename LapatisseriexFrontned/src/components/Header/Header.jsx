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
import FavoritesIcon from '../Favorites/FavoritesIcon';
import DebugUserState from '../common/DebugUserState';
import './Header.css';
import './remove-focus.css';
import './hide-search.css';

// Import UserMenu component
import UserMenu from './UserMenu/UserMenu';
import NotificationBell from '../Notifications/NotificationBell';

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
  Phone
} from 'lucide-react';

const Header = ({ isAdminView = false }) => {
  const { 
    user,
    toggleAuthPanel,
    logout,
    getCurrentUser: fetchFreshUserData
  } = useAuth();
  
  const { sparks } = useSparkAnimationContext();
  
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
        images: category.images || [],
      }));
  }, [categories]);
  
  // Get user's location display name
  const [userLocationDisplay, setUserLocationDisplay] = useState('Select Location');
  const [isRefreshingLocation, setIsRefreshingLocation] = useState(false);
  
  // Memoize location display to prevent unnecessary re-calculations and ensure it updates properly
  const memoizedUserLocationDisplay = useMemo(() => {
    // If we have a valid user location object, display it immediately
    if (user?.location && typeof user.location === 'object' && user.location.area && user.location.city) {
      const hostelName = user.hostel && typeof user.hostel === 'object' ? user.hostel.name : '';
      return hostelName 
        ? `${hostelName}, ${user.location.area}` 
        : `${user.location.area}, ${user.location.city}`;
    }
    
    // Otherwise use the computed display text
    return userLocationDisplay;
  }, [userLocationDisplay, user?.location, user?.hostel]);
  
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
  }, [user?.uid, user?.location, user?.hostel, locations, hostels, findLocationById, findHostelById, fetchFreshUserData, isRefreshingLocation]);
  
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
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm transition-all duration-300" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>
      
      {/* Mobile Location Bar - Display only, no dropdown */}
      {!isAdminView && (
        <div className={`mobile-location-bar md:hidden bg-white border-b border-gray-200 z-[56] transition-all duration-300 ${hideLocationBar ? 'max-h-0 py-0' : 'max-h-20 py-2'}`}>
          <div className="px-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center text-xs py-1 px-2 rounded-md" style={{fontFamily: 'system-ui, -apple-system, sans-serif', color: 'rgba(40, 28, 32, 0.7)'}}>
                <img src="/compass.png" alt="Location" className="h-4 w-4 mr-2" />
                <span className="truncate max-w-[120px] font-light">{memoizedUserLocationDisplay}</span>
                {user && typeof hasValidDeliveryLocation === 'function' && !hasValidDeliveryLocation() && (
                  <AlertTriangle className="h-3 w-3 ml-1 text-amber-400" />
                )}
              </div>
              
              {/* Mobile Notification Bell - Right Side */}
              <div className="flex items-center">
                <NotificationBell />
              </div>
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
                <span className="transition-colors duration-300 font-light text-bold sm:text-xl md:text-2xl truncate max-w-[120px] sm:max-w-none" style={{fontFamily: 'system-ui, -apple-system, sans-serif', color: '#281c20'}}>
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
                <Link to="/products" className="nav-item flex items-center gap-2 px-3 py-2 text-sm md:text-base rounded-lg transition-all duration-300 relative group" style={{fontFamily: 'system-ui, -apple-system, sans-serif', color: '#281c20'}}>
                  <img src="/food.png" alt="Menu" className="h-5 w-5 transition-all duration-300 group-hover:scale-110" />
                  <span className="relative z-10">Menu</span>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#733857] to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-full"></div>
                </Link>
                
                {/* Invisible bridge to prevent hover gap */}
                {isMegaMenuOpen && (
                  <div className="absolute top-full left-0 w-full h-3 bg-transparent" />
                )}
                
                {/* Mega Menu Dropdown */}
                {isMegaMenuOpen && filteredCategories.length > 0 && (
                  <div
                    className="absolute top-full left-0 mt-3 w-[600px] h-[400px] bg-gradient-to-br from-[#040404] via-[#281c20] to-[#412434] backdrop-blur-sm shadow-xl rounded-lg overflow-hidden z-50 border border-[#733857]/20 transform opacity-0 scale-95 animate-dropdown"
                    style={{fontFamily: 'system-ui, -apple-system, sans-serif', animation: 'dropdownFadeIn 0.3s ease-out forwards'}}
                  >
                    <div className="flex h-full">
                      {/* Categories Sidebar */}
                      <div className="w-1/2 bg-gradient-to-br from-[#040404] via-[#281c20] to-[#412434] border-r border-[#733857]/20">
                        <div className="px-4 py-3 bg-[#281c20]/50 text-white/60 border-b border-[#733857]/20">
                          <h3 className="text-sm font-light tracking-wide uppercase">Categories</h3>
                        </div>
                        <div className="p-4 overflow-y-auto h-[calc(100%-56px)] custom-scrollbar">
                          <div className="space-y-1">
                            {filteredCategories.map((category) => (
                              <button
                                key={category._id}
                                className={`w-full text-left px-3 py-2 rounded-md transition-all duration-200 group relative ${
                                  hoveredCategory?._id === category._id
                                    ? 'bg-white/5 text-[#A855F7]'
                                    : 'text-white hover:bg-white/5 hover:text-[#A855F7]'
                                }`}
                                onMouseEnter={() => handleCategoryHover(category)}
                                onClick={() => {
                                  setIsMegaMenuOpen(false);
                                  navigate(`/products?category=${category._id}`);
                                }}
                              >
                                <span className="relative z-10 font-light text-sm">{category.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* Dynamic Image Display */}
                      <div className="w-1/2 bg-gradient-to-br from-[#040404] via-[#281c20] to-[#412434] flex flex-col">
                        <div className="px-4 py-3 bg-[#281c20]/50 text-white border-b border-[#733857]/20">
                          <h3 className="text-sm font-light tracking-wide uppercase">
                            {hoveredCategory ? hoveredCategory.name : 'Select Category'}
                          </h3>
                        </div>
                        <div className="flex-1 flex items-center justify-center p-6">
                          {hoveredCategory && hoveredCategory.featuredImage ? (
                            <div className="relative w-full h-full max-w-[200px] max-h-[200px] rounded-lg overflow-hidden">
                              <img 
                                src={hoveredCategory.featuredImage} 
                                alt={hoveredCategory.name}
                                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                              <div className="hidden w-full h-full bg-[#281c20]/50 items-center justify-center">
                                <Utensils className="h-16 w-16 text-white/40" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-full max-w-[200px] max-h-[200px] bg-[#281c20]/50 rounded-lg flex items-center justify-center border border-[#733857]/20">
                              <div className="text-center">
                                <Utensils className="h-16 w-16 text-white/40 mx-auto mb-3" />
                                <p className="text-white/50 text-sm font-light">
                                  {hoveredCategory ? 'No Image Available' : 'Hover over a category'}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="px-4 py-3 bg-gradient-to-br from-[#040404] via-[#281c20] to-[#412434] border-t border-[#733857]/20">
                          <button 
                            className="w-full bg-[#A855F7] text-white py-2 px-4 rounded-lg font-light text-sm hover:bg-[#A855F7]/80 transition-all duration-200 shadow-sm hover:shadow-md"
                            onClick={() => {
                              setIsMegaMenuOpen(false);
                              navigate('/products');
                            }}
                          >
                            View All Products
                          </button>
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
                  className="nav-item flex items-center gap-2 px-3 py-2 text-sm md:text-base rounded-lg transition-all duration-300 relative group"
                  onClick={toggleLocationDropdown}
                  style={{fontFamily: 'system-ui, -apple-system, sans-serif', color: '#281c20'}}
                >
                  <img src="/compass.png" alt="Location" className="h-5 w-5 transition-all duration-300 group-hover:scale-110" />
                  <span className="truncate max-w-[120px] sm:max-w-[140px] font-light relative z-10">{memoizedUserLocationDisplay}</span>
                  <ChevronDown className="h-4 w-4 transition-all duration-300 group-hover:rotate-180" style={{color: '#281c20'}} />
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
                    className="absolute top-full left-0 mt-3 w-56 bg-gradient-to-br from-[#040404] via-[#281c20] to-[#412434] shadow-xl rounded-lg overflow-hidden z-50 border border-[#733857]/20 transform opacity-0 scale-95 animate-dropdown"
                    style={{fontFamily: 'system-ui, -apple-system, sans-serif', animation: 'dropdownFadeIn 0.3s ease-out forwards'}}
                  >
                    <div className="px-4 py-3 text-white border-b border-[#733857]/20">
                      <h3 className="text-xs font-light tracking-wide uppercase">Settings</h3>
                    </div>
                    <div className="p-2">
                      <Link
                        to="/profile"
                        className="flex items-center gap-3 px-3 py-2 text-white hover:text-[#A855F7] hover:bg-white/5 rounded-lg transition-all duration-200 font-light"
                        style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}
                        onClick={() => setIsLocationDropdownOpen(false)}
                      >
                        <Settings className="h-4 w-4 text-white" />
                        <span>Edit in settings</span>
                      </Link>
                    </div>
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
                    <Link to="/admin/dashboard" className="flex items-center px-4 py-3 text-white hover:text-[#A855F7] rounded-lg transition-all duration-300 relative group" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>
                      <Settings className="h-5 w-5 text-white group-hover:text-[#A855F7] transition-colors duration-300" />
                      <span className="ml-2 text-sm font-light">Dashboard</span>
                    </Link>
                  </div>
                )}

                {/* User Menu - Uses role-based display */}
                <UserMenu />



                {/* Favorites component */}
                <FavoritesIcon />

                {/* Notification Bell */}
                <NotificationBell />

                {/* Cart component - Premium Design with Tooltip */}
                <div className="tooltip">
                  <div className="tooltip-content">
                    <div className="animate-bounce text-[#A855F7] -rotate-10 text-sm font-black italic select-none">Cart</div>
                  </div>
                  <Link 
                    to="/cart" 
                    className="flex items-center px-3 py-2 rounded-lg transition-all duration-300 relative group" 
                    style={{fontFamily: 'system-ui, -apple-system, sans-serif', color: '#281c20'}}
                    data-cart-icon="true"
                  >
                    <img src="/ice-cream-cart.png" alt="Cart" className="h-5 w-5 transition-all duration-300 group-hover:scale-110" />
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
            <a 
              href="https://wa.me/917845712388"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-300 shadow-sm"
              style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}
              title="Contact us on WhatsApp"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
              <span className="text-xs font-light hidden sm:inline">WhatsApp</span>
            </a>
            
            {!user && (
              <button 
                onClick={toggleAuthPanel}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 group"
                style={{fontFamily: 'system-ui, -apple-system, sans-serif', color: '#281c20'}}
              >
                <User className="h-4 w-4 transition-colors duration-300" style={{color: '#281c20'}} />
                <span className="text-sm font-light">Login</span>
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
