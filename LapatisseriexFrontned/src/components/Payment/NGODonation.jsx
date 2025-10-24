import React, { useState, useEffect } from 'react';
import { ExternalLink, Heart, BookOpen, Users, Award, ChevronRight, X, ChevronLeft, ChevronRight as NextArrow, Instagram } from 'lucide-react';
import api from '../../services/apiService';

const NGODonation = ({ onClose }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [media, setMedia] = useState([]);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [loadingMedia, setLoadingMedia] = useState(true);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const response = await api.get('/ngo-media?active=true');
      setMedia(response.data || []);
    } catch (error) {
      console.error('Error fetching NGO media:', error);
    } finally {
      setLoadingMedia(false);
    }
  };

  const nextMedia = () => {
    setCurrentMediaIndex((prev) => (prev + 1) % media.length);
  };

  const prevMedia = () => {
    setCurrentMediaIndex((prev) => (prev - 1 + media.length) % media.length);
  };

  const goToSlide = (index) => {
    setCurrentMediaIndex(index);
  };

  const handleDonate = () => {
    // Open Razorpay donation link where user can enter their own amount
    const donationUrl = import.meta.env.VITE_RAZORPAY_DONATION_URL || 'https://razorpay.me/@dhanalakshmiravikumar';
    window.open(donationUrl, '_blank');
  };

  const features = [
    { icon: <BookOpen className="w-5 h-5" />, text: 'Live interactive sessions with expert trainers' },
    { icon: <Users className="w-5 h-5" />, text: 'Dedicated doubt clearing sessions' },
    { icon: <Award className="w-5 h-5" />, text: 'Classes in Tamil & English' },
    { icon: <Heart className="w-5 h-5" />, text: '100% free - Education for Everyone' }
  ];

  return (
    <div className="relative bg-white border border-gray-100 shadow-sm p-6 sm:p-8 mt-8" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-50 transition-colors duration-200"
          aria-label="Close"
        >
          <X className="w-5 h-5" style={{ color: '#281c20' }} />
        </button>
      )}

      <div className="relative">
        {/* Header Section */}
        <div className="border-b border-gray-100 pb-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-[#733857] flex items-center justify-center">
              <Heart className="w-6 h-6 text-white fill-white" />
            </div>
            
            <div className="flex-1">
              <div className="inline-block bg-[#733857] text-white text-xs font-semibold px-3 py-1 mb-2 tracking-wide">
                ✨ MAKE AN IMPACT
              </div>
              <h3 className="text-2xl sm:text-3xl font-light tracking-wide mb-2" style={{ color: '#281c20' }}>
                Help Students Learn & Grow
              </h3>
              <p className="text-sm tracking-wide" style={{ color: 'rgba(40, 28, 32, 0.7)' }}>
                Support Free Education for 11th & 12th Students
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Media Carousel */}
        {!loadingMedia && media.length > 0 && (
          <div className="mb-6 relative group">
            {/* Main carousel container with shadow and border effects */}
            <div className="relative overflow-hidden" style={{ 
              background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
              padding: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <div className="relative bg-black aspect-video overflow-hidden flex items-center justify-center">
                {/* Animated background pattern */}
                <div className="absolute inset-0 opacity-5" style={{
                  backgroundImage: `repeating-linear-gradient(45deg, #733857 0, #733857 1px, transparent 0, transparent 50%)`,
                  backgroundSize: '10px 10px',
                }}></div>
                
                {/* Media content with fade animation */}
                <div className="relative w-full h-full animate-fadeIn" key={currentMediaIndex}>
                  {media[currentMediaIndex]?.type === 'image' ? (
                    <img 
                      src={media[currentMediaIndex].url} 
                      alt={media[currentMediaIndex].title || 'NGO Media'} 
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                  ) : (
                    <video 
                      src={media[currentMediaIndex].url} 
                      controls 
                      className="w-full h-full object-contain"
                      style={{ backgroundColor: '#000' }}
                    />
                  )}
                </div>
                
                {/* Gradient overlays for depth */}
                <div className="absolute inset-0 pointer-events-none" style={{
                  background: 'linear-gradient(to bottom, transparent 70%, rgba(0,0,0,0.3) 100%)'
                }}></div>
              </div>
            </div>
            
            {/* Navigation via indicators and thumbnails only */}
            {media.length > 1 && (
              <>
                {/* Modern progress indicators */}
                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 px-4">
                  {media.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`relative h-1 transition-all duration-300 ${
                        index === currentMediaIndex ? 'w-8 bg-[#733857]' : 'w-1 bg-white/70 hover:bg-white'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    >
                      {index === currentMediaIndex && (
                        <div className="absolute inset-0 bg-[#733857] animate-pulse"></div>
                      )}
                    </button>
                  ))}
                </div>
                
                {/* Counter badge */}
                <div className="absolute top-4 right-4 bg-[#733857] text-white text-xs font-bold px-3 py-1.5 border-2 border-white z-10">
                  {currentMediaIndex + 1} / {media.length}
                </div>
              </>
            )}
            
            {/* Enhanced Caption with animation */}
            {media[currentMediaIndex]?.title && (
              <div className="mt-4 text-center animate-slideUp">
                <div className="inline-block bg-white border border-gray-200 px-4 py-2">
                  <p className="text-sm font-semibold tracking-wide" style={{ color: '#733857' }}>
                    {media[currentMediaIndex].title}
                  </p>
                  {media[currentMediaIndex]?.description && (
                    <p className="text-xs mt-1" style={{ color: 'rgba(40, 28, 32, 0.7)' }}>
                      {media[currentMediaIndex].description}
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {/* Thumbnail Navigation */}
            {media.length > 1 && (
              <div className="mt-4 animate-slideUp">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#733857] scrollbar-track-gray-200">
                  {media.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`relative flex-shrink-0 w-20 h-14 border-2 transition-all duration-300 overflow-hidden ${
                        index === currentMediaIndex 
                          ? 'border-[#733857] scale-110 shadow-lg' 
                          : 'border-gray-300 opacity-60 hover:opacity-100 hover:border-[#cf91d9]'
                      }`}
                      aria-label={`View ${item.title || 'media'} ${index + 1}`}
                    >
                      {item.type === 'image' ? (
                        <img 
                          src={item.url} 
                          alt={item.title || `Thumbnail ${index + 1}`} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-black flex items-center justify-center">
                          <div className="w-8 h-8 border-2 border-white rounded-full flex items-center justify-center">
                            <div className="w-0 h-0 border-l-[6px] border-l-white border-y-[4px] border-y-transparent ml-0.5"></div>
                          </div>
                        </div>
                      )}
                      {index === currentMediaIndex && (
                        <div className="absolute inset-0 border-2 border-[#733857] animate-pulse"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* NGO Info Card */}
        <div className="bg-gray-50 border border-gray-100 p-5 mb-6">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#733857]"></div>
              <p className="text-sm font-semibold tracking-wide" style={{ color: '#733857' }}>அரம்சை பயிலகம்</p>
            </div>
            <a 
              href="https://www.instagram.com/aramseipayilagam/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-medium hover:opacity-70 transition-opacity"
              style={{ color: '#733857' }}
            >
              <Instagram className="w-4 h-4" />
              Follow
            </a>
          </div>

          <p className="text-base font-bold mb-3" style={{ color: '#281c20' }}>ARAMSEI PAYILAGAM</p>
          
          <blockquote className="border-l-2 border-gray-200 pl-4 mb-4">
            <p className="text-sm italic mb-2" style={{ color: '#281c20' }}>
              "Life should be great rather than long"
            </p>
            <p className="text-xs font-semibold" style={{ color: 'rgba(40, 28, 32, 0.7)' }}>- Dr. B.R. Ambedkar</p>
          </blockquote>

          <p className="text-xs font-semibold mb-3 tracking-wide" style={{ color: '#733857' }}>
            கற்போம் கற்பிப்போம் அதிகாரம் வெல்வோம் அறம் செய்வோம்
          </p>

          <p className="text-sm leading-relaxed" style={{ color: '#281c20' }}>
            We're launching <span className="font-semibold" style={{ color: '#733857' }}>FREE Online Classes</span> for 11th & 12th School Students to strengthen their foundation and prepare effectively for board exams.
          </p>
        </div>

        {/* Toggle Details Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between bg-white border border-gray-200 hover:bg-gray-50 p-4 mb-4 transition-colors duration-200"
        >
          <span className="text-sm font-semibold tracking-wide" style={{ color: '#281c20' }}>
            {isExpanded ? 'Hide Details' : 'See What Your Donation Enables'}
          </span>
          <ChevronRight className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} style={{ color: '#733857' }} />
        </button>

        {/* Expandable Features Section */}
        <div className={`transition-all duration-500 overflow-hidden ${isExpanded ? 'max-h-[500px] opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
          <div className="bg-white border border-gray-100 p-5 space-y-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 border-b border-gray-50 last:border-0"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-gray-50 flex items-center justify-center" style={{ color: '#733857' }}>
                  {feature.icon}
                </div>
                <p className="text-sm leading-relaxed pt-2" style={{ color: '#281c20' }}>{feature.text}</p>
              </div>
            ))}

            {/* Contact Info */}
            <div className="bg-gray-50 border border-gray-100 p-4 mt-4">
              <p className="text-xs font-semibold tracking-wide mb-2" style={{ color: '#281c20' }}>📞 For more information:</p>
              <div className="flex flex-wrap gap-3 text-xs">
                <span className="font-medium" style={{ color: '#733857' }}>Sanjay: +91 7338882473</span>
                <span style={{ color: 'rgba(40, 28, 32, 0.3)' }}>•</span>
                <span className="font-medium" style={{ color: '#733857' }}>Aparna: +91 97894 92146</span>
              </div>
            </div>

            {/* Founder Info */}
            <div className="bg-gray-50 border border-gray-100 p-4">
              <p className="text-xs font-semibold tracking-wide mb-1" style={{ color: 'rgba(40, 28, 32, 0.7)' }}>🌟 Founder</p>
              <p className="text-sm font-semibold" style={{ color: '#733857' }}>@mr.sivakumarkaruppiah</p>
            </div>
          </div>
        </div>

        {/* Donation Call to Action */}
        <div className="border-t border-gray-100 pt-6 space-y-4">
          <p className="text-sm font-semibold text-center tracking-wide" style={{ color: '#281c20' }}>
            💝 Support Free Education
          </p>

          <p className="text-center text-sm tracking-wide" style={{ color: 'rgba(40, 28, 32, 0.7)' }}>
            Your contribution, no matter how small, makes a big difference in a student's life
          </p>

          {/* Donate Button */}
          <button
            onClick={handleDonate}
            className="w-full bg-[#733857] hover:bg-[#5e2c46] py-4 text-base font-semibold text-white transition-colors duration-200 flex items-center justify-center gap-2 tracking-wide"
          >
            <Heart className="w-5 h-5 fill-current" />
            DONATE VIA RAZORPAY
            <ExternalLink className="w-4 h-4" />
          </button>

          <p className="text-xs text-center tracking-wide" style={{ color: 'rgba(40, 28, 32, 0.7)' }}>
            Enter your desired amount on Razorpay's secure payment page
          </p>
        </div>

        {/* Optional Skip Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="w-full mt-4 py-3 text-sm font-medium transition-colors duration-200 tracking-wide"
            style={{ color: 'rgba(40, 28, 32, 0.7)' }}
          >
            Maybe Later
          </button>
        )}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.98);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }

        /* Custom scrollbar for thumbnails */
        .scrollbar-thin {
          scrollbar-width: thin;
        }

        .scrollbar-thin::-webkit-scrollbar {
          height: 6px;
        }

        .scrollbar-thumb-\\[\\#733857\\]::-webkit-scrollbar-thumb {
          background-color: #733857;
          border-radius: 3px;
        }

        .scrollbar-track-gray-200::-webkit-scrollbar-track {
          background-color: #e5e7eb;
          border-radius: 3px;
        }

        /* Smooth hover effects for buttons */
        button:active {
          transform: scale(0.95);
        }

        /* Enhanced pulse animation */
        @keyframes customPulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        .animate-pulse {
          animation: customPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default NGODonation;
