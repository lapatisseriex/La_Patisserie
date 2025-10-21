import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowRight } from 'lucide-react';

const NGORibbon = () => {
  return (
    <Link 
      to="/support-education"
      className="block bg-white  transition-all duration-500 group relative overflow-hidden"
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      {/* Subtle shine effect on hover */}
      <div className="absolute inset-0 "></div>
      
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 py-10 sm:py-12 lg:py-14 relative">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-8">
          
          {/* Heading Section */}
          <div className="flex items-center gap-4 sm:gap-5 text-[#733857]">
            <Heart className="w-9 h-9 sm:w-11 sm:h-11 lg:w-12 lg:h-12 fill-[#733857] flex-shrink-0 animate-pulse" 
              style={{ animationDuration: '2s' }} 
            />
            <div className="transform group-hover:translate-x-1 transition-transform duration-300">
              <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-wide">
                Support Free Education
              </h3>
              <p className="text-sm sm:text-base lg:text-lg text-[#733857]/80 mt-1.5">
                கற்பிப்போம் (Karpippom) - Empower Students
              </p>
            </div>
          </div>

          {/* Donate Button */}
          <div className="bg-[#733857] text-white px-7 sm:px-9 lg:px-10 py-3.5 sm:py-4 lg:py-4.5 font-bold text-sm sm:text-base lg:text-lg hover:shadow-2xl hover:scale-105 hover:bg-[#8b4567] transition-all duration-300 flex items-center gap-2.5 flex-shrink-0">
            <span>Donate Now</span>
            <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6 group-hover:translate-x-2 transition-transform duration-300" />
          </div>

        </div>
      </div>
    </Link>
  );
};

export default NGORibbon;
