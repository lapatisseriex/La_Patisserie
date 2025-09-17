import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, ChevronDown, Heart, ShoppingBag, User, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext/AuthContext';
import { useLocation as useLocationContext } from '../../context/LocationContext/LocationContext';
import { useCart } from '../../context/CartContext';
import UserMenu from '../Header/UserMenu/UserMenu';

const SwiggyLikeHeader = () => {
  const { user, toggleAuthPanel } = useAuth();
  const { locations, updateUserLocation, hasValidDeliveryLocation } = useLocationContext();
  const { cartCount } = useCart();
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const locationDropdownRef = useRef(null);
  const navigate = useNavigate();

  // Get current location display
  const getCurrentLocationDisplay = () => {
    if (user?.location) {
      if (user.hostel && user.hostel.name) {
        return `${user.hostel.name}, ${user.location.area}`;
      }
      return `${user.location.area}, ${user.location.city}`;
    }
    return 'Select Location';
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target)) {
        setIsLocationDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocationSelect = (locationId) => {
    setIsLocationDropdownOpen(false);
    if (user) {
      navigate('/profile');
    } else {
      toggleAuthPanel();
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Main Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        {/* Top section - Location and Actions */}
        <div className="border-b border-gray-100">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              
              {/* Left: Logo + Location */}
              <div className="flex items-center space-x-4">
                {/* Logo */}
                <Link to="/" className="flex items-center">
                  <img src="/images/logo.png" alt="La Patisserie" className="h-8 w-8" />
                  <span className="ml-2 text-lg font-bold text-black hidden sm:block">La Patisserie</span>
                </Link>

                {/* Location Selector */}
                <div className="relative" ref={locationDropdownRef}>
                  <button
                    onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                    className="flex items-center space-x-1 text-gray-700 hover:text-black transition-colors py-2 px-3 rounded-md hover:bg-gray-50"
                  >
                    <MapPin className="w-4 h-4 text-orange-500" />
                    <div className="flex flex-col items-start">
                      <div className="flex items-center">
                        <span className="font-medium text-sm">
                          {getCurrentLocationDisplay()}
                        </span>
                        <ChevronDown className="w-4 h-4 ml-1" />
                      </div>
                      {user?.location && (
                        <span className="text-xs text-gray-500 truncate max-w-[150px]">
                          {user.location.city}
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Location Dropdown */}
                  {isLocationDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-80 bg-white shadow-xl rounded-lg border border-gray-200 z-50">
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Choose Location</h3>
                        {locations && locations.length > 0 ? (
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {locations.map((location) => (
                              <button
                                key={location._id}
                                onClick={() => handleLocationSelect(location._id)}
                                className={`w-full text-left p-3 rounded-md transition-colors ${
                                  user?.location?._id === location._id
                                    ? 'bg-orange-50 border border-orange-200'
                                    : 'hover:bg-gray-50 border border-transparent'
                                }`}
                              >
                                <div className="flex items-start">
                                  <MapPin className="w-4 h-4 text-gray-400 mt-1 mr-3" />
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {location.area}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {location.city}, {location.pincode}
                                    </div>
                                  </div>
                                  {user?.location?._id === location._id && (
                                    <div className="ml-auto text-orange-500">
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            No locations available
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center space-x-4">
                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center space-x-6">
                  {user && (
                    <>
                      {/* Favorites */}
                      <Link
                        to="/favorites"
                        className="flex items-center space-x-1 text-gray-700 hover:text-red-500 transition-colors"
                      >
                        <Heart className="w-5 h-5" />
                        <span className="text-sm font-medium">Favorites</span>
                      </Link>

                      {/* Cart */}
                      <Link
                        to="/cart"
                        className="flex items-center space-x-1 text-gray-700 hover:text-black transition-colors relative"
                      >
                        <ShoppingBag className="w-5 h-5" />
                        <span className="text-sm font-medium">Cart</span>
                        {cartCount > 0 && (
                          <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                            {cartCount}
                          </span>
                        )}
                      </Link>

                      {/* User Menu */}
                      <UserMenu />
                    </>
                  )}

                  {!user && (
                    <button
                      onClick={toggleAuthPanel}
                      className="flex items-center space-x-1 text-gray-700 hover:text-black transition-colors"
                    >
                      <User className="w-5 h-5" />
                      <span className="text-sm font-medium">Sign In</span>
                    </button>
                  )}
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={toggleMobileMenu}
                  className="md:hidden p-2 text-gray-700 hover:text-black transition-colors"
                >
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom section - Navigation */}
        <div className="hidden md:block">
          <div className="container mx-auto px-4">
            <div className="flex items-center space-x-8 py-3">
              <Link
                to="/products"
                className="text-sm font-medium text-gray-700 hover:text-black transition-colors"
              >
                Menu
              </Link>
              <Link
                to="/special"
                className="text-sm font-medium text-gray-700 hover:text-black transition-colors"
              >
                Special Deals
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeMobileMenu} />
          
          {/* Mobile Menu Panel */}
          <div className="fixed top-0 right-0 w-80 h-full bg-white shadow-lg pt-16">
            <div className="p-6">
              {user ? (
                <div className="space-y-6">
                  {/* User Info */}
                  <div className="pb-4 border-b border-gray-200">
                    <div className="font-medium text-gray-900">{user.name || 'User'}</div>
                    <div className="text-sm text-gray-500">{user.phone}</div>
                  </div>

                  {/* Navigation Links */}
                  <div className="space-y-4">
                    <Link
                      to="/favorites"
                      onClick={closeMobileMenu}
                      className="flex items-center space-x-3 text-gray-700 hover:text-red-500 transition-colors"
                    >
                      <Heart className="w-5 h-5" />
                      <span>Favorites</span>
                    </Link>

                    <Link
                      to="/cart"
                      onClick={closeMobileMenu}
                      className="flex items-center space-x-3 text-gray-700 hover:text-black transition-colors"
                    >
                      <ShoppingBag className="w-5 h-5" />
                      <span>Cart</span>
                      {cartCount > 0 && (
                        <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                          {cartCount}
                        </span>
                      )}
                    </Link>

                    <Link
                      to="/products"
                      onClick={closeMobileMenu}
                      className="block text-gray-700 hover:text-black transition-colors"
                    >
                      Menu
                    </Link>

                    <Link
                      to="/profile"
                      onClick={closeMobileMenu}
                      className="block text-gray-700 hover:text-black transition-colors"
                    >
                      Profile
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={() => {
                      toggleAuthPanel();
                      closeMobileMenu();
                    }}
                    className="w-full bg-orange-500 text-white py-3 px-4 rounded-md font-medium hover:bg-orange-600 transition-colors"
                  >
                    Sign In
                  </button>

                  <Link
                    to="/products"
                    onClick={closeMobileMenu}
                    className="block text-gray-700 hover:text-black transition-colors"
                  >
                    Menu
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SwiggyLikeHeader;