import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Don't auto-scroll to top for products page with category parameter
    // because we handle that separately in the Products component
    if (pathname === '/products' && search.includes('category=')) {
      return;
    }
    
    // Don't auto-scroll for ProductDisplayPage - it handles its own scrolling
    // with more precise timing to prevent conflicts
    if (pathname.startsWith('/product/')) {
      return;
    }
    
    // For all other navigation, use immediate scroll to prevent timing issues
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto' // Use auto to prevent smooth scroll conflicts
      });
    });
  }, [pathname, search]);

  return null;
};

export default ScrollToTop;





