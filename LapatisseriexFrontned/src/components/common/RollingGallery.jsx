import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './RollingGallery.css';

const RollingGallery = ({ items }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const dragStartX = useRef(0);
  const dragEndX = useRef(0);
  const initialX = useRef(0);
  const dragThreshold = 40; // Lower threshold for easier swipe
  const containerRef = useRef(null);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragEndX.current = e.clientX;
    initialX.current = currentIndex;
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    dragEndX.current = e.clientX;
    const diff = dragStartX.current - dragEndX.current;
    
    // Update visual feedback while dragging
    if (containerRef.current) {
      const movement = -diff / 2;
      containerRef.current.style.transform = `translateX(${movement}px)`;
    }
  };

  const handleMouseUp = (e) => {
    if (isDragging) {
      const diff = dragStartX.current - dragEndX.current;
      if (Math.abs(diff) > dragThreshold) {
        if (diff > 0) {
          goToNext();
        } else {
          goToPrev();
        }
      } else {
        // Reset position if drag wasn't enough
        if (containerRef.current) {
          containerRef.current.style.transform = '';
        }
      }
    } else {
      // Handle click (when no drag occurred)
      const clickedElement = e.target.closest('.gallery-item');
      if (clickedElement) {
        const index = parseInt(clickedElement.getAttribute('data-index'));
        if (!isNaN(index) && index !== currentIndex) {
          setCurrentIndex(index);
        }
      }
    }
    
    // Reset states
    setIsDragging(false);
    if (containerRef.current) {
      containerRef.current.style.transform = '';
    }
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchEndX.current = e.touches[0].clientX;
    initialX.current = currentIndex;
    // Don't prevent default to allow vertical scrolling
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
    const horizontalDiff = Math.abs(touchStartX.current - e.touches[0].clientX);
    const verticalDiff = Math.abs(touchStartY.current - e.touches[0].clientY);
    
    // Only prevent default and handle horizontal swipe if movement is primarily horizontal
    if (horizontalDiff > verticalDiff && horizontalDiff > 10) {
      // This is primarily a horizontal swipe, prevent default to enable gallery swiping
      e.preventDefault();
      
      const diff = touchStartX.current - touchEndX.current;
      // Provide visual feedback during touch movement
      if (containerRef.current) {
        const movement = -diff / 2;
        containerRef.current.style.transform = `translateX(${movement}px)`;
      }
    }
    // If vertical movement is greater, don't prevent default - allow page scrolling
  };

  const handleTouchEnd = (e) => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > dragThreshold) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    } else {
      // If the touch movement was small, treat it as a tap
      const touchElement = document.elementFromPoint(touchEndX.current, e.changedTouches[0].clientY);
      const galleryItem = touchElement?.closest('.gallery-item');
      if (galleryItem) {
        const index = parseInt(galleryItem.getAttribute('data-index'));
        if (!isNaN(index) && index !== currentIndex) {
          setCurrentIndex(index);
        }
      }
    }
    
    // Reset states
    if (containerRef.current) {
      containerRef.current.style.transform = '';
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  useEffect(() => {
    const interval = setInterval(goToNext, 3000); // Faster auto-scroll
    return () => clearInterval(interval);
  }, [currentIndex]); // Added dependency to ensure smooth transitions

  return (
    <div className="gallery-container">
      <div className="gallery-gradient-left" />
      <div className="gallery-gradient-right" />
      <div className="gallery-content">
        <div 
          ref={containerRef}
          className="gallery-track"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'pan-y' }}
        >
          <AnimatePresence initial={false} mode="popLayout">
            {items.map((item, index) => {
              const isActive = index === currentIndex;
              const isPrev = index === (currentIndex - 1 + items.length) % items.length;
              const isNext = index === (currentIndex + 1) % items.length;
              const shouldRender = isActive || isPrev || isNext;
              
              if (!shouldRender) return null;
              
              return (
                <motion.div
                  key={item.key || index}
                  data-index={index}
                  className={`gallery-item ${isActive ? 'active' : isPrev ? 'prev' : isNext ? 'next' : ''}`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ 
                    scale: isActive ? 1 : 0.8,
                    opacity: isActive ? 1 : isPrev || isNext ? 0.6 : 0,
                    x: isActive ? 0 : isPrev ? '-120%' : isNext ? '120%' : 0,
                    rotateY: isActive ? 0 : isPrev ? 25 : isNext ? -25 : 0,
                    zIndex: isActive ? 3 : isPrev || isNext ? 2 : 1
                  }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                  }}
                >
                  {item.content || item}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default RollingGallery;
