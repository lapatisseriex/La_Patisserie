import React, { useState } from 'react';
import ProductCard from './ProductCard';

const ProductSwiperHome = ({ categories = [] }) => {
  const products = categories.map(cat => cat.firstProduct).filter(Boolean);
  const [startIndex, setStartIndex] = useState(0);

  if (products.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        No products available.
      </div>
    );
  }

  const visibleCount = 4;
  const total = products.length;

  const handlePrev = () => {
    if (startIndex === 0) {
      setStartIndex(0); // Wrap to initial state without duplication
    } else {
      setStartIndex(startIndex - visibleCount >= 0 ? startIndex - visibleCount : 0);
    }
  };

  const handleNext = () => {
    if (startIndex + visibleCount >= total) {
      setStartIndex(0); // Wrap to initial state without duplication
    } else {
      setStartIndex(startIndex + visibleCount);
    }
  };

  const getVisibleProducts = () => {
    return products.slice(startIndex, startIndex + visibleCount);
  };

  return (
    <div className="relative">
      <div className="overflow-hidden">
        <div className="flex space-x-10 px-20">
          {getVisibleProducts().map(product => (
            <div key={product._id} className="min-w-[280px] max-w-[280px] flex-shrink-0">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
      <button 
        onClick={handlePrev}
        disabled={startIndex === 0}
        className={`absolute left-2 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 ${startIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        ◀
      </button>
      <button 
        onClick={handleNext}
        disabled={startIndex + visibleCount >= total}
        className={`absolute right-2 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 ${startIndex + visibleCount >= total ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        ▶
      </button>
    </div>
  );
};

export default ProductSwiperHome;
