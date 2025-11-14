import React, { memo, useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { useAuth } from '../../../hooks/useAuth';
import { useFavorites } from '../../../context/FavoritesContext/FavoritesContext';

import { User, ChevronRight } from 'lucide-react';
import './UserMenu.css';

const UserMenu = memo(() => {
  const { user, logout } = useAuth();
  const { count: favoritesCount } = useFavorites();
  const [ordersCount, setOrdersCount] = useState(0);
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const timeoutRef = useRef(null);
  
  const isProfileIncomplete = user && (!user.name || !user.dob || !user.location);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Fetch orders count
  useEffect(() => {
    const fetchOrdersCount = async () => {
      if (!user) {
        setOrdersCount(0);
        return;
      }
      
      try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) return;

        const response = await fetch(`${import.meta.env.VITE_API_URL}/payments/orders/user`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setOrdersCount(data.orders?.length || 0);
        }
      } catch (error) {
        console.error('Error fetching orders count:', error);
      }
    };

    fetchOrdersCount();
  }, [user]);

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

  const handleSignOut = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent double-clicks
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    
    try {
      // Clear any pending timeout
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      // Close menu immediately
      setIsMenuOpen(false);
      
      // Perform logout
      await logout();
      
      // Navigate after logout is complete
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div 
      className="relative user-menu" 
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
        style={{color: '#281c20'}}
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
                    background: 'radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, transparent 70%)'}}
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
      
      {/* Dropdown Menu - Compact Icon List Style */}
      {isMenuOpen && (
        <div 
          className="absolute right-0 mt-1 w-72 bg-white border border-gray-200 z-50 transform origin-top-right transition-all duration-200"
          style={{ 
            animation: 'fadeIn 0.3s ease-out forwards',
            maxWidth: 'calc(100vw - 20px)',
            boxShadow: '0 8px 32px rgba(40, 28, 32, 0.15), 0 4px 16px rgba(40, 28, 32, 0.1)'}}
          onMouseEnter={() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
          }}
          onMouseLeave={() => {
            timeoutRef.current = setTimeout(() => {
              setIsMenuOpen(false);
            }, 150);
          }}
        >
          {/* Header Section - User Welcome */}
          <div className="px-4 py-3 bg-gradient-to-r from-[#f9f7f8] to-white border-b border-gray-200">
            <p className="text-xs text-[#722F37] mb-1 tracking-wide">Welcome back,</p>
            <h3 className="text-lg text-[#281C20]" style={{ fontFamily: '"Dancing Script", "Pacifico", "Great Vibes", cursive', fontWeight: '600', letterSpacing: '0.05em' }}>
              {user?.name || 'Guest'}
            </h3>
          </div>
          
          {/* Menu Items - Compact Icon List */}
          <div className="py-1">
            <Link 
              to="/profile" 
              className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                setTimeout(() => {
                  if (timeoutRef.current) clearTimeout(timeoutRef.current);
                  setIsMenuOpen(false);
                }, 100);
              }}
            >
              <div className="flex items-center gap-3">
                <img 
                  src="/yummy.png" 
                  alt="Profile Icon" 
                  className="h-4 w-4 transition-all duration-300" 
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const icon = document.createElement('div');
                    icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#722F37" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
                    icon.className = 'h-4 w-4 transition-all duration-300 inline-block';
                    e.target.parentNode.insertBefore(icon, e.target);
                  }}
                />
                <span className="text-sm text-gray-800">My Profile</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
            </Link>
            
            <Link 
              to="/orders" 
              className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                setTimeout(() => {
                  if (timeoutRef.current) clearTimeout(timeoutRef.current);
                  setIsMenuOpen(false);
                }, 100);
              }}
            >
              <div className="flex items-center gap-3">
                <img 
                  src="/cupcake.png" 
                  alt="Orders Icon" 
                  className="h-4 w-4 transition-all duration-300" 
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const icon = document.createElement('div');
                    icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#722F37" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>';
                    icon.className = 'h-4 w-4 transition-all duration-300 inline-block';
                    e.target.parentNode.insertBefore(icon, e.target);
                  }}
                />
                <span className="text-sm text-gray-800">My Orders</span>
                {ordersCount > 0 && (
                  <span className="text-xs text-[#722F37] font-medium ml-1">{ordersCount}</span>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
            </Link>
            
            <Link 
              to="/favorites" 
              className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                setTimeout(() => {
                  if (timeoutRef.current) clearTimeout(timeoutRef.current);
                  setIsMenuOpen(false);
                }, 100);
              }}
            >
              <div className="flex items-center gap-3">
                <img 
                  src="/cakefavorites.png" 
                  alt="Favorites Icon" 
                  className="h-4 w-4 transition-all duration-300" 
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const icon = document.createElement('div');
                    icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#722F37" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>';
                    icon.className = 'h-4 w-4 transition-all duration-300 inline-block';
                    e.target.parentNode.insertBefore(icon, e.target);
                  }}
                />
                <span className="text-sm text-gray-800">My Favorites</span>
                {favoritesCount > 0 && (
                  <span className="text-xs text-[#722F37] font-medium ml-1">{favoritesCount}</span>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
            </Link>
          </div>
          
          {/* Sign Out Section */}
          <div className="border-t border-gray-200">
            <button
              onClick={handleSignOut}
              disabled={isLoggingOut}
              className={`w-full flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition-all ${isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-3">
                <img 
                  src="/signout.png" 
                  alt="Logout Icon" 
                  className={`h-4 w-4 transition-all duration-300 ${isLoggingOut ? 'opacity-50' : ''}`} 
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const icon = document.createElement('div');
                    icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#722F37" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>';
                    icon.className = `h-4 w-4 transition-all duration-300 inline-block ${isLoggingOut ? 'opacity-50' : ''}`;
                    e.target.parentNode.insertBefore(icon, e.target);
                  }}
                />
                <span className="text-sm text-gray-800">
                  {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

UserMenu.displayName = 'UserMenu';

export default UserMenu;

