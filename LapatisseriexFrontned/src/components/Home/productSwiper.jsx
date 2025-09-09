import React, { useState } from 'react';
import ProductCard from './ProductCard';

const ProductSwiperHome = ({ categories = [] }) => {
  const products = categories.map((cat) => cat.firstProduct).filter(Boolean);
  const [startIndex, setStartIndex] = useState(0);

  if (!products.length) {
    return (
      <div className="text-center text-gray-500 py-4">
        No products available.
      </div>
    );
  }

  const visibleCount = 4;
  const total = products.length;

  const handlePrev = () => {
    setStartIndex((prev) => (prev - visibleCount >= 0 ? prev - visibleCount : total - visibleCount));
  };

  const handleNext = () => {
    setStartIndex((prev) => (prev + visibleCount >= total ? 0 : prev + visibleCount));
  };

  const getVisibleProducts = () => {
    const slice = products.slice(startIndex, startIndex + visibleCount);
    // Loop if needed
    if (slice.length < visibleCount) {
      return [...slice, ...products.slice(0, visibleCount - slice.length)];
    }
    return slice;
  };

  return (
    <div className="relative">
      <div className="overflow-hidden">
        <div className="flex space-x-6 px-10">
          {getVisibleProducts().map((product) => (
            <div key={product._id} className="min-w-[280px] max-w-[280px] flex-shrink-0">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={handlePrev}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
      >
        ◀
      </button>
      <button
        onClick={handleNext}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
      >
        ▶
      </button>
    </div>
  );
};

export default ProductSwiperHome;
