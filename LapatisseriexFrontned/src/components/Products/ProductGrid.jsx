import React, { useRef, useEffect } from 'react';
import ProductCard from './ProductCard';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y, Autoplay, EffectCoverflow } from 'swiper/modules';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { Link } from 'react-router-dom';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';

const ProductGrid = ({ products, title, subtitle, viewAllLink }) => {
  const navigationPrevRef = useRef(null);
  const navigationNextRef = useRef(null);
  const swiperRef = useRef(null);

  useEffect(() => {
    if (swiperRef.current && swiperRef.current.swiper) {
      swiperRef.current.swiper.params.navigation.prevEl = navigationPrevRef.current;
      swiperRef.current.swiper.params.navigation.nextEl = navigationNextRef.current;
      swiperRef.current.swiper.navigation.init();
      swiperRef.current.swiper.navigation.update();
    }
  }, [products]);

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="py-12 relative">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-72 bg-gradient-to-b from-cakePink/5 to-transparent -z-10"></div>
      
      {title && (
        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-10">
          <div className="mb-6 md:mb-0">
            <h2 className="text-3xl font-bold text-cakeBrown mb-2">{title}</h2>
            {subtitle && (
              <p className="text-gray-600 max-w-2xl">{subtitle}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button 
                ref={navigationPrevRef}
                className="bg-white shadow-lg border border-gray-100 text-cakeBrown rounded-full p-3 transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-cakePink focus:ring-offset-2"
                aria-label="Previous products"
              >
                <FaChevronLeft className="w-4 h-4" />
              </button>
              <button 
                ref={navigationNextRef}
                className="bg-white shadow-lg border border-gray-100 text-cakeBrown rounded-full p-3 transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-cakePink focus:ring-offset-2"
                aria-label="Next products"
              >
                <FaChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            {viewAllLink && (
              <Link 
                to={viewAllLink} 
                className="hidden md:flex items-center text-cakePink transition-colors"
              >
                <span className="mr-2">View All</span>
                <span className="transform transition-transform">→</span>
              </Link>
            )}
          </div>
        </div>
      )}
      
      <Swiper
        ref={swiperRef}
        modules={[Navigation, Pagination, A11y, Autoplay, EffectCoverflow]}
        navigation={{
          prevEl: navigationPrevRef.current,
          nextEl: navigationNextRef.current,
        }}
        effect={'coverflow'}
        coverflowEffect={{
          rotate: 0,
          stretch: 0,
          depth: 100,
          modifier: 2.5,
          slideShadows: false,
        }}
        slidesPerView={1}
        spaceBetween={24}
        loop={true}
        loopAdditionalSlides={4}
        speed={800}
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true
        }}
        breakpoints={{
          480: {
            slidesPerView: 2,
            spaceBetween: 20,
            effect: 'slide'
          },
          768: {
            slidesPerView: 3,
            spaceBetween: 24,
            effect: 'slide'
          },
          1024: {
            slidesPerView: 4,
            spaceBetween: 28,
            effect: 'slide'
          },
          1280: {
            slidesPerView: 4,
            spaceBetween: 32,
            effect: 'slide'
          },
        }}
        pagination={{ 
          clickable: true, 
          dynamicBullets: true,
          el: '.product-grid-pagination',
          bulletClass: 'inline-block w-3 h-3 bg-gray-300 rounded-full mx-1 cursor-pointer transition-all duration-300',
          bulletActiveClass: 'bg-cakePink w-6'
        }}
        className="product-carousel pb-16"
        onSlideChange={() => console.log('slide change')}
      >
        {products.map((product) => (
          <SwiperSlide key={product._id || product.id} className="pb-2">
            <div className="transform transition-all duration-500">
              <ProductCard product={product} />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      
      {/* Custom pagination */}
      <div className="product-grid-pagination flex justify-center space-x-2 mt-8"></div>
      
      {viewAllLink && (
        <div className="text-center mt-8 md:hidden">
          <Link 
            to={viewAllLink} 
            className="inline-flex items-center px-6 py-2 bg-cakePink text-white rounded-lg transition-colors shadow-md"
          >
            View All Products
          </Link>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;
