import React, { useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import 'swiper/css';
import 'swiper/css/navigation';

const CategorySwiper = ({
  categories = [],
  loading = false,
  error = null,
  selectedCategory = null,
  onSelectCategory = () => {},
}) => {
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const [swiperInstance, setSwiperInstance] = useState(null);

  // Handler for "All Categories" selection
  const handleAllCategories = () => {
    onSelectCategory(null); // Passing null to indicate all categories
  };

  return (
    <div className="max-w-[95%] mx-auto py-4 relative">
      <h2 className="text-lg font-bold text-cakeBrown mb-3 text-center sm:text-left">All Categories</h2>

      <div className="relative">
        {/* Navigation Buttons */}
        <button
          ref={prevRef}
          className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-white border border-gray-200 rounded-full p-1 shadow-md hover:bg-gray-100 transition z-20"
          style={{ marginLeft: '-0.75rem' }}
        >
          <FaChevronLeft />
        </button>
        <button
          ref={nextRef}
          className="absolute top-1/2 right-0 transform -translate-y-1/2 bg-white border border-gray-200 rounded-full p-1 shadow-md hover:bg-gray-100 transition z-20"
          style={{ marginRight: '-0.75rem' }}
        >
          <FaChevronRight />
        </button>

        <Swiper
          modules={[Navigation]}
          onSwiper={(swiper) => {
            setSwiperInstance(swiper);
            // Delay navigation assignment to next tick
            setTimeout(() => {
              swiper.params.navigation.prevEl = prevRef.current;
              swiper.params.navigation.nextEl = nextRef.current;
              swiper.navigation.init();
              swiper.navigation.update();
            });
          }}
          navigation={{
            prevEl: prevRef.current,
            nextEl: nextRef.current,
          }}
          slidesPerView={3}
          spaceBetween={8}
          grabCursor={true}
          watchOverflow={true}
          breakpoints={{
            320: {
              slidesPerView: 3,
              spaceBetween: 6,
            },
            640: {
              slidesPerView: 3,
              spaceBetween: 8,
            },
            768: {
              slidesPerView: 4,
              spaceBetween: 10,
            },
            1024: {
              slidesPerView: 5,
              spaceBetween: 12,
            },
            1280: {
              slidesPerView: 6,
              spaceBetween: 14,
            },
          }}
        >
          {/* "All Categories" button as the first slide */}
          {!loading && (
            <SwiperSlide
              className={`w-20 cursor-pointer ${
                selectedCategory === null ? 'border-2 border-cakePink' : ''
              }`}
              onClick={handleAllCategories}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 mb-1 border border-gray-200 shadow-sm">
                  <span className="text-xs font-medium text-cakeBrown">All</span>
                </div>
                <span className="text-xs text-center text-cakeBrown">All Categories</span>
              </div>
            </SwiperSlide>
          )}

          {loading
            ? Array(5)
                .fill(0)
                .map((_, index) => (
                  <SwiperSlide key={`loading-${index}`} className="w-20 h-24">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse"></div>
                      <div className="w-10 h-2 bg-gray-200 animate-pulse rounded mt-2"></div>
                    </div>
                  </SwiperSlide>
                ))
            : categories.length > 0
            ? categories.map((category) => (
                <SwiperSlide
                  key={category._id || category.id}
                  className={`w-20 cursor-pointer ${
                    selectedCategory === (category._id || category.id) ? 'border-2 border-cakePink' : ''
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
                </SwiperSlide>
              ))
            : error ? (
              <SwiperSlide>
                <div className="text-center text-xs text-red-500 py-2">Failed to load categories</div>
              </SwiperSlide>
            ) : (
              <SwiperSlide>
                <div className="text-center text-xs text-gray-500 py-2">No categories available</div>
              </SwiperSlide>
            )}
        </Swiper>
      </div>
    </div>
  );
};

export default CategorySwiper;