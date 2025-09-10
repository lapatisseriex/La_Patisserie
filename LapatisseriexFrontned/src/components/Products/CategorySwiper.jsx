import React from 'react';

const CategorySwiper = ({
  categories = [],
  loading = false,
  error = null,
  selectedCategory = null,
  onSelectCategory = () => {},
}) => {
  // Handler for "All Categories" selection
  const handleAllCategories = () => {
    onSelectCategory(null); // Passing null to indicate all categories
  };

  return (
    <div className="max-w-[95%] mx-auto py-4">
      <h2 className="text-lg font-bold text-cakeBrown mb-3 text-center sm:text-left">All Categories</h2>

      {/* Scrollable categories container */}
      <div 
        className="flex overflow-x-auto space-x-3 pb-2 scrollbar-hide scroll-smooth"
        style={{
          scrollbarWidth: 'none', /* Firefox */
          msOverflowStyle: 'none', /* IE and Edge */
        }}
      >
        {/* "All Categories" button as the first item */}
        {!loading && (
          <div
            className={`flex-shrink-0 w-20 cursor-pointer ${
              selectedCategory === null ? 'border-2 border-cakePink rounded-lg' : ''
            }`}
            onClick={handleAllCategories}
          >
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 mb-1 border border-gray-200 shadow-sm">
                <span className="text-xs font-medium text-cakeBrown">All</span>
              </div>
              <span className="text-xs text-center text-cakeBrown">All Categories</span>
            </div>
          </div>
        )}

        {loading
          ? Array(5)
              .fill(0)
              .map((_, index) => (
                <div key={`loading-${index}`} className="flex-shrink-0 w-20 h-24">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse"></div>
                    <div className="w-10 h-2 bg-gray-200 animate-pulse rounded mt-2"></div>
                  </div>
                </div>
              ))
          : categories.length > 0
          ? categories.map((category) => (
              <div
                key={category._id || category.id}
                className={`flex-shrink-0 w-20 cursor-pointer ${
                  selectedCategory === (category._id || category.id) ? 'border-2 border-cakePink rounded-lg' : ''
                }`}
                onClick={() => onSelectCategory(category._id || category.id)}
              >
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full overflow-hidden mb-1 border border-gray-100 shadow-sm">
                    <img
                      src={category.featuredImage || (category.images?.[0] || '')}
                      alt={category.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = '/images/cake-logo.png';
                        e.target.onerror = null;
                      }}
                    />
                  </div>
                  <span className="text-xs text-center text-cakeBrown line-clamp-1">{category.name}</span>
                </div>
              </div>
            ))
          : error ? (
            <div className="flex-shrink-0">
              <div className="text-center text-xs text-red-500 py-2">Failed to load categories</div>
            </div>
          ) : (
            <div className="flex-shrink-0">
              <div className="text-center text-xs text-gray-500 py-2">No categories available</div>
            </div>
          )}
      </div>
      
      {/* Scroll hint for mobile */}
      <p className="text-xs text-gray-500 text-center mt-2 sm:hidden">
        Swipe left or right to see more categories
      </p>
    </div>
  );
};

export default CategorySwiper;