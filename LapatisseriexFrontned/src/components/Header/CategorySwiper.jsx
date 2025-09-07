import React, { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Link } from 'react-router-dom';
import 'swiper/css';
import './CategorySwiper.css';

const CategorySwiper = ({ 
  categories = [], 
  loading = false, 
  error = null, 
  selectedCategory = null, 
  onSelectCategory = () => {} 
}) => {
  const swiperRef = useRef(null);

  return (
    <Swiper
      className="category-swiper"
      slidesPerView="auto"
      spaceBetween={10}
      freeMode={true}
      touchRatio={1.5}
      touchAngle={45}
      grabCursor={true}
      preventClicks={true}
      resistanceRatio={0.85}
      modules={[]}
      watchOverflow={true}
      watchSlidesProgress={true}
      ref={swiperRef}
    >
      {loading ? (
        // Show loading placeholders while categories are being fetched
        Array(5).fill(0).map((_, index) => (
          <SwiperSlide 
            key={`loading-${index}`}
            style={{ width: 'auto', minWidth: '70px', maxWidth: '100px' }}
          >
            <div className="flex flex-col items-center px-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden mb-1 shadow-sm bg-gray-200 animate-pulse"></div>
              <div className="w-14 h-3 bg-gray-200 animate-pulse rounded"></div>
            </div>
          </SwiperSlide>
        ))
      ) : categories.length > 0 ? (
        // Show actual categories if available
        categories.map(category => (
          <SwiperSlide 
            key={category._id || category.id} // Support both _id (from DB) and id (from local mapping)
            className={`cursor-pointer ${selectedCategory === (category._id || category.id) ? 'selected-category' : ''}`}
            onClick={() => onSelectCategory(category._id || category.id)}
            style={{ width: 'auto', minWidth: '70px', maxWidth: '100px' }}
          >
            <div className="flex flex-col items-center px-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden mb-1 shadow-sm">
                <img 
                  src={category.featuredImage || (category.images && category.images.length > 0 ? category.images[0] : '')} 
                  alt={category.name} 
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = '/images/cake-logo.png'; // Fallback image
                    e.target.onerror = null; // Prevent infinite loops
                  }}
                />
              </div>
              <span className="text-[10px] sm:text-xs text-center text-cakeBrown leading-tight line-clamp-1 sm:line-clamp-2 w-full">
                {category.name}
              </span>
            </div>
          </SwiperSlide>
        ))
      ) : error ? (
        // Show error message if there was an error loading categories
        <SwiperSlide style={{ width: '100%' }}>
          <div className="text-center py-2 text-sm text-red-500">
            Could not load categories
          </div>
        </SwiperSlide>
      ) : (
        // Show message when no categories are available
        <SwiperSlide style={{ width: '100%' }}>
          <div className="text-center py-2 text-sm text-gray-500">
            No categories available
          </div>
        </SwiperSlide>
      )}

      {/* Always show 'View All' link at the end if we have categories */}
      {categories.length > 0 && (
        <SwiperSlide style={{ width: 'auto' }}>
          <Link to="/products" className="flex flex-col items-center px-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden mb-1 shadow-sm bg-gray-100 flex items-center justify-center">
              <span className="text-xs font-bold text-gray-500">ALL</span>
            </div>
            <span className="text-[10px] sm:text-xs text-center text-gray-500 leading-tight">
              All Products
            </span>
          </Link>
        </SwiperSlide>
      )}
    </Swiper>
  );
};

export default CategorySwiper;
