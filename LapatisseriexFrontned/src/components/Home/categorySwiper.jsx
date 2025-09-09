import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CategorySwiperHome = ({ categories = [], loading, selectedCategory = null, onSelectCategory }) => {
  const navigate = useNavigate();
  const [startIndex, setStartIndex] = useState(0);

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

  const visibleCount = 4;
  const total = categories.length;

  const handlePrev = () => {
    setStartIndex(prev => Math.max(prev - visibleCount, 0));
  };

  const handleNext = () => {
    setStartIndex(prev => Math.min(prev + visibleCount, total - visibleCount));
  };

  const getVisibleCategories = () => {
    return categories.slice(startIndex, startIndex + visibleCount);
  };

  return (
    <div className="relative">
      <div className="overflow-hidden">
        <div className="flex space-x-6 px-10">
          {getVisibleCategories().map(category => {
            const isSelected = selectedCategory === category._id;
            return (
              <div
                key={category._id}
                onClick={() => {
                  navigate(`/products?category=${category._id}`);
                  if (onSelectCategory) onSelectCategory(category._id);
                }}
                className={`min-w-[280px] max-w-[280px] bg-white rounded-xl shadow-md transition-shadow duration-300 cursor-pointer overflow-hidden flex-shrink-0 ${
                  isSelected ? 'ring-2 ring-cakePink' : 'hover:shadow-xl'
                }`}
              >
                <img
                  src={category.images[0] || '/images/default-category.png'}
                  alt={category.name}
                  className="w-full h-40 object-cover"
                />
                <div className="p-4 h-[80px] flex flex-col justify-between">
                  <h3 className={`text-lg font-semibold ${isSelected ? 'text-cakePink' : 'text-cakeBrown'}`}>
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">{category.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={handlePrev}
        disabled={startIndex === 0}
        className={`absolute left-0 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 ${
          startIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        ◀
      </button>
      <button
        onClick={handleNext}
        disabled={startIndex + visibleCount >= total}
        className={`absolute right-0 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 ${
          startIndex + visibleCount >= total ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        ▶
      </button>
    </div>
  );
};

export default CategorySwiperHome;
