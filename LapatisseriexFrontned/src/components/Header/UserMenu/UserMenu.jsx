import React, { useState, useRef, useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
import { User, ShoppingBag, LogOut, Settings, Package, ChevronDown, UserCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext/AuthContext';

// Using memo to prevent unnecessary re-renders
const UserMenu = memo(() => {
  const { user, logout, toggleAuthPanel, changeAuthType } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
      <button
        onClick={toggleMenu}
        className="flex items-center text-cakeBrown hover:text-cakePink transition-colors"
        aria-expanded={isMenuOpen}
        aria-haspopup="true"
      >
        {isProfileIncomplete ? (
          <UserCircle className="h-5 w-5 mr-1 text-amber-500" />
        ) : (
          <User className="h-5 w-5 mr-1" />
        )}
        <span className="hidden md:inline">
          {isAdmin 
            ? 'Admin' 
            : user?.name 
              ? user.name.split(' ')[0] 
              : 'Account'
          }
        </span>
        <ChevronDown className="h-4 w-4 ml-1" />
        
        {/* Indicator for incomplete profile */}
        {isProfileIncomplete && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border border-white"></span>
        )}
      </button>
      
      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg rounded-md overflow-hidden z-50 py-1 border border-gray-200">
          <div className="px-4 py-2 border-b border-gray-200">
            <p className="text-sm font-medium text-cakeBrown">
              {user?.name || 'Guest User'}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.phone}</p>
            
            {/* Profile completion notice */}
            {isProfileIncomplete && (
              <div className="mt-2 flex items-center p-1.5 bg-amber-50 rounded text-xs">
                <AlertCircle className="w-3 h-3 text-amber-600 mr-1.5" />
                <span className="text-amber-800">Profile incomplete</span>
              </div>
            )}
          </div>
          
          <ul>
            {isAdmin ? (
              <>
                <li>
                  <Link 
                    to="/admin/dashboard" 
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-cakePink-light hover:text-cakeBrown"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/admin/orders" 
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-cakePink-light hover:text-cakeBrown"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Orders
                  </Link>
                </li>
              </>
            ) : (
              <>
                {/* Complete profile option for users with incomplete profiles */}
                {isProfileIncomplete && (
                  <li>
                    <button 
                      className="w-full flex items-center px-4 py-2 text-sm text-amber-700 bg-amber-50 hover:bg-amber-100"
                      onClick={handleCompleteProfile}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Complete Profile
                    </button>
                  </li>
                )}
                
                <li>
                  <Link 
                    to="/profile" 
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-cakePink-light hover:text-cakeBrown"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/orders" 
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-cakePink-light hover:text-cakeBrown"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    My Orders
                  </Link>
                </li>
              </>
            )}
            
            <li>
              <Link 
                to="/cart" 
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-cakePink-light hover:text-cakeBrown"
                onClick={() => setIsMenuOpen(false)}
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Cart
              </Link>
            </li>
            
            <li className="border-t border-gray-200">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-cakePink-light hover:text-cakeBrown"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
});

export default UserMenu;
