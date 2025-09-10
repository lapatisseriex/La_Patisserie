import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext/AuthContext';
import { useLocation as useLocationContext } from '../../context/LocationContext/LocationContext';
import { useCart } from '../../context/CartContext';
import { useCategory } from '../../context/CategoryContext/CategoryContext';
import './Header.css';

// Import UserMenu component
import UserMenu from './UserMenu/UserMenu';

// Import icons
import { 
  Search, 
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
  
  // Function to toggle mobile menu
  
  const location = useLocation();
  const navigate = useNavigate();
  const locationDropdownRef = useRef(null);
  const categorySliderRef = useRef(null);
  
  // Check if we're on a cart or payment page
  const isCartOrPaymentPage = location.pathname === '/cart' || location.pathname === '/payment';
  
  // Memoize values that should only update when their dependencies change
  const memoizedCartCount = useMemo(() => cartCount, [cartCount]);
  
  // Use categories from database or fall back to empty array
  // We'll only show active categories in the header
  const categories = useMemo(() => {
    if (!dbCategories || dbCategories.length === 0) {
      return [];
    }
    
    // Filter active categories and ensure all required fields are present
    return dbCategories
      .filter(category => category.isActive)
      .map(category => ({
        _id: category._id,  // Keep the original _id
        id: category._id,   // Also provide as id for compatibility
        name: category.name,
        featuredImage: category.featuredImage || null,
        images: category.images || [],
      }));
  }, [dbCategories]);
  
  // Get user's location display name
  const [userLocationDisplay, setUserLocationDisplay] = useState('Select Location');
  
  // Update location display once when user changes
  // We use a ref to track if we've already set the location
  const locationDisplayInitialized = useRef(false);
  const prevLocationIdRef = useRef(user?.location?._id);
  
  useEffect(() => {
    // Set the location display when the component mounts or when user changes
    if (user?.location && user.location.area && user.location.city) {
      // Check if user has a hostel selected
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
  }, [user?.uid, user?.location?._id]); // Only update when user ID or location ID changes

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
    // Set a CSS variable for the header height to use in body padding
    const header = document.querySelector('header');
    if (header) {
      document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
    }
    
    // Handle resize to update header height variable
    const handleResize = () => {
      const header = document.querySelector('header');
      if (header) {
        document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      // Clean up
      document.body.style.overflow = '';
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
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
  
  // We no longer need an event listener for location updates
  // The user and location changes will be handled by the effect above

  // No need for manual swiper initialization when using Swiper React components
  
  // Handle location selection
  const handleLocationSelect = async (locationId) => {
    if (user) {
      console.log("Updating user location to:", locationId);
      
      // Find the selected location to display immediately
      const selectedLocation = locations.find(loc => loc._id === locationId);
      
      if (selectedLocation) {
        // Update the display immediately without waiting for backend
        // Note: When changing location, we don't know the hostel yet, so show location only
        if (user.hostel && user.hostel.name && user.location?._id === locationId) {
          // If user already has a hostel and is selecting the same location, keep hostel display
          setUserLocationDisplay(`${user.hostel.name}, ${selectedLocation.area}`);
        } else {
          // New location selected, show location only (hostel will be updated in profile)
          setUserLocationDisplay(`${selectedLocation.area}, ${selectedLocation.city}`);
        }
        // Also update the ref to prevent useEffect from updating again
        prevLocationIdRef.current = selectedLocation._id;
      }
      
      // Update the user location in the backend and context
      const success = await updateUserLocation(locationId);
      console.log("Location update success:", success);
      
      // The context will handle updating the user object
    } else {
      toggleAuthPanel(); // Prompt user to login first
    }
    setIsLocationDropdownOpen(false);
  };
  
  // Toggle mobile menu with body scroll lock
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    
    // Prevent body scrolling when menu is open
    if (!isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  };
  
  // Handle category selection
  const handleCategorySelect = (categoryId) => {
    console.log("Category selected:", categoryId);
    setSelectedCategory(categoryId);
    
    // Close mobile menu if open
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
      document.body.style.overflow = '';
    }
    
    // Navigate to products page with category filter
    // Use window.location for now - this could be expanded to use router navigation
    window.location.href = `/products?category=${categoryId}`;
  };
  
  // Render breadcrumb for cart/payment pages
  const renderBreadcrumb = () => {
    if (location.pathname === '/cart') {
      return (
        <div className="flex items-center text-xs sm:text-sm text-gray-600 px-2 sm:px-4 py-2 sm:py-3 bg-gray-50">
          <Link to="/" className="text-cakePink">Home</Link>
          <span className="mx-1 sm:mx-2">/</span>
          <span className="font-medium text-gray-800 truncate">Shopping Cart</span>
        </div>
      );
    } else if (location.pathname === '/payment') {
      return (
        <div className="flex items-center text-xs sm:text-sm text-gray-600 px-2 sm:px-4 py-2 sm:py-3 bg-gray-50 overflow-x-auto whitespace-nowrap">
          <Link to="/" className="text-cakePink flex-shrink-0">Home</Link>
          <span className="mx-1 sm:mx-2 flex-shrink-0">/</span>
          <Link to="/cart" className="text-cakePink flex-shrink-0">Shopping Cart</Link>
          <span className="mx-1 sm:mx-2 flex-shrink-0">/</span>
          <span className="font-medium text-gray-800 flex-shrink-0">Checkout</span>
        </div>
      );
    }
    return null;
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-white transition-all duration-300 ${isScrolled ? 'shadow-md' : ''}`}>
      {/* Top Bar - City Selector (hidden in admin view) */}
      {!isAdminView && (
        <div className="bg-white py-1 sm:py-2 px-2 sm:px-4 border-b border-gray-100">
          <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
            <div className="relative w-full sm:w-auto" ref={locationDropdownRef}>
              <button 
                className="flex items-center text-xs sm:text-sm text-cakeBrown"
                onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
              >
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="truncate max-w-[120px] sm:max-w-[150px]">{userLocationDisplay}</span>
                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                {user && !hasValidDeliveryLocation() && (
                  <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 ml-1 text-amber-500" />
                )}
              </button>
              
              {/* City Dropdown */}
              {isLocationDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-full sm:w-64 bg-white shadow-lg rounded-md overflow-hidden z-50">
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-xs font-medium text-gray-500">AVAILABLE DELIVERY LOCATIONS</h3>
                  </div>
                  {locationsLoading ? (
                    <div className="p-4 text-center text-gray-500">Loading...</div>
                  ) : locations.length > 0 ? (
                    <ul className="py-1 max-h-48 sm:max-h-64 overflow-y-auto">
                      {locations.map((location) => (
                        <li key={location._id}>
                          <button
                            className={`w-full text-left px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm ${
                              user?.location?._id === location._id
                                ? 'bg-pink-50 text-cakePink font-medium'
                                : 'text-gray-700'
                            }`}
                            onClick={() => handleLocationSelect(location._id)}
                          >
                            {location.area}, {location.city}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-3 sm:p-4 text-center text-xs sm:text-sm text-gray-500">No delivery locations available</div>
                  )}
                  <div className="p-2 sm:p-3 bg-amber-50 border-t border-amber-200">
                    <p className="text-xs text-amber-700">
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
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src="/images/logo.png" alt="Sweet Cake Logo" className="h-8 sm:h-10" />
            <span className="ml-2 text-lg sm:text-xl md:text-2xl font-bold text-cakeBrown truncate max-w-[120px] sm:max-w-none">La Patisserie</span>
          </Link>
          
          {/* Search Bar - Desktop */}
          <div className="hidden md:flex relative mx-4 flex-1 max-w-md">
            <input 
              type="text" 
              placeholder="Search for cakes, cookies, etc..." 
              className="w-full py-2 px-4 pr-10 rounded-full border border-gray-200 focus:outline-none focus:border-cakePink focus:ring-1 focus:ring-cakePink"
              onFocus={(e) => {
                e.preventDefault();
                navigate('/products');
              }}
            />
            <Link 
              to="/products"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            >
              <Search className="h-5 w-5" />
            </Link>
          </div>
          
          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Navigation Links - Desktop */}
            <Link to="/" className="hidden lg:block text-cakeBrown">Home</Link>
            <Link to="/products" className="hidden lg:block text-cakeBrown">Products</Link>
            
            {user && (
              <>
                {/* User Menu - Uses role-based display */}
                <UserMenu />
                
                {/* Cart component */}
                <Link to="/cart" className="flex items-center text-cakeBrown relative">
                  <ShoppingBag className="h-5 w-5 mr-1" />
                  <span>Cart ({memoizedCartCount})</span>
                  {memoizedCartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-cakePink text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                      {memoizedCartCount}
                    </span>
                  )}
                </Link>
              </>
            )}
            
            {!user && (
              <button 
                onClick={toggleAuthPanel}
                className="flex items-center text-cakeBrown"
              >
                <User className="h-5 w-5 mr-1" />
                <span>Login / Signup</span>
              </button>
            )}
          </div>
          
          {/* Mobile Icons */}
          <div className="flex items-center space-x-3 md:hidden">
            {/* User icon for mobile */}
            {!user ? (
              <button 
                onClick={toggleAuthPanel}
                className="text-cakeBrown p-1"
                aria-label="Login"
              >
                <User className="h-5 w-5" />
              </button>
            ) : (
              <Link to="/profile" className="text-cakeBrown p-1" aria-label="Profile">
                <User className="h-5 w-5" />
              </Link>
            )}
            
            {/* Mobile search button - redirects to products page */}
            <Link 
              to="/products"
              className="text-cakeBrown p-1"
              aria-label="Search"
              onClick={(e) => {
                e.preventDefault();
                navigate('/products');
              }}
            >
              <Search className="h-5 w-5" />
            </Link>
            
            {/* Mobile Menu Button */}
            <button 
              className="text-cakeBrown p-1"
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
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <Link to="/" className="flex items-center" onClick={() => setIsMobileMenuOpen(false)}>
            <img src="/images/logo.png" alt="Sweet Cake Logo" className="h-10" />
            <span className="ml-2 text-lg font-bold text-cakeBrown">La Patisserie</span>
          </Link>
          <button 
            className="text-cakeBrown p-1"
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
              className="w-full py-2 px-4 pr-10 rounded-full border border-gray-200 focus:outline-none focus:border-cakePink focus:ring-1 focus:ring-cakePink"
              onFocus={(e) => {
                e.preventDefault();
                setIsMobileMenuOpen(false);
                navigate('/products');
              }}
            />
            <Link 
              to="/products"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              onClick={(e) => {
                e.preventDefault();
                setIsMobileMenuOpen(false);
                navigate('/products');
              }}
            >
              <Search className="h-5 w-5" />
            </Link>
          </div>
          
          {/* Mobile Nav Links */}
          <nav>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Navigation</h3>
              <Link 
                to="/" 
                className="flex items-center py-2.5 text-cakeBrown"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="text-base">Home</span>
              </Link>
              <Link 
                to="/products" 
                className="flex items-center py-2.5 text-cakeBrown"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="text-base">Products</span>
              </Link>
              <Link 
                to="/about" 
                className="flex items-center py-2.5 text-cakeBrown"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="text-base">About Us</span>
              </Link>
              <Link 
                to="/contact" 
                className="flex items-center py-2.5 text-cakeBrown"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="text-base">Contact Us</span>
              </Link>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Your Account</h3>
              
              {/* Cart - Always visible */}
              <Link 
                to="/cart" 
                className="flex items-center justify-between py-2.5 text-cakeBrown"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="flex items-center text-base">
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Cart
                </span>
                {memoizedCartCount > 0 && (
                  <span className="bg-cakePink text-white text-xs px-2 py-0.5 rounded-full">
                    {memoizedCartCount}
                  </span>
                )}
              </Link>
              
              {user ? (
                <>
                  {user.role === 'admin' ? (
                    <>
                      <Link 
                        to="/admin/dashboard" 
                        className="flex items-center py-2.5 text-cakeBrown"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Settings className="h-5 w-5 mr-2" />
                        <span className="text-base">Admin Dashboard</span>
                      </Link>
                      <Link 
                        to="/admin/orders" 
                        className="flex items-center py-2.5 text-cakeBrown"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Package className="h-5 w-5 mr-2" />
                        <span className="text-base">Orders</span>
                      </Link>
                    </>
                  ) : (
                    <Link 
                      to="/profile" 
                      className="flex items-center py-2.5 text-cakeBrown"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <User className="h-5 w-5 mr-2" />
                      <span className="text-base">My Account</span>
                    </Link>
                  )}
                  <button 
                    className="flex items-center w-full text-left py-2.5 text-cakeBrown"
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <span className="text-base">Logout</span>
                  </button>
                </>
              ) : (
                <button 
                  className="flex items-center w-full text-left py-2.5 text-cakeBrown"
                  onClick={() => {
                    toggleAuthPanel();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <User className="h-5 w-5 mr-2" />
                  <span className="text-base">Login / Signup</span>
                </button>
              )}
            </div>
          </nav>
        </div>
        
        {/* Mobile menu footer - Selected location */}
        <div className="mt-auto p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-xs text-gray-500">
              <MapPin className="h-3 w-3 mr-1" />
              <span className="truncate max-w-[180px]">{userLocationDisplay}</span>
            </div>
            <button 
              className="text-xs text-cakePink"
              onClick={() => {
                setIsLocationDropdownOpen(true);
                setIsMobileMenuOpen(false);
              }}
            >
              Change
            </button>
          </div>
        </div>
      </div>

    </header>
  );
};

// Export as memoized component to prevent unnecessary re-renders
export default memo(Header);