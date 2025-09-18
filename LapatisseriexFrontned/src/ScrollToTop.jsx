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
    
    // For all other navigation, scroll to top
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, [pathname, search]);

  return null;
};

export default ScrollToTop;





