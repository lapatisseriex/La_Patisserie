import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CategorySwiperHome = ({ 
  categories = [], 
  loading, 
  selectedCategory = null, 
  onSelectCategory 
}) => {
  const navigate = useNavigate();
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

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cakePink mx-auto"></div>
      </div>
    );
  }

  if (!categories.length) {
    return (
      <div className="text-center text-gray-500 py-4">
        No categories found.
      </div>
    );
  }

  const total = categories.length;

  const handlePrev = () => {
    setStartIndex(prev => {
      const moveBy = Math.floor(visibleCount);
      return Math.max(prev - moveBy, 0);
    });
  };

  const handleNext = () => {
    setStartIndex(prev => {
      const moveBy = Math.floor(visibleCount);
      return Math.min(prev + moveBy, total - Math.floor(visibleCount));
    });
  };

  const getVisibleCategories = () => {
    const endIndex = startIndex + Math.ceil(visibleCount) + 1;
    return categories.slice(startIndex, Math.min(endIndex, total));
  };

  const isPrevDisabled = startIndex === 0;
  const isNextDisabled = startIndex + Math.floor(visibleCount) >= total;

  const handleCategoryClick = (categoryId) => {
    // Update the URL with the selected category and ensure navigation is synchronous
    navigate(`/products?category=${categoryId}`, { replace: true });
    
    // Call the onSelectCategory callback if provided
    if (onSelectCategory) {
      onSelectCategory(categoryId);
    }
  };

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
          aria-label="Previous categories"
        >
          ◀
        </button>

        <div className="overflow-hidden flex-1">
          <div className="flex transition-transform duration-300 ease-in-out space-x-4 sm:space-x-6 px-0 sm:px-2">
            {getVisibleCategories().map(category => {
              const isSelected = selectedCategory === category._id;
              return (
                <div
                  key={category._id}
                  onClick={() => handleCategoryClick(category._id)}
                  className={`bg-white rounded-xl shadow-md transition-all duration-300 cursor-pointer overflow-hidden flex-shrink-0 ${
                    isSelected ? 'ring-2 ring-cakePink' : 'hover:shadow-xl'
                  }`}
                  style={{ 
                    width: itemWidth,
                    minWidth: '220px',
                    maxWidth: '320px'
                  }}
                >
                  {/* Increased image height */}
                  <img
                    src={category.images[0] || '/images/default-category.png'}
                    alt={category.name}
                    className="w-full h-44 sm:h-48 md:h-52 object-cover"
                  />
                  {/* Increased content area height */}
                  <div className="p-4 sm:p-5 h-[110px] flex flex-col justify-between">
                    <h3 className={`text-base sm:text-lg font-semibold ${isSelected ? 'text-cakePink' : 'text-cakeBrown'}`}>
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-sm text-gray-500 overflow-hidden" 
                         style={{
                           display: '-webkit-box',
                           WebkitLineClamp: 2,
                           WebkitBoxOrient: 'vertical',
                         }}>
                        {category.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={isNextDisabled}
          className={`hidden sm:flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white shadow-md hover:bg-gray-100 transition-colors ${
            isNextDisabled ? 'opacity-30 cursor-not-allowed' : ''
          }`}
          aria-label="Next categories"
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
          aria-label="Previous categories"
        >
          ◀
        </button>
        <button
          onClick={handleNext}
          disabled={isNextDisabled}
          className={`flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-md hover:bg-gray-100 ${
            isNextDisabled ? 'opacity-30 cursor-not-allowed' : ''
          }`}
          aria-label="Next categories"
        >
          ▶
        </button>
      </div>
    </div>
  );
};

export default CategorySwiperHome;