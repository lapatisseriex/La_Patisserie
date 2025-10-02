import React, { memo, useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../../../context/AuthContext/AuthContextRedux';

import { User, Package, Heart, LogOut, Settings, ShoppingCart } from 'lucide-react';
import './UserMenu.css';

const UserMenu = memo(() => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const timeoutRef = useRef(null);
  
  const isProfileIncomplete = user && (!user.name || !user.dob || !user.location);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Clear any pending timeouts when component unmounts
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleSignOut = (e) => {
    e.preventDefault();
    // Clear any pending timeout
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    logout();
    setIsMenuOpen(false);
    navigate('/');
  };

  return (
    <div 
      className="relative" 
      ref={menuRef}
      onMouseEnter={() => {
        // Clear any existing timeout to prevent menu from closing
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsMenuOpen(true);
      }}
      onMouseLeave={() => {
        // Add a delay before closing the menu
        timeoutRef.current = setTimeout(() => {
          setIsMenuOpen(false);
        }, 150); // Reduced from 3000ms to 150ms for better UX
      }}
    >
      <div 
        className="flex items-center gap-2 px-3 py-2 text-black hover:text-yellow-600 rounded-lg transition-all duration-300 border border-transparent cursor-pointer relative group"
        style={{fontFamily: 'sans-serif'}}
        aria-label="My Account"
      >
        <User className="h-4 w-4 text-gray-600 group-hover:text-yellow-600 transition-colors duration-300" />
        
        {isProfileIncomplete && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 animate-pulse rounded-none" />
        )}
      </div>
      
      {/* Invisible bridge to prevent hover gap */}
      {isMenuOpen && (
        <div className="absolute top-full right-0 w-full h-1 bg-transparent" />
      )}
      
      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div 
          className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-xl border border-gray-100 z-50 transform origin-top-right transition-all duration-200"
          style={{ 
            animation: 'fadeIn 0.3s ease-out forwards',
            maxWidth: 'calc(100vw - 20px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
          }}
          onMouseEnter={() => {
            // Clear timeout when user mouses over the menu
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
          }}
          onMouseLeave={() => {
            // Set timeout when mouse leaves the menu
            timeoutRef.current = setTimeout(() => {
              setIsMenuOpen(false);
            }, 150); // Match the 150ms delay on the parent
          }}
        >
          <div className="p-3 border-b border-gray-200">
            <p className="text-xs font-medium text-gray-600 tracking-wide uppercase">MY ACCOUNT</p>
          </div>
          
          <div className="py-1">
            <Link 
              to="/profile" 
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-black hover:text-yellow-600 hover:bg-gray-50 user-menu-item transition-all duration-200"
              onClick={(e) => {
                // Don't close the menu immediately on click to prevent accidental misclicks
                e.stopPropagation(); // Prevent event bubbling
                // Navigate first, then close with a slight delay
                setTimeout(() => {
                  if (timeoutRef.current) clearTimeout(timeoutRef.current);
                  setIsMenuOpen(false);
                }, 100);
              }}
            >
              <User className="h-4 w-4 text-gray-600" />
              <span className="font-medium">My Profile</span>
            </Link>
            
            <Link 
              to="/profile?tab=orders" 
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-black hover:text-yellow-600 hover:bg-gray-50 user-menu-item transition-all duration-200"
              onClick={(e) => {
                // Don't close the menu immediately on click to prevent accidental misclicks
                e.stopPropagation(); // Prevent event bubbling
                // Navigate first, then close with a slight delay
                setTimeout(() => {
                  if (timeoutRef.current) clearTimeout(timeoutRef.current);
                  setIsMenuOpen(false);
                }, 100);
              }}
            >
              <Package className="h-4 w-4 text-gray-600" />
              <span className="font-medium">My Orders</span>
            </Link>
          </div>
          
          <div className="p-2 border-t border-gray-200">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md user-menu-item transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

UserMenu.displayName = 'UserMenu';

export default UserMenu;

