import React from 'react';

const ProductCardSkeleton = () => {
  return (
    <div className="product-card-skeleton animate-pulse">
      <div className="relative h-48 md:h-64 rounded-lg bg-gray-200"></div>
      <div className="mt-3 h-4 w-3/4 bg-gray-200 rounded"></div>
      <div className="mt-2 h-3 w-1/2 bg-gray-200 rounded"></div>
      <div className="mt-3 flex justify-between items-center">
        <div className="h-5 w-16 bg-gray-200 rounded"></div>
        <div className="h-8 w-8 rounded-full bg-gray-200"></div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;