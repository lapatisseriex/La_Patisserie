import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth' // optional, can be 'auto' if you prefer instant scroll
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
