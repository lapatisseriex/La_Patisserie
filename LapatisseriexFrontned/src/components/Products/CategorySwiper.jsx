import React, { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Link } from 'react-router-dom';
import 'swiper/css';

const CategorySwiper = ({ 
  categories = [], 
  loading = false, 
  error = null, 
  selectedCategory = null, 
  onSelectCategory = () => {} 
}) => {
  const swiperRef = useRef(null);

  return (
    <div className="category-swiper-container px-36">
      <Swiper
        className="category-swiper"
        slidesPerView="auto"
        spaceBetween={8}
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
              className="category-slide"
            >
              <div className="flex flex-col items-center px-1">
                <div className="w-16 h-16 rounded-full overflow-hidden mb-1 bg-gray-200 animate-pulse"></div>
                <div className="w-12 h-2 bg-gray-200 animate-pulse rounded"></div>
              </div>
            </SwiperSlide>
          ))
        ) : categories.length > 0 ? (
          // Show actual categories if available
          categories.map(category => (
            <SwiperSlide 
              key={category._id || category.id}
              className={`category-slide ${selectedCategory === (category._id || category.id) ? 'selected-category' : ''}`}
              onClick={() => onSelectCategory(category._id || category.id)}
            >
              <div className="flex flex-col items-center px-1">
              <div className="w-16 h-16 rounded-full overflow-hidden mb-2 shadow-sm border border-gray-100">
              <img 
                    src={category.featuredImage || (category.images && category.images.length > 0 ? category.images[0] : '')} 
                    alt={category.name} 
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = '/images/cake-logo.png';
                      e.target.onerror = null;
                    }}
                  />
                </div>
                <span className="text-[10px] text-center text-cakeBrown leading-tight line-clamp-1 w-full font-medium">
                  {category.name}
                </span>
              </div>
            </SwiperSlide>
          ))
        ) : error ? (
          // Show error message if there was an error loading categories
          <SwiperSlide className="category-slide-full">
            <div className="text-center py-1 text-xs text-red-500">
              Could not load categories
            </div>
          </SwiperSlide>
        ) : (
          // Show message when no categories are available
          <SwiperSlide className="category-slide-full">
            <div className="text-center py-1 text-xs text-gray-500">
              No categories available
            </div>
          </SwiperSlide>
        )}
      </Swiper>
    </div>
  );
};

export default CategorySwiper;