import React, { useState, useEffect } from 'react';

const AdvertisementBanner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Advertisement data with the actual banner image
  const advertisements = [
    {
      id: 1,
      type: 'image',
      src: '/jk.png',
      alt: 'Pastel Pink and Brown Modern Sale Food Banner',
      title: 'Special Sale Event',
    },
  ];

  // Auto-slide functionality (if you add more images later)
  useEffect(() => {
    if (advertisements.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % advertisements.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [advertisements.length]);

  return (
  <div className="w-full max-w-full overflow-x-hidden p-0 m-0 block">
      {/* Carousel Container */}
      <div 
        className="flex transition-transform duration-500 ease-in-out w-full overflow-hidden"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {advertisements.map((ad, index) => (
          <div key={ad.id} className="w-full flex-shrink-0 relative aspect-[3/1] sm:aspect-[3/1] md:aspect-[3/1] lg:aspect-[3/1] xl:aspect-[3/1] overflow-hidden p-0 m-0">
            {ad.type === 'image' ? (
              <img
                src={ad.src}
                alt={ad.alt}
                className="w-full h-full object-cover object-center rounded-lg"
                style={{ aspectRatio: '3/1', minHeight: 0, maxHeight: '100vw' }}
                loading={index === 0 ? 'eager' : 'lazy'}
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  e.target.src = '/placeholder-image.jpg';
                }}
              />
            ) : ad.type === 'video' ? (
              <video
                src={ad.src}
                className="w-full h-full object-cover object-center rounded-lg"
                style={{ aspectRatio: '3/1', minHeight: 0, maxHeight: '100vw' }}
                autoPlay
                muted
                loop
                playsInline
              />
            ) : null}
            
            {/* Conditional overlay - lighter for sale banner, darker for others */}
            {ad.id !== 1 && (
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                <div className="text-center text-white px-4">
                  <h2 className="text-2xl md:text-4xl lg:text-5xl font-light mb-2 text-white">
                    {ad.title}
                  </h2>
                  <p className="text-sm md:text-lg lg:text-xl text-white/90">
                    {ad.subtitle}
                  </p>
                </div>
              </div>
            )}
            
            {/* Light overlay for the sale banner to preserve readability */}
            {ad.id === 1 && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent flex items-end justify-center pb-8">
                <div className="text-center text-white px-4">
                  <p className="text-sm md:text-base lg:text-lg text-white/90 bg-black/40 px-4 py-2 rounded-lg backdrop-blur-sm">
                    {ad.subtitle}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdvertisementBanner;