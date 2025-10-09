import React, { useState, useEffect, useRef } from 'react';

const PremiumCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef(null);

  // Carousel slides data
  const slides = [
    {
      id: 1,
      image: '/images/cake1.png',
      title: 'Elegant Wedding Cakes',
      subtitle: 'Handcrafted for Your Special Day',
      description: 'Exquisite multi-tier wedding cakes designed to make your celebration unforgettable',
      badge: 'Most Popular'
    },
    {
      id: 2,
      image: '/images/cake2.png',
      title: 'Birthday Celebrations',
      subtitle: 'Sweet Memories in Every Bite',
      description: 'Custom birthday cakes that bring joy and sweetness to your special moments',
      badge: 'Best Seller'
    },
    {
      id: 3,
      image: '/images/cake3.png',
      title: 'Artisan Pastries',
      subtitle: 'French Patisserie Excellence',
      description: 'Delicate pastries crafted with traditional French techniques and premium ingredients',
      badge: 'Chef\'s Choice'
    },
    {
      id: 4,
      image: '/images/new.jpg',
      title: 'Seasonal Specials',
      subtitle: 'Limited Edition Creations',
      description: 'Unique seasonal flavors and designs available for a limited time only',
      badge: 'New Arrival'
    }
  ];

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying && !isHovered) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 4000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isAutoPlaying, isHovered, slides.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="relative w-full py-20 bg-gradient-to-br from-gray-50 via-pink-50 to-rose-50 overflow-hidden">
      {/* Section Header */}
      <div className="text-center mb-16 px-4">
        <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-pink-600 via-rose-600 to-amber-500 bg-clip-text text-transparent">
          Our Signature Collection
        </h2>
        <div className="w-32 h-1 bg-gradient-to-r from-pink-500 to-rose-500 mx-auto mb-6"></div>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Discover our premium selection of handcrafted cakes and pastries, each one a masterpiece of flavor and artistry
        </p>
      </div>

      {/* Carousel Container */}
      <div 
        className="relative max-w-7xl mx-auto px-4"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Main Carousel */}
        <div className="relative h-[600px] rounded-3xl overflow-hidden shadow-2xl bg-white">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${
                index === currentSlide
                  ? 'opacity-100 translate-x-0 scale-100'
                  : index < currentSlide
                  ? 'opacity-0 -translate-x-full scale-95'
                  : 'opacity-0 translate-x-full scale-95'
              }`}
            >
              <div className="flex flex-col lg:flex-row h-full">
                {/* Image Section */}
                <div className="lg:w-1/2 relative overflow-hidden">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700"
                  />
                  {/* Image Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                  
                  {/* Badge */}
                  <div className="absolute top-6 left-6">
                    <span className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                      {slide.badge}
                    </span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center bg-gradient-to-br from-white to-pink-50">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-4xl lg:text-5xl font-bold text-gray-800 mb-4 leading-tight">
                        {slide.title}
                      </h3>
                      <p className="text-xl text-pink-600 font-semibold mb-6">
                        {slide.subtitle}
                      </p>
                    </div>
                    
                    <p className="text-lg text-gray-600 leading-relaxed mb-8">
                      {slide.description}
                    </p>
                    
                    <div className="flex items-center justify-between mb-8">
                      <span className="text-2xl font-bold text-gray-800">
                        {slide.price}
                      </span>
                      <div className="flex items-center space-x-2">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className="w-5 h-5 text-yellow-400 fill-current"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <span className="text-sm text-gray-500 ml-2">(4.9)</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                        Order Now
                      </button>
                      <button className="flex-1 border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white font-bold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group z-10"
        >
          <svg className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group z-10"
        >
          <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'bg-pink-500 w-8'
                  : 'bg-white/60 hover:bg-white/80'
              }`}
            />
          ))}
        </div>

        {/* Auto-play Control */}
        <div className="absolute top-6 right-6 z-10">
          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className="bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all duration-300"
          >
            {isAutoPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-rose-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
    </div>
  );
};

export default PremiumCarousel;