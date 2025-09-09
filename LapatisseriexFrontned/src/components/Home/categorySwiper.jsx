import React from 'react';
import { useNavigate } from 'react-router-dom';

const CategorySwiperHome = ({ categories = [], loading, selectedCategory = null }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cakePink mx-auto"></div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        No categories found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4 scrollbar-hide px-20">
      <div className="flex space-x-6">
        {categories.map(category => {
          const isSelected = selectedCategory === category._id;
          return (
            <div
              key={category._id}
              onClick={() => navigate(`/products?category=${category._id}`)}
              className={`min-w-[250px] max-w-[250px] bg-white rounded-xl shadow-md transition-shadow duration-300 cursor-pointer overflow-hidden flex-shrink-0 ${
                isSelected ? 'ring-2 ring-cakePink' : 'hover:shadow-xl'
              }`}
            >
              <img 
                src={category.images[0] || '/images/default-category.png'} 
                alt={category.name} 
                className="w-full h-40 object-cover"
              />
              <div className="p-4 h-[60px] flex flex-col justify-between">
                <h3 className={`text-lg font-semibold ${isSelected ? 'text-cakePink' : 'text-cakeBrown'}`}>
                  {category.name}
                </h3>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategorySwiperHome;
