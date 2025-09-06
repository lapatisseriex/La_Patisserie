import React, { useRef } from 'react';
import ProductCard from './ProductCard';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y, Autoplay } from 'swiper/modules';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const ProductGrid = ({ products, title }) => {
  const navigationPrevRef = useRef(null);
  const navigationNextRef = useRef(null);

  return (
    <div className="py-8">
      {title && (
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-cakeBrown">{title}</h2>
          <div className="flex items-center space-x-3">
            {/* <button 
              ref={navigationPrevRef}
              className="bg-white shadow-sm border border-gray-200 text-cakeBrown hover:text-cakePink rounded-full p-2 transition-colors focus:outline-none"
              aria-label="Previous products"
            >
              <FaChevronLeft />
            </button>
            <button 
              ref={navigationNextRef}
              className="bg-white shadow-sm border border-gray-200 text-cakeBrown hover:text-cakePink rounded-full p-2 transition-colors focus:outline-none"
              aria-label="Next products"
            >
              <FaChevronRight />
            </button> */}
            <button className="text-cakePink hover:text-cakePink-dark ml-2">View All</button>
          </div>
        </div>
      )}
      
      <Swiper
        modules={[Navigation, Pagination, A11y, Autoplay]}
        navigation={{
          prevEl: navigationPrevRef.current,
          nextEl: navigationNextRef.current,
        }}
        onBeforeInit={(swiper) => {
          swiper.params.navigation.prevEl = navigationPrevRef.current;
          swiper.params.navigation.nextEl = navigationNextRef.current;
        }}
        slidesPerView={1}
        spaceBetween={16}
        loop={true}
        loopAdditionalSlides={3}
        speed={800}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true
        }}
        breakpoints={{
          480: {
            slidesPerView: 2,
            spaceBetween: 16,
          },
          768: {
            slidesPerView: 3,
            spaceBetween: 20,
          },
          1024: {
            slidesPerView: 4,
            spaceBetween: 24,
          },
        }}
        pagination={{ 
          clickable: true, 
          dynamicBullets: true
        }}
        className="product-carousel pb-12"
      >
        {products.map((product) => (
          <SwiperSlide key={product.id} className="pb-10">
            <ProductCard product={product} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default ProductGrid;
