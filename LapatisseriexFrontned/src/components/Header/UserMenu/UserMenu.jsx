import React, { memo, useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../../../hooks/useAuth';

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
        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 border border-transparent cursor-pointer relative group"
        style={{fontFamily: 'sans-serif', color: '#281c20'}}
        aria-label="My Account"
      >
        {/* Show only CUSTOM uploaded profile photos (with a valid public_id). 
            Suppress provider photos (e.g., Google) to avoid the brief flash. */}
        {user?.profilePhoto?.url && user?.profilePhoto?.public_id ? (
          <div className="relative">
            <img 
              src={user.profilePhoto.url} 
              alt="Profile" 
              className="h-10 w-10 rounded-full object-cover transition-all duration-300 group-hover:scale-110 border border-gray-200"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'block';
              }}
            />
            <User 
              className="h-4 w-4 transition-colors duration-300 hidden" 
              style={{color: '#281c20'}} 
            />
          </div>
        ) : (
          <User className="h-4 w-4 transition-colors duration-300" style={{color: '#281c20'}} />
        )}
        
        {isProfileIncomplete && (
          <div 
            className="absolute -top-1 -right-1 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/profile');
            }}
            title="Complete your profile for better experience"
          >
            {/* Elegant Notification Badge */}
            <div className="relative">
              {/* Pulsing outer ring */}
              <div 
                className="absolute inset-0 rounded-full animate-ping opacity-75"
                style={{
                  background: 'linear-gradient(135deg, #733857 0%, #8d4466 50%, #412434 100%)',
                  width: '14px',
                  height: '14px'
                }}
              />
              {/* Main badge */}
              <div 
                className="relative flex items-center justify-center rounded-full shadow-lg transform transition-all duration-300 hover:scale-125 cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #733857 0%, #8d4466 50%, #412434 100%)',
                  width: '14px',
                  height: '14px',
                  animation: 'profileBadgePulse 2s ease-in-out infinite'
                }}
              >
                {/* Inner glow effect */}
                <div 
                  className="absolute inset-0 rounded-full opacity-70 animate-pulse"
                  style={{
                    background: 'radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, transparent 70%)',
                  }}
                />
                {/* Exclamation mark */}
                <div 
                  className="text-white text-xs font-bold leading-none"
                  style={{ fontSize: '8px' }}
                >
                  !
                </div>
                {/* Multiple sparkles */}
                <div 
                  className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-90 animate-pulse"
                  style={{
                    top: '1px',
                    right: '1px',
                    animationDelay: '0.5s'
                  }}
                />
                <div 
                  className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-80 animate-pulse"
                  style={{
                    bottom: '1px',
                    left: '1px',
                    animationDelay: '1s'
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Invisible bridge to prevent hover gap */}
      {isMenuOpen && (
        <div className="absolute top-full right-0 w-full h-1 bg-transparent" />
      )}
      
      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div 
          className="absolute right-0 mt-1 w-56 rounded-lg border border-gray-100 z-50 transform origin-top-right transition-all duration-200 bg-white backdrop-blur-sm"
          style={{ 
            animation: 'fadeIn 0.3s ease-out forwards',
            maxWidth: 'calc(100vw - 20px)',
            boxShadow: '0 8px 32px rgba(40, 28, 32, 0.15), 0 4px 16px rgba(40, 28, 32, 0.1)',
            fontFamily: 'system-ui, -apple-system, sans-serif'
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
          <div className="p-3 border-b border-gray-100">
            <p className="text-xs font-medium tracking-[0.25em] uppercase" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#281c20', opacity: 0.7 }}>MY ACCOUNT</p>
          </div>
          
          <div className="py-1">
            <Link 
              to="/profile" 
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm user-menu-item transition-all duration-300 hover:bg-gray-50/80 hover:transform hover:translateY(-1px) rounded-lg relative group backdrop-filter backdrop-blur-sm"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#281c20' }}
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
              <img 
                src="/yummy.png" 
                alt="Profile Icon" 
                className="h-4 w-4 transition-all duration-300 group-hover:scale-110" 
              />
              <span className="font-light relative z-10">My Profile</span>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#733857] to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-full"></div>
            </Link>
            
            <Link 
              to="/orders" 
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm user-menu-item transition-all duration-300 hover:bg-gray-50/80 hover:transform hover:translateY(-1px) rounded-lg relative group backdrop-filter backdrop-blur-sm"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#281c20' }}
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
              <img 
                src="/cupcake.png" 
                alt="Orders Icon" 
                className="h-4 w-4 transition-all duration-300 group-hover:scale-110" 
              />
              <span className="font-light relative z-10">My Orders</span>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#733857] to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-full"></div>
            </Link>
            
            <Link 
              to="/favorites" 
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm user-menu-item transition-all duration-300 hover:bg-gray-50/80 hover:transform hover:translateY(-1px) rounded-lg relative group backdrop-filter backdrop-blur-sm"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#281c20' }}
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
              <img 
                src="/cakefavorites.png" 
                alt="Favorites Icon" 
                className="h-4 w-4 transition-all duration-300 group-hover:scale-110" 
              />
              <span className="font-light relative z-10">My Favorites</span>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#733857] to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-full"></div>
            </Link>
          </div>
          
          <div className="p-2 border-t border-gray-100">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg user-menu-item transition-all duration-300 hover:bg-gray-50/80 hover:transform hover:translateY(-1px) relative group backdrop-filter backdrop-blur-sm"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#281c20' }}
            >
              <img 
                src="/signout.png" 
                alt="Logout Icon" 
                className="h-4 w-4 transition-all duration-300 group-hover:scale-110" 
              />
              <span className="font-light relative z-10">Sign Out</span>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#733857] to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-full"></div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

UserMenu.displayName = 'UserMenu';

export default UserMenu;

