import { useState, useCallback, useRef } from 'react';

export const useSparkAnimation = () => {
  const [activeAnimations, setActiveAnimations] = useState([]);
  const animationIdRef = useRef(0);

  const getElementPosition = useCallback((element) => {
    if (!element) return null;
    
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    return {
      x: rect.left + scrollLeft + rect.width / 2,
      y: rect.top + scrollTop + rect.height / 2};
  }, []);

  const getCartIconPosition = useCallback(() => {
    // Try to find the cart icon in the header
    const cartIcon = document.querySelector('[data-cart-icon]') || 
                    document.querySelector('.cart-icon') ||
                    document.querySelector('a[href="/cart"]') ||
                    document.querySelector('[aria-label*="cart" i]');
    
    if (cartIcon) {
      return getElementPosition(cartIcon);
    }
    
    // Fallback positions for different screen sizes
    const isMobile = window.innerWidth <= 768;
    return {
      x: isMobile ? window.innerWidth - 60 : window.innerWidth - 100,
      y: isMobile ? 60 : 80};
  }, [getElementPosition]);

  const triggerSparkAnimation = useCallback((buttonElement, onComplete) => {
    if (!buttonElement) return;

    const startPosition = getElementPosition(buttonElement);
    const endPosition = getCartIconPosition();

    if (!startPosition || !endPosition) return;

    const animationId = ++animationIdRef.current;
    const newAnimation = {
      id: animationId,
      startPosition,
      endPosition,
      isVisible: true,
      onComplete: () => {
        // Remove this animation from active list
        setActiveAnimations(prev => prev.filter(anim => anim.id !== animationId));
        
        // Trigger cart impact effect
        const cartIcon = document.querySelector('[data-cart-icon]') || 
                        document.querySelector('.cart-icon') ||
                        document.querySelector('a[href="/cart"]');
        
        if (cartIcon) {
          cartIcon.classList.add('cart-impact');
          setTimeout(() => {
            cartIcon.classList.remove('cart-impact');
          }, 300);
        }
        
        // Call the completion callback
        onComplete?.();
      }
    };

    setActiveAnimations(prev => [...prev, newAnimation]);
  }, [getElementPosition, getCartIconPosition]);

  const clearAnimation = useCallback((animationId) => {
    setActiveAnimations(prev => prev.filter(anim => anim.id !== animationId));
  }, []);

  return {
    activeAnimations,
    triggerSparkAnimation,
    clearAnimation};
};

export default useSparkAnimation;