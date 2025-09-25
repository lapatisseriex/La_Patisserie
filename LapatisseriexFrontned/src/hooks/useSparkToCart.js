import { useCallback, useRef } from 'react';
import { useSparkAnimationContext } from '../context/SparkAnimationContext/SparkAnimationContext';
import { useCart } from '../context/CartContext';

export const useSparkToCart = () => {
  const { triggerSparkAnimation } = useSparkAnimationContext();
  const { addToCart } = useCart();
  const buttonRef = useRef(null);

  const triggerSpark = useCallback(() => {
    const buttonElement = buttonRef.current;
    if (buttonElement) {
      triggerSparkAnimation(buttonElement);
    }
  }, [triggerSparkAnimation]);

  const addToCartWithSpark = useCallback(async (product, variant) => {
    console.log('🎯 addToCartWithSpark called:', { product: product?._id, variant });
    console.log('🔗 buttonRef.current:', buttonRef.current);
    
    try {
      // Trigger spark animation from button to cart
      if (buttonRef.current) {
        console.log('🚀 Triggering spark from button');
        triggerSpark(buttonRef.current);
      } else {
        console.warn('⚠️ No buttonRef available for spark animation');
      }
      
      // Add to cart
      console.log('🛒 Adding to cart...');
      await addToCart(product, variant);
      console.log('✅ Added to cart successfully');
    } catch (error) {
      console.error('❌ Error in addToCartWithSpark:', error);
      throw error;
    }
  }, [triggerSpark, addToCart]);

  return {
    buttonRef,
    addToCartWithSpark,
    triggerSpark,
  };
};

export default useSparkToCart;