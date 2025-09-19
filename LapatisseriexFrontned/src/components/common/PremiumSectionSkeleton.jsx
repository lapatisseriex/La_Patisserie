import React from 'react';

const PremiumSectionSkeleton = ({ 
  variant = 'products',
  title = '',
  count = 3,
  showHeader = true,
  className = ''
}) => {
  const shimmerAnimation = `
    @keyframes shimmer {
      0% { background-position: -200px 0; }
      100% { background-position: calc(200px + 100%) 0; }
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
    
    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 0 0 0 rgba(236, 72, 153, 0.1); }
      50% { box-shadow: 0 0 20px 5px rgba(236, 72, 153, 0.2); }
    }
    
    .shimmer {
      background: linear-gradient(90deg, #f8f9fa 0%, #e9ecef 20%, #f8f9fa 40%, #f8f9fa 100%);
      background-size: 200px 100%;
      animation: shimmer 2s infinite linear;
    }
    
    .float-animation {
      animation: float 3s ease-in-out infinite;
    }
    
    .pulse-glow {
      animation: pulse-glow 2s infinite;
    }
  `;

  const HeaderSkeleton = () => (
    <div className="mb-8 space-y-3 px-4">
      <div className="h-7 bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 shimmer rounded-lg w-48 pulse-glow"></div>
      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-150 shimmer rounded-lg w-96 max-w-full"></div>
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
                <div key={`first-${index}`} className="flex-shrink-0 w-28 text-center cursor-pointer">
                  {/* Category image - Exact 20x20 rounded-full like real category */}
                  <div className="w-20 h-20 mx-auto rounded-full shadow-md bg-gray-200 shimmer"></div>
                  
                  {/* Category name */}
                  <div className="mt-2 px-1">
                    <div className="h-3 bg-gray-200 shimmer w-full mx-auto"></div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Second row */}
            <div className="flex overflow-x-auto scrollbar-hide space-x-4 pb-2">
              {[...Array(6)].map((_, index) => (
                <div key={`second-${index}`} className="flex-shrink-0 w-28 text-center cursor-pointer">
                  {/* Category image - Exact 20x20 rounded-full like real category */}
                  <div className="w-20 h-20 mx-auto rounded-full shadow-md bg-gray-200 shimmer"></div>
                  
                  {/* Category name */}
                  <div className="mt-2 px-1">
                    <div className="h-3 bg-gray-200 shimmer w-full mx-auto"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const ProductGridSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 px-4">
      {[...Array(count)].map((_, index) => (
        <div key={index} className="overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all duration-500 ease-in-out hover:scale-[1.02] h-72 cursor-pointer border border-gray-200 flex flex-col">
          {/* Product Image - Exact aspect square like real card */}
          <div className="w-full aspect-square relative">
            <div className="w-full aspect-square relative group overflow-hidden">
              <div className="w-full h-full bg-gray-200 shimmer"></div>
              
              {/* Heart button skeleton */}
              <div className="absolute top-2 left-2 p-1.5 w-7 h-7 bg-gray-200 shimmer border border-gray-300"></div>
              
              {/* Image dots indicator skeleton */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1.5">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 bg-gray-300 shimmer"></div>
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
      ))}
    </div>
  );

  const HeroSectionSkeleton = () => (
    <div className="relative overflow-hidden bg-gradient-to-br from-pink-50 to-orange-50 py-20">
      <div className="max-w-screen-xl mx-auto px-4 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="h-12 bg-gradient-to-r from-gray-300 to-gray-250 shimmer rounded-xl w-full max-w-md pulse-glow"></div>
              <div className="h-8 bg-gradient-to-r from-gray-250 to-gray-200 shimmer rounded-lg w-4/5"></div>
            </div>
            
            <div className="space-y-3">
              <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-150 shimmer rounded-lg w-full"></div>
              <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-150 shimmer rounded-lg w-4/5"></div>
              <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-150 shimmer rounded-lg w-3/5"></div>
            </div>
            
            {/* CTA buttons */}
            <div className="flex gap-4">
              <div className="h-14 w-40 bg-gradient-to-r from-pink-200 to-pink-100 shimmer rounded-xl pulse-glow"></div>
              <div className="h-14 w-36 bg-gradient-to-r from-gray-200 to-gray-150 shimmer rounded-xl"></div>
            </div>
          </div>
          
          {/* Hero image */}
          <div className="relative">
            <div className="w-full h-96 bg-gradient-to-br from-orange-200 via-pink-100 to-purple-200 shimmer rounded-3xl relative overflow-hidden pulse-glow">
              {/* Floating elements for premium feel */}
              <div className="absolute top-8 right-8 w-16 h-16 bg-gradient-to-br from-white/30 to-white/10 rounded-full float-animation"></div>
              <div className="absolute bottom-8 left-8 w-12 h-12 bg-gradient-to-br from-white/40 to-white/20 rounded-full float-animation" style={{ animationDelay: '1s' }}></div>
              <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-gradient-to-br from-white/20 to-white/5 rounded-full float-animation" style={{ animationDelay: '0.5s' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (variant) {
      case 'categories':
      case 'category-swiper':
        return <CategorySwiperSkeleton />;
      case 'hero':
        return <HeroSectionSkeleton />;
      case 'products':
      default:
        return <ProductGridSkeleton />;
    }
  };

  return (
    <>
      <style>{shimmerAnimation}</style>
      <div className={`w-full ${className}`}>
        {showHeader && variant !== 'hero' && variant !== 'category-swiper' && <HeaderSkeleton />}
        {renderContent()}
      </div>
    </>
  );
};

export default PremiumSectionSkeleton;