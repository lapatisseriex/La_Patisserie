import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';

const ProductSwiperHome = ({ categories = [] }) => {
  const products = categories.map((cat) => cat.firstProduct).filter(Boolean);
  const [startIndex, setStartIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(4);
  const [itemWidth, setItemWidth] = useState('25%');

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setVisibleCount(1.5);
        setItemWidth('65%');
      } else if (window.innerWidth < 768) {
        setVisibleCount(2.5);
        setItemWidth('40%');
      } else if (window.innerWidth < 1024) {
        setVisibleCount(3.5);
        setItemWidth('30%');
      } else {
        setVisibleCount(4);
        setItemWidth('23%');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!products.length) {
    return (
      <div className="text-center text-gray-500 py-4">
        No products available.
      </div>
    );
  }

  const total = products.length;

  const handlePrev = () => {
    setStartIndex((prev) => {
      const moveBy = Math.floor(visibleCount);
      const newIndex = prev - moveBy;
      return newIndex >= 0 ? newIndex : total - Math.floor(visibleCount);
    });
  };

  const handleNext = () => {
    setStartIndex((prev) => {
      const moveBy = Math.floor(visibleCount);
      const newIndex = prev + moveBy;
      return newIndex >= total ? 0 : newIndex;
    });
  };

  const getVisibleProducts = () => {
    let endIndex = startIndex + Math.ceil(visibleCount) + 1;
    if (endIndex > total) {
      return [...products.slice(startIndex), ...products.slice(0, endIndex - total)];
    }
    return products.slice(startIndex, endIndex);
  };

  const isPrevDisabled = startIndex === 0;
  const isNextDisabled = startIndex + Math.floor(visibleCount) >= total;

  return (
    <div className="relative w-full max-w-screen-xl mx-auto px-4 sm:px-6 md:px-8">
      <div className="flex items-center justify-center space-x-2 sm:space-x-4">
        {/* Previous Button */}
        <button
          onClick={handlePrev}
          disabled={isPrevDisabled}
          className={`hidden sm:flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white shadow-md hover:bg-gray-100 transition-colors ${
            isPrevDisabled ? 'opacity-30 cursor-not-allowed' : ''
          }`}
          aria-label="Previous products"
        >
          ◀
        </button>

        <div className="overflow-hidden flex-1">
          <div className="flex transition-transform duration-300 ease-in-out space-x-4 sm:space-x-6 px-0 sm:px-2">
            {getVisibleProducts().map((product, index) => (
              <div 
                key={`${product._id}-${index}`} 
                className="flex-shrink-0"
                style={{ 
                  width: itemWidth,
                  minWidth: '200px',
                  maxWidth: '280px'
                }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={isNextDisabled}
          className={`hidden sm:flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white shadow-md hover:bg-gray-100 transition-colors ${
            isNextDisabled ? 'opacity-30 cursor-not-allowed' : ''
          }`}
          aria-label="Next products"
        >
          ▶
        </button>
      </div>

      {/* Mobile Navigation Buttons */}
      <div className="flex sm:hidden justify-center mt-4 space-x-8">
        <button
          onClick={handlePrev}
          disabled={isPrevDisabled}
          className={`flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-md hover:bg-gray-100 ${
            isPrevDisabled ? 'opacity-30 cursor-not-allowed' : ''
          }`}
          aria-label="Previous products"
        >
          ◀
        </button>
        <button
          onClick={handleNext}
          disabled={isNextDisabled}
          className={`flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-md hover:bg-gray-100 ${
            isNextDisabled ? 'opacity-30 cursor-not-allowed' : ''
          }`}
          aria-label="Next products"
        >
          ▶
        </button>
      </div>
    </div>
  );
};

export default ProductSwiperHome;