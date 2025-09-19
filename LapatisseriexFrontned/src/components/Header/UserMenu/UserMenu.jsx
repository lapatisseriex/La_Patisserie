




import React, { memo, useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import { User, Package, Heart, LogOut, Settings, ShoppingCart } from 'lucide-react';
import './UserMenu.css';

const UserMenu = memo(() => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  
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
    };
  }, []);

  const handleSignOut = (e) => {
    e.preventDefault();
    logout();
    setIsMenuOpen(false);
    navigate('/');
  };

  return (
    <div 
      className="relative" 
      ref={menuRef}
      onMouseEnter={() => setIsMenuOpen(true)}
      onMouseLeave={() => setIsMenuOpen(false)}
    >
      <div 
        className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-black hover:bg-gray-50 rounded-lg transition-all duration-300 border border-transparent hover:border-gray-200 cursor-pointer relative"
        style={{fontFamily: 'sans-serif'}}
        aria-label="My Account"
      >
        <User className="h-4 w-4 text-gray-600 group-hover:text-black transition-colors duration-300" />
        
        {isProfileIncomplete && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 animate-pulse rounded-none" />
        )}
      </div>
      
      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div 
          className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-xl border border-gray-100 z-50 transform origin-top-right transition-all duration-200"
          style={{ 
            animation: 'fadeIn 0.2s ease-out forwards',
            maxWidth: 'calc(100vw - 20px)'
          }}
        >
          <div className="p-3 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500">MY ACCOUNT</p>
          </div>
          
          <div className="py-1">
            <Link 
              to="/profile" 
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setIsMenuOpen(false)}
            >
              <User className="h-4 w-4 text-gray-500" />
              My Profile
            </Link>
            
            <Link 
              to="/profile?tab=orders" 
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setIsMenuOpen(false)}
            >
              <Package className="h-4 w-4 text-gray-500" />
              My Orders
            </Link>
            
      
          </div>
          
          <div className="p-2 border-t border-gray-100">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-md"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default UserMenu;
