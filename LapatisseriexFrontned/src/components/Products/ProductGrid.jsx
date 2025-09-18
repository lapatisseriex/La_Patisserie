import React, { useRef, useEffect } from 'react';
import ProductCard from './ProductCard';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y, Autoplay } from 'swiper/modules';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { Link } from 'react-router-dom';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

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
    <div className="py-8 sm:py-12 relative max-w-[90%] mx-auto">
      {title && (
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <div className="text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold text-black">{title}</h2>
            {subtitle && <p className="text-sm sm:text-base text-black mt-1">{subtitle}</p>}
          </div>
          <div className="flex items-center mt-4 sm:mt-0 space-x-2">
            <button
              ref={navigationPrevRef}
              className="bg-white shadow-md border border-gray-300 text-black rounded-full p-2 sm:p-3 transition"
            >
              <FaChevronLeft />
            </button>
            <button
              ref={navigationNextRef}
              className="bg-white shadow-md border border-gray-300 text-black rounded-full p-2 sm:p-3 transition"
            >
              <FaChevronRight />
            </button>
            {viewAllLink && (
              <Link
                to={viewAllLink}
                className="hidden sm:flex items-center text-black"
              >
                View All →
              </Link>
            )}
          </div>
        </div>
      )}

      <Swiper
        ref={swiperRef}
        mo  dules={[Navigation, Pagination, A11y, Autoplay]}
        navigation={{
          prevEl: navigationPrevRef.current,
          nextEl: navigationNextRef.current,
        }}
        slidesPerView={1}
        slidesPerGroup={1}
        spaceBetween={16}
        loop={true}
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        pagination={{ clickable: true }}
        breakpoints={{
          640: { slidesPerView: 2, slidesPerGroup: 1 },
          768: { slidesPerView: 3, slidesPerGroup: 1 },
          1024: { slidesPerView: 4, slidesPerGroup: 1 },
        }}
        className="pb-8 !h-full" // force swiper container to full height
      >
        {products.map((product) => (
          <SwiperSlide key={product._id || product.id} className="!h-full flex">
            <ProductCard product={product} className="flex-1 product-card" />
          </SwiperSlide>
        ))}
      </Swiper>


      {viewAllLink && (
        <div className="text-center mt-6 sm:hidden">
          <Link
            to={viewAllLink}
            className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg shadow/90 transition"
          >
            View All Products
          </Link>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;
