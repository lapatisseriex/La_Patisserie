import React from 'react';

const PremiumCardSkeleton = ({ 
  variant = 'product', 
  count = 3,
  className = ''
}) => {
  const shimmerAnimation = `
    @keyframes shimmer {
      0% { background-position: -200px 0; }
      100% { background-position: calc(200px + 100%) 0; }
    }
    .shimmer {
      background: linear-gradient(90deg, #f0f0f0 0%, #e8e8e8 20%, #f0f0f0 40%, #f0f0f0 100%);
      background-size: 200px 100%;
      animation: shimmer 1.5s infinite linear;
    }
  `;

  const ProductCardSkeleton = () => (
    <div className="overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all duration-500 ease-in-out hover:scale-[1.02] h-72 cursor-pointer border border-gray-200 flex flex-col">
      {/* Product Image - Exact aspect square like real card */}
      <div className="w-full aspect-square relative">
        <div className="w-full aspect-square relative group overflow-hidden">
          <div className="w-full h-full bg-gray-200 shimmer"></div>
          
          {/* Heart button skeleton */}
          <div className="absolute top-2 left-2 p-1.5 w-7 h-7 bg-gray-200 shimmer border border-gray-300"></div>
          
          {/* Image dots indicator skeleton */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1.5">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="w-1.5 h-1.5 bg-gray-300 shimmer"></div>
            ))}
          </div>
        </div>
      </div>

      {/* Content Section - Exact spacing like real card */}
      <div className="flex-1 p-3 flex flex-col justify-between">
        <div>
          {/* Product name - 2 lines */}
          <div className="mb-1">
            <div className="h-4 bg-gray-200 shimmer mb-1 w-full"></div>
            <div className="h-4 bg-gray-200 shimmer w-3/4"></div>
          </div>

          {/* Egg/No Egg Indicator skeleton */}
          <div className="mb-2">
            <div className="inline-flex items-center h-5 w-20 bg-gray-200 shimmer border border-gray-300"></div>
          </div>

          {/* Description - 2 lines */}
          <div className="mb-2">
            <div className="h-3 bg-gray-200 shimmer mb-1 w-full"></div>
            <div className="h-3 bg-gray-200 shimmer w-4/5"></div>
          </div>

          {/* Price section */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-baseline gap-1">
              <div className="h-3 w-12 bg-gray-200 shimmer"></div>
              <div className="h-4 w-16 bg-gray-200 shimmer"></div>
            </div>
            <div className="h-4 w-12 bg-gray-200 shimmer"></div>
          </div>
        </div>

        {/* Add to cart button */}
        <div className="h-8 bg-gray-200 shimmer w-full"></div>
      </div>
    </div>
  );

  const CategoryCardSkeleton = () => (
    <div className="flex-shrink-0 w-28 text-center cursor-pointer">
      {/* Category image - Exact 20x20 rounded-full like real category */}
      <div className="w-20 h-20 mx-auto rounded-full shadow-md bg-gray-200 shimmer"></div>
      
      {/* Category name */}
      <div className="mt-2 px-1">
        <div className="h-3 bg-gray-200 shimmer w-full mx-auto"></div>
      </div>
    </div>
  );

  const CategorySwiperSkeleton = () => (
    <div className="w-full py-6 font-sans">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 md:px-16">
        <div className="flex flex-col md:flex-row md:items-start md:gap-8">
          
          {/* Text Section Skeleton */}
          <div className="w-full md:w-2/5 text-left">
            <div className="mb-2">
              <div className="h-8 bg-gray-200 shimmer w-4/5 mb-2"></div>
              <div className="h-8 bg-gray-200 shimmer w-3/5"></div>
            </div>
            <div className="h-3 bg-gray-200 shimmer w-1/2 mb-4"></div>
            
            {/* Banner Image Skeleton - Hidden on mobile, visible on larger devices */}
            <div className="hidden md:block mt-6">
              <div className="relative w-full h-48 rounded-lg bg-gray-200 shimmer shadow-lg"></div>
            </div>
          </div>

          {/* Categories Section Skeleton */}
          <div className="w-full md:w-3/5 space-y-4 mt-8 md:mt-12">
            {/* First row */}
            <div className="flex overflow-x-auto scrollbar-hide space-x-4 pb-2">
              {[...Array(6)].map((_, index) => (
                <CategoryCardSkeleton key={`first-${index}`} />
              ))}
            </div>
            
            {/* Second row */}
            <div className="flex overflow-x-auto scrollbar-hide space-x-4 pb-2">
              {[...Array(6)].map((_, index) => (
                <CategoryCardSkeleton key={`second-${index}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSkeletons = () => {
    const skeletons = [];
    for (let i = 0; i < count; i++) {
      skeletons.push(
        <div key={i}>
          <ProductCardSkeleton />
        </div>
      );
    }
    return skeletons;
  };

  if (variant === 'category-swiper') {
    return (
      <>
        <style>{shimmerAnimation}</style>
        <CategorySwiperSkeleton />
      </>
    );
  }

  return (
    <>
      <style>{shimmerAnimation}</style>
      <div className={`w-full ${className}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {renderSkeletons()}
        </div>
      </div>
    </>
  );
};

export default PremiumCardSkeleton;