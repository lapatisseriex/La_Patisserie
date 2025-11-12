import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const SparkAnimationContext = createContext();

export const useSparkAnimationContext = () => {
  const context = useContext(SparkAnimationContext);
  if (!context) {
    throw new Error('useSparkAnimationContext must be used within a SparkAnimationProvider');
  }
  return context;
};

export const SparkAnimationProvider = ({ children }) => {
  const [sparks, setSparks] = useState([]);
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
    const cartIcon = document.querySelector('[data-cart-icon="true"]') || 
                    document.querySelector('.cart-icon') ||
                    document.querySelector('a[href="/cart"] svg') ||
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

    const triggerSparkAnimation = useCallback((startElement) => {
    console.log('🔥 Spark Animation Triggered!', startElement);
    
    if (!startElement) {
      console.warn('❌ No start element provided for spark animation');
      return;
    }

    const startPos = getElementPosition(startElement);
    console.log('📍 Start position:', startPos);
    
    const endPos = getCartIconPosition();
    console.log('🛒 Cart position:', endPos);

    if (!endPos) {
      console.warn('❌ Cart icon not found for spark animation');
      return;
    }

    const sparkId = Date.now();
    const newSpark = {
      id: sparkId,
      startX: startPos.x,
      startY: startPos.y,
      endX: endPos.x,
      endY: endPos.y};

    console.log('✨ Creating spark:', newSpark);
    setSparks(prev => [...prev, newSpark]);

    // Remove spark after animation completes
    setTimeout(() => {
      setSparks(prev => prev.filter(spark => spark.id !== sparkId));
    }, 800); // Match animation duration
  }, [getElementPosition, getCartIconPosition]);

  const clearAnimation = useCallback((sparkId) => {
    setSparks(prev => prev.filter(spark => spark.id !== sparkId));
  }, []);

  return (
    <SparkAnimationContext.Provider value={{
      sparks,
      triggerSparkAnimation,
      clearAnimation}}>
      {children}
    </SparkAnimationContext.Provider>
  );
};

export default SparkAnimationProvider;