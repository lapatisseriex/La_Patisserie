import React from 'react';
import { Link } from 'react-router-dom';

const BrowseCategories = ({ categories }) => {
  // Early return if no categories
  if (!categories || categories.length === 0) {
    return null;
  }

  // Only use the real categories, no placeholders
  const displayCategories = [...categories];

  return (
    <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 mb-2">
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-black tracking-wide uppercase">
        BROWSE MENU CATEGORIES
      </h2>
      
      {/* Desktop Layout - KFC style with large left, 2x2 grid right */}
      <div className="hidden md:flex gap-4 lg:gap-5">
        {/* Left side - large featured category */}
        {displayCategories.length > 0 && (
          <div className="w-1/2 bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow duration-300">
            <Link to={`/products?category=${displayCategories[0]._id}`} className="block h-full">
              <div className="relative h-full flex flex-col">
                <img 
                  src={displayCategories[0].featuredImage || '/images/placeholder-image.jpg'} 
                  alt={displayCategories[0].name}
                  className="w-full h-full object-cover flex-grow"
                />
                <div className="bg-white p-4 text-center">
                  <h3 className="text-xl font-bold text-black uppercase tracking-wider">{displayCategories[0].name}</h3>
                </div>
              </div>
            </Link>
          </div>
        )}
        
        {/* Right side - 2x2 grid */}
        {displayCategories.length > 1 && (
          <div className="w-1/2 grid grid-cols-2 gap-4 lg:gap-5">
            {displayCategories.slice(1, 5).map((category, index) => (
              <div key={category._id} className="bg-white rounded-lg overflow-hidden shadow">
                <Link to={`/products?category=${category._id}`} className="block h-full">
                  <div className="relative h-full flex flex-col">
                    <img 
                      src={category.featuredImage || '/images/placeholder-image.jpg'} 
                      alt={category.name}
                      className="w-full h-32 lg:h-40 object-cover flex-grow"
                    />
                    <div className="bg-white p-2 lg:p-3 text-center">
                      <h3 className="text-sm lg:text-base font-bold text-black uppercase tracking-wider">{category.name}</h3>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>      {/* Second row for desktop - 4 equal columns */}
      <div className="hidden md:grid grid-cols-4 gap-4 lg:gap-5 mt-4 lg:mt-5">
        {displayCategories.slice(5, 9).map((category, index) => (
          <div key={category._id} className="bg-white rounded-lg overflow-hidden shadow">
            <Link to={`/products?category=${category._id}`} className="block h-full">
              <div className="relative h-full flex flex-col">
                <img 
                  src={category.featuredImage || '/images/placeholder-image.jpg'} 
                  alt={category.name}
                  className="w-full h-32 object-cover flex-grow"
                />
                <div className="bg-white p-2 lg:p-3 text-center">
                  <h3 className="text-sm lg:text-base font-bold text-black uppercase tracking-wider">{category.name}</h3>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
      
      {/* Mobile Layout - Single large then grid */}
      <div className="md:hidden space-y-4">
        {/* Featured category at top */}
        <div className="bg-white rounded-lg overflow-hidden shadow">
          <Link to={`/products?category=${displayCategories[0]._id}`} className="block">
            <div className="relative flex flex-col">
              <img 
                src={displayCategories[0].featuredImage || '/images/placeholder-image.jpg'} 
                alt={displayCategories[0].name}
                className="w-full h-48 object-cover"
              />
              <div className="bg-white p-3 text-center">
                <h3 className="text-lg font-bold text-black uppercase tracking-wider">{displayCategories[0].name}</h3>
              </div>
            </div>
          </Link>
        </div>
        
        {/* Grid of 2x2 for other categories */}
        <div className="grid grid-cols-2 gap-3">
          {displayCategories.slice(1, 5).map((category, index) => (
            <div key={category._id} className="bg-white rounded-lg overflow-hidden shadow">
              <Link to={`/products?category=${category._id}`} className="block">
                <div className="relative flex flex-col">
                  <img 
                    src={category.featuredImage || '/images/placeholder-image.jpg'} 
                    alt={category.name}
                    className="w-full h-28 object-cover"
                  />
                  <div className="bg-white p-2 text-center">
                    <h3 className="text-xs font-bold text-black uppercase tracking-wider">{category.name}</h3>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
        
        {/* More categories in a 1x2 grid */}
        <div className="grid grid-cols-2 gap-3">
          {displayCategories.slice(5, 7).map((category, index) => (
            <div key={category._id} className="bg-white rounded-lg overflow-hidden shadow">
              <Link to={`/products?category=${category._id}`} className="block">
                <div className="relative flex flex-col">
                  <img 
                    src={category.featuredImage || '/images/placeholder-image.jpg'} 
                    alt={category.name}
                    className="w-full h-28 object-cover"
                  />
                  <div className="bg-white p-2 text-center">
                    <h3 className="text-xs font-bold text-black uppercase tracking-wider">{category.name}</h3>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BrowseCategories;