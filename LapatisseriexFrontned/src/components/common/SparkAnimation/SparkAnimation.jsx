import React, { useEffect, useState } from 'react';
import './SparkAnimation.css';

const SparkAnimation = ({ 
  startPosition, 
  endPosition, 
  onAnimationComplete, 
  isVisible,
  sparkId 
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    console.log('✨ SparkAnimation useEffect:', { 
      isVisible, 
      startPosition, 
      endPosition, 
      sparkId 
    });
    
    if (isVisible && startPosition && endPosition) {
      console.log('🎬 Starting spark animation:', sparkId);
      setIsAnimating(true);
      
      // Animation completes after 800ms
      const timer = setTimeout(() => {
        console.log('🏁 Spark animation completed:', sparkId);
        setIsAnimating(false);
        onAnimationComplete?.();
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [isVisible, startPosition, endPosition, onAnimationComplete, sparkId]);

  if (!isVisible || !startPosition || !endPosition || !isAnimating) {
    console.log('🚫 SparkAnimation not rendering:', {
      isVisible, 
      startPosition: !!startPosition, 
      endPosition: !!endPosition, 
      isAnimating 
    });
    return null;
  }

  const deltaX = endPosition.x - startPosition.x;
  const deltaY = endPosition.y - startPosition.y;

  const sparkStyle = {
    '--start-x': `${startPosition.x}px`,
    '--start-y': `${startPosition.y}px`,
    '--end-x': `${endPosition.x}px`,
    '--end-y': `${endPosition.y}px`,
    '--delta-x': `${deltaX}px`,
    '--delta-y': `${deltaY}px`};
  
  console.log('🎨 SparkAnimation rendering with style:', sparkStyle);

  return (
    <div 
      className="spark-animation-container"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999}}
    >
      <div 
        className={`spark-particle ${isAnimating ? 'animating' : ''}`}
        style={sparkStyle}
        key={sparkId}
      >
        {/* Main spark */}
        <div className="spark-core">
          <div className="spark-glow"></div>
          <div className="spark-trail"></div>
        </div>
        
        {/* Trailing particles */}
        <div className="spark-particles">
          <div className="particle particle-1"></div>
          <div className="particle particle-2"></div>
          <div className="particle particle-3"></div>
        </div>
      </div>
    </div>
  );
};

export default SparkAnimation;