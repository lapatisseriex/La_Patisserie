import React, { useState, useRef, useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext/AuthContext';

// Using memo to prevent unnecessary re-renders
const UserMenu = memo(() => {
  const { user, logout, toggleAuthPanel, changeAuthType } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dropdownRef = useRef(null);
  
  const isAdmin = user?.role === 'admin';
  const isProfileIncomplete = user && (!user.name || !user.dob || !user.location);
  
  // Store previous user data to avoid excessive logging
  const prevUserRef = useRef({
    id: user?.uid,
    name: user?.name,
    location: user?.location?._id
  });
  
  // Debug user information - only when important data changes
  useEffect(() => {
    if (user) {
      const hasImportantChange = 
        prevUserRef.current.id !== user.uid ||
        prevUserRef.current.name !== user.name ||
        prevUserRef.current.location !== user.location?._id;
        
      if (hasImportantChange) {
        console.log('UserMenu - User Data Updated:', {
          name: user.name,
          dob: user.dob,
          location: user.location,
          phone: user.phone,
          isProfileIncomplete
        });
        
        // Update the reference
        prevUserRef.current = {
          id: user.uid,
          name: user.name,
          location: user.location?._id
        };
      }
    }
  }, [user]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Handle logout
  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
  };
  
  // Handle profile completion
  const handleCompleteProfile = () => {
    setIsMenuOpen(false);
    changeAuthType('profile');
    toggleAuthPanel(); // Open the auth panel with profile form
  };

  // Toggle menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main User Button - Luxurious Design */}
      <button
        onClick={toggleMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          group relative px-6 py-3 
          bg-gradient-to-r from-black to-gray-900
          text-white font-light tracking-widest
          border border-gray-800
          transition-all duration-500 ease-out
          hover:shadow-2xl hover:shadow-black/30
          hover:border-gray-600
          ${isMenuOpen ? 'shadow-2xl shadow-black/30 border-gray-600' : ''}
          ${isProfileIncomplete ? 'ring-1 ring-white/20' : ''}
        `}
        aria-expanded={isMenuOpen}
        aria-haspopup="true"
      >
        {/* Animated Background Overlay */}
        <div className={`
          absolute inset-0 bg-gradient-to-r from-white/5 to-transparent
          transition-opacity duration-500
          ${isHovered || isMenuOpen ? 'opacity-100' : 'opacity-0'}
        `} />
        
        {/* User Name Display */}
        <div className="relative flex items-center justify-between min-w-[120px]">
          <span className="text-sm font-light tracking-wider">
            {isAdmin 
              ? 'ADMIN' 
              : user?.name 
                ? user.name.split(' ')[0].toUpperCase() 
                : 'ACCOUNT'
            }
          </span>
          
          {/* Custom Dropdown Arrow */}
          <div className={`
            ml-3 w-0 h-0 
            border-l-[4px] border-l-transparent
            border-r-[4px] border-r-transparent
            border-t-[5px] border-t-white
            transition-transform duration-300
            ${isMenuOpen ? 'rotate-180' : ''}
          `} />
        </div>
        
        {/* Profile Status Indicator */}
        {isProfileIncomplete && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-pulse" />
        )}
        
        {/* Subtle Animation Line */}
        <div className={`
          absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-white to-transparent
          transition-all duration-500
          ${isHovered || isMenuOpen ? 'w-full' : 'w-0'}
        `} />
      </button>
      
      {/* Dropdown Menu - Professional Design */}
      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-64 z-50">
          {/* Backdrop Blur Effect */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-lg" />
          
          {/* Main Menu Container */}
          <div className="relative bg-white/95 backdrop-blur-lg shadow-2xl rounded-lg overflow-hidden border border-gray-200">
            
            {/* User Info Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-black to-gray-900 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-light tracking-wide">
                    {user?.name || 'Guest User'}
                  </h3>
                  <p className="text-xs text-gray-300 mt-1 font-light tracking-wider">
                    {user?.phone || 'Welcome'}
                  </p>
                </div>
                
                {/* Status Badge */}
                {isAdmin && (
                  <div className="px-2 py-1 bg-white/10 rounded-full">
                    <span className="text-xs font-light tracking-widest">ADMIN</span>
                  </div>
                )}
              </div>
              
              {/* Profile Completion Notice */}
              {isProfileIncomplete && (
                <div className="mt-3 p-2 bg-white/10 rounded border border-white/20">
                  <p className="text-xs text-white/90 font-light tracking-wide">
                    Complete your profile for the full experience
                  </p>
                </div>
              )}
            </div>
            
            {/* Menu Items */}
            <div className="py-2">
              {isAdmin ? (
                <>
                  <MenuItem
                    to="/admin/dashboard"
                    label="DASHBOARD"
                    onClick={() => setIsMenuOpen(false)}
                  />
                  <MenuItem
                    to="/admin/orders"
                    label="ORDER MANAGEMENT"
                    onClick={() => setIsMenuOpen(false)}
                  />
                </>
              ) : (
                <>
                  {/* Complete Profile Button */}
                  {isProfileIncomplete && (
                    <MenuButton
                      onClick={handleCompleteProfile}
                      label="COMPLETE PROFILE"
                      priority
                    />
                  )}
                  
                  <MenuItem
                    to="/profile"
                    label="MY PROFILE"
                    onClick={() => setIsMenuOpen(false)}
                  />
                  <MenuItem
                    to="/orders"
                    label="ORDER HISTORY"
                    onClick={() => setIsMenuOpen(false)}
                  />
                </>
              )}
              
              <MenuItem
                to="/cart"
                label="SHOPPING BOX"
                onClick={() => setIsMenuOpen(false)}
              />
              
              {/* Logout Button - Special Styling */}
              <div className="mt-3 px-3">
                <button 
                  onClick={handleLogout}
                  className="
                    w-full px-4 py-3
                    bg-gradient-to-r from-gray-900 to-black
                    text-white text-sm font-light tracking-widest
                    border border-gray-800
                    hover:shadow-lg hover:shadow-black/20
                    hover:border-gray-600
                    transition-all duration-300
                    group relative overflow-hidden
                  "
                >
                  <span className="relative z-10">SIGN OUT</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

// MenuItem Component - Clean Link Design
const MenuItem = ({ to, label, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="
      block px-6 py-3
      text-black text-sm font-light tracking-wider
      hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100
      border-b border-gray-100 last:border-b-0
      transition-all duration-300
      group relative overflow-hidden
    "
  >
    <span className="relative z-10">{label}</span>
    <div className="absolute left-0 top-0 h-full w-1 bg-black transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
  </Link>
);

// MenuButton Component - For Actions
const MenuButton = ({ onClick, label, priority = false }) => (
  <button
    onClick={onClick}
    className={`
      block w-full px-6 py-3
      text-sm font-light tracking-wider text-left
      border-b border-gray-100
      transition-all duration-300
      group relative overflow-hidden
      ${priority 
        ? 'bg-gradient-to-r from-gray-900 to-black text-white hover:from-gray-800 hover:to-gray-900' 
        : 'text-black hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100'
      }
    `}
  >
    <span className="relative z-10">{label}</span>
    {!priority && (
      <div className="absolute left-0 top-0 h-full w-1 bg-black transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
    )}
  </button>
);

export default UserMenu;






