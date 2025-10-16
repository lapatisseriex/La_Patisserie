import React from 'react';
import { Link, useLocation } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth';

import { useCart } from '../../hooks/useCart';
import { 
  Home, 
  Utensils, 
  ShoppingCart, 
  Package, 
  User,Cake 
} from 'lucide-react';

const BottomNavigation = () => {
  const location = useLocation();
  const { user, toggleAuthPanel } = useAuth();
  const { cartCount } = useCart();

  // Don't show on admin, profile, or payment pages
  if (location.pathname.startsWith('/admin') || 
      location.pathname === '/profile' || 
      location.pathname === '/payment') {
    return null;
  }

  const handleProfileClick = (e) => {
    if (!user) {
      e.preventDefault();
      toggleAuthPanel();
    }
  };

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      imageSrc: '/homemobile.png',
      path: '/',
      isActive: location.pathname === '/'
    },
    {
      id: 'menu',
      label: 'Menu',
      icon: Cake,
      imageSrc: '/food.png',
      path: '/products',
      isActive: location.pathname === '/products'
    },
    {
      id: 'cart',
      label: 'Cart',
      icon: ShoppingCart,
      imageSrc: '/ice-cream-cart.png',
      path: '/cart',
      badge: cartCount > 0 ? cartCount : null,
      isActive: location.pathname === '/cart'
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: Package,
      imageSrc: '/cupcake.png',
      path: '/orders',
      isActive: location.pathname === '/orders',
      requiresAuth: !user,
      onClick: !user ? (e) => {
        e.preventDefault();
        toggleAuthPanel();
      } : null
    },
    {
      id: 'profile',
      label: user ? 'Profile' : 'Login',
      icon: User,
      imageSrc: '/yummy.png',
      path: user ? '/profile' : '/',
      isActive: location.pathname === '/profile',
      requiresAuth: !user,
      onClick: handleProfileClick
    }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          
          return (
            <Link
              key={item.id}
              to={item.path}
              onClick={item.onClick}
              className={`flex flex-col items-center justify-center px-2 py-1 transition-all duration-200 relative ${
                item.isActive 
                  ? 'text-[#733857]' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              <div className="relative">
                {item.imageSrc ? (
                  <img 
                    src={item.imageSrc} 
                    alt={item.label}
                    className={`h-5 w-5 transition-all duration-200 ${
                      item.isActive ? 'opacity-100' : 'opacity-60'
                    }`}
                  />
                ) : (
                  <IconComponent 
                    className={`h-5 w-5 transition-all duration-200 ${
                      item.isActive ? 'text-[#733857]' : 'text-gray-600'
                    }`}
                  />
                )}
                {item.badge && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-[#733857] to-[#281c20] text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-light">
                    {item.badge > 99 ? '99+' : item.badge}
                  </div>
                )}
              </div>
              <span className={`text-xs mt-1 font-light ${
                item.isActive ? 'text-[#733857]' : 'text-gray-600'
              }`}>
                {item.label}
              </span>
              {item.isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-[#733857] rounded-full"></div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;