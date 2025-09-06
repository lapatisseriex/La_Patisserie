import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../../App';
import { useCart } from '../../context/CartContext';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import './Header.css';

// Import icons
import { 
  Search, 
  User, 
  Menu, 
  X, 
  MapPin, 
  ChevronDown,
  ShoppingBag
} from 'lucide-react';

const Header = () => {
  const { 
    toggleAuthPanel, 
    isLoggedIn, 
    logout, 
    userLocation, 
    setUserLocation 
  } = useContext(AuthContext);
  
  const { cartCount } = useCart();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  const location = useLocation();
  const locationDropdownRef = useRef(null);
  const categorySliderRef = useRef(null);
  
  // Check if we're on a cart or payment page
  const isCartOrPaymentPage = location.pathname === '/cart' || location.pathname === '/payment';
  
  // Sample categories data for the category bar
  const categories = [
    { id: 1, name: "Birthday Cakes", image: "/images/cake1.png" },
    { id: 2, name: "Cupcakes", image: "/images/cake2.png" },
    { id: 3, name: "Wedding Cakes", image: "/images/cake3.png" },
    { id: 4, name: "Pastries", image: "/images/cake1.png" },
    { id: 5, name: "Cookies", image: "/images/cake2.png" },
    { id: 6, name: "Brownies", image: "/images/cake3.png" },
    { id: 7, name: "Donuts", image: "/images/cake1.png" },
    { id: 8, name: "Ice Cream Cakes", image: "/images/cake2.png" }
  ];
  
  // Sample city locations for the dropdown
  const cityLocations = [
    "New York", 
    "Los Angeles", 
    "Chicago", 
    "Houston", 
    "Phoenix", 
    "Philadelphia",
    "San Antonio",
    "San Diego"
  ];

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

  // No need for manual swiper initialization when using Swiper React components
  
  // Handle location selection
  const handleLocationSelect = (city) => {
    setUserLocation(city);
    setIsLocationDropdownOpen(false);
  };
  
  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  // Handle category selection
  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
  };
  
  // Render breadcrumb for cart/payment pages
  const renderBreadcrumb = () => {
    if (location.pathname === '/cart') {
      return (
        <div className="flex items-center text-sm text-gray-600 px-4 py-3 bg-gray-50">
          <Link to="/" className="hover:text-cakePink">Home</Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-gray-800">Shopping Cart</span>
        </div>
      );
    } else if (location.pathname === '/payment') {
      return (
        <div className="flex items-center text-sm text-gray-600 px-4 py-3 bg-gray-50">
          <Link to="/" className="hover:text-cakePink">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/cart" className="hover:text-cakePink">Shopping Cart</Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-gray-800">Checkout</span>
        </div>
      );
    }
    return null;
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-white transition-all duration-300 ${isScrolled ? 'shadow-md' : ''}`}>
      {/* Top Bar - City Selector */}
      <div className="bg-white py-2 px-4 border-b border-gray-100">
        <div className="container mx-auto flex justify-between items-center">
          <div className="relative" ref={locationDropdownRef}>
            <button 
              className="flex items-center text-sm text-cakeBrown hover:text-cakePink-dark transition-colors"
              onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
            >
              <MapPin className="h-4 w-4 mr-1" />
              <span>{userLocation}</span>
              <ChevronDown className="h-4 w-4 ml-1" />
            </button>
            
            {/* City Dropdown */}
            {isLocationDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white shadow-lg rounded-md overflow-hidden z-50">
                <ul className="py-1">
                  {cityLocations.map((city) => (
                    <li key={city}>
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-cakePink-light hover:text-cakeBrown transition-colors"
                        onClick={() => handleLocationSelect(city)}
                      >
                        {city}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="text-sm text-cakeBrown">
            <span>Free delivery on orders over $50</span>
          </div>
        </div>
      </div>
      
      {/* Middle Bar - Logo and Profile/Login */}
      <div className="py-4 px-4 bg-white">
        <div className="container mx-auto flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src="/images/logo.png" alt="Sweet Cake Logo" className="h-10" />
            <span className="ml-2 text-2xl font-bold text-cakeBrown">La Patisserie</span>
          </Link>
          
          {/* Search Bar - Desktop */}
          <div className="hidden md:flex relative mx-4 flex-1 max-w-md">
            <input 
              type="text" 
              placeholder="Search for cakes, cookies, etc..." 
              className="w-full py-2 px-4 pr-10 rounded-full border border-gray-200 focus:outline-none focus:border-cakePink focus:ring-1 focus:ring-cakePink"
            />
            <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-cakePink">
              <Search className="h-5 w-5" />
            </button>
          </div>
          
          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center space-x-6">
            {isLoggedIn ? (
              <>
                {/* Profile when logged in */}
                <div className="relative group">
                  <button className="flex items-center text-cakeBrown hover:text-cakePink transition-colors">
                    <User className="h-5 w-5 mr-1" />
                    <span>My Account</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                    <ul className="py-1">
                      <li>
                        <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-cakePink-light hover:text-cakeBrown">
                          Profile
                        </Link>
                      </li>
                      <li>
                        <Link to="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-cakePink-light hover:text-cakeBrown">
                          Orders
                        </Link>
                      </li>
                      <li>
                        <button 
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-cakePink-light hover:text-cakeBrown"
                          onClick={logout}
                        >
                          Logout
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
                
                {/* Cart */}
                <Link to="/cart" className="flex items-center text-cakeBrown hover:text-cakePink transition-colors relative">
                  <ShoppingBag className="h-5 w-5 mr-1" />
                  <span>Cart ({cartCount})</span>
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-cakePink text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </>
            ) : (
              <button 
                onClick={toggleAuthPanel}
                className="flex items-center text-cakeBrown hover:text-cakePink transition-colors"
              >
                <User className="h-5 w-5 mr-1" />
                <span>Login / Signup</span>
              </button>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-cakeBrown hover:text-cakePink"
            onClick={toggleMobileMenu}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>
      
      {/* Category Bar or Breadcrumb */}
      {isCartOrPaymentPage ? (
        renderBreadcrumb()
      ) : (
        <div className="bg-white border-t border-b border-gray-100 py-3 px-4 overflow-hidden">
          <div className="container mx-auto relative z-10">
            {/* Category Swiper */}
            <Swiper
            className="category-swiper"
            slidesPerView={2.5}
            spaceBetween={10}
            modules={[]}
            breakpoints={{
              640: {
                slidesPerView: 3.5,
                spaceBetween: 15,
              },
              768: {
                slidesPerView: 4.5,
                spaceBetween: 20,
              },
              1024: {
                slidesPerView: 5.5,
                spaceBetween: 25,
              },
              1280: {
                slidesPerView: 6.5,
                spaceBetween: 30,
              },
            }}
            ref={categorySliderRef}
          >
            {categories.map(category => (
              <SwiperSlide 
                key={category.id}
                className={`cursor-pointer ${selectedCategory === category.id ? 'selected-category' : ''}`}
                onClick={() => handleCategorySelect(category.id)}
              >
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full overflow-hidden mb-1">
                    <img 
                      src={category.image} 
                      alt={category.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs text-center text-cakeBrown leading-tight">
                    {category.name}
                  </span>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
      )}
      
      {/* Floating Cart Button (mobile only) */}
      {cartCount > 0 && !isCartOrPaymentPage && (
        <Link
          to="/cart"
          className="md:hidden fixed bottom-6 right-6 bg-cakePink text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-30"
          aria-label="View Cart"
        >
          <ShoppingBag className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 bg-cakeBrown text-white text-xs w-6 h-6 flex items-center justify-center rounded-full border-2 border-white">
            {cartCount}
          </span>
        </Link>
      )}
      
      {/* Mobile Menu */}
      <div className={`md:hidden fixed inset-0 bg-white z-50 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4">
          <div className="flex justify-between items-center mb-6">
            <Link to="/" className="flex items-center" onClick={() => setIsMobileMenuOpen(false)}>
              <img src="/images/logo.png" alt="Sweet Cake Logo" className="h-14" />
              <span className="ml-2 text-xl font-bold text-cakeBrown">La Patisserie</span>
            </Link>
            <button 
              className="text-cakeBrown hover:text-cakePink"
              onClick={toggleMobileMenu}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Mobile Search */}
          <div className="relative mb-6">
            <input 
              type="text" 
              placeholder="Search for cakes, cookies, etc..." 
              className="w-full py-2 px-4 pr-10 rounded-full border border-gray-200 focus:outline-none focus:border-cakePink focus:ring-1 focus:ring-cakePink"
            />
            <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-cakePink">
              <Search className="h-5 w-5" />
            </button>
          </div>
          
          {/* Mobile Nav Links */}
          <nav className="space-y-4">
            <Link 
              to="/" 
              className="block py-2 text-cakeBrown hover:text-cakePink"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/products" 
              className="block py-2 text-cakeBrown hover:text-cakePink"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Products
            </Link>
            <Link 
              to="/about" 
              className="block py-2 text-cakeBrown hover:text-cakePink"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About Us
            </Link>
            <Link 
              to="/contact" 
              className="block py-2 text-cakeBrown hover:text-cakePink"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact Us
            </Link>
            
            {/* Cart - Always visible */}
            <Link 
              to="/cart" 
              className="block py-2 text-cakeBrown hover:text-cakePink relative"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="flex items-center">
                Cart ({cartCount})
                {cartCount > 0 && (
                  <span className="inline-block ml-1 bg-cakePink text-white text-xs px-2 py-0.5 rounded-full">
                    {cartCount}
                  </span>
                )}
              </span>
            </Link>
            
            {isLoggedIn ? (
              <>
                <Link 
                  to="/profile" 
                  className="block py-2 text-cakeBrown hover:text-cakePink"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  My Account
                </Link>
                <button 
                  className="block w-full text-left py-2 text-cakeBrown hover:text-cakePink"
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <button 
                className="block w-full text-left py-2 text-cakeBrown hover:text-cakePink"
                onClick={() => {
                  toggleAuthPanel();
                  setIsMobileMenuOpen(false);
                }}
              >
                Login / Signup
              </button>
            )}
          </nav>
        </div>
      </div>

    </header>
  );
};

export default Header;
