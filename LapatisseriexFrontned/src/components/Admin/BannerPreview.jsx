import React, { useState } from 'react';

const BannerPreview = ({ banner, onClose }) => {
  const [viewMode, setViewMode] = useState('desktop'); // 'desktop' or 'mobile'

  if (!banner) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-gray-900 bg-opacity-90 transition-opacity" onClick={onClose}></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Banner Preview
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {banner.title} - {banner.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
              
              {/* View Mode Toggle */}
              <div className="flex items-center space-x-4">
                <div className="flex rounded-md shadow-sm">
                  <button
                    type="button"
                    onClick={() => setViewMode('desktop')}
                    className={`relative inline-flex items-center px-4 py-2 rounded-l-md border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                      viewMode === 'desktop'
                        ? 'bg-pink-600 border-pink-600 text-white'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('mobile')}
                    className={`relative inline-flex items-center px-4 py-2 rounded-r-md border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                      viewMode === 'mobile'
                        ? 'bg-pink-600 border-pink-600 text-white'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a1 1 0 001-1V4a1 1 0 00-1-1H8a1 1 0 00-1 1v16a1 1 0 001 1z" />
                    </svg>
                    Mobile
                  </button>
                </div>
                
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500 rounded-md"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Preview Content */}
          <div className="bg-gray-100 p-6">
            {viewMode === 'desktop' ? (
              /* Desktop Preview */
              <div className="mx-auto bg-white rounded-lg shadow-lg overflow-hidden" style={{ maxWidth: '1200px' }}>
                <div className="bg-gray-800 px-4 py-2 flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="flex-1 text-center text-gray-300 text-sm">
                    lapatisserie.com
                  </div>
                </div>
                
                <div className="relative h-96 bg-black overflow-hidden">
                  {banner.src && (
                    banner.type === 'video' ? (
                      <video
                        src={banner.src}
                        className="w-full h-full object-cover"
                        controls={false}
                        muted
                        loop
                        autoPlay
                      />
                    ) : (
                      <img
                        src={banner.src}
                        alt={banner.title}
                        className="w-full h-full object-cover"
                      />
                    )
                  )}
                  
                  {/* Content Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60">
                    <div className="absolute top-8 left-8 max-w-md">
                      <h1 
                        className="text-5xl font-bold text-white mb-2 leading-tight" 
                        style={{ fontFamily: 'Dancing Script, serif' }}
                      >
                        {banner.title}
                      </h1>
                      <div className="w-20 h-1 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full mb-4"></div>
                      <p 
                        className="text-2xl text-pink-100 mb-4 italic leading-relaxed" 
                        style={{ fontFamily: 'Dancing Script, cursive' }}
                      >
                        {banner.subtitle}
                      </p>
                      
                      {banner.description && (
                        <p className="text-white/90 leading-relaxed mb-6 text-lg">
                          {banner.description}
                        </p>
                      )}
                      
                      {banner.leftContent?.features && banner.leftContent.features.length > 0 && (
                        <div className="space-y-2 mb-6">
                          {banner.leftContent.features.map((feature, index) => (
                            <div key={index} className="flex items-center text-white/90">
                              <div className="w-2 h-2 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full mr-3"></div>
                              <span className="text-base">{feature}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <button className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg">
                        Order Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Mobile Preview */
              <div className="mx-auto bg-white rounded-lg shadow-lg overflow-hidden" style={{ maxWidth: '375px' }}>
                <div className="bg-gray-800 px-4 py-2 flex items-center justify-center">
                  <div className="w-32 h-5 bg-gray-900 rounded-full"></div>
                </div>
                
                <div className="relative h-64 bg-black overflow-hidden">
                  {banner.src && (
                    banner.type === 'video' ? (
                      <video
                        src={banner.src}
                        className="w-full h-full object-cover"
                        controls={false}
                        muted
                        loop
                        playsInline
                      />
                    ) : (
                      <img
                        src={banner.src}
                        alt={banner.title}
                        className="w-full h-full object-cover"
                      />
                    )
                  )}
                  
                  {/* Mobile Content Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60">
                    <div className="absolute top-4 left-4 right-4">
                      <h1 
                        className="text-2xl font-bold text-white mb-1 leading-tight" 
                        style={{ fontFamily: 'Dancing Script, serif' }}
                      >
                        {banner.title}
                      </h1>
                      <div className="w-12 h-0.5 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full mb-2"></div>
                      <p 
                        className="text-lg text-pink-100 mb-3 italic" 
                        style={{ fontFamily: 'Dancing Script, cursive' }}
                      >
                        {banner.subtitle}
                      </p>
                      
                      {banner.description && (
                        <p className="text-white/90 text-sm leading-relaxed mb-3">
                          {banner.description}
                        </p>
                      )}
                      
                      {banner.leftContent?.features && banner.leftContent.features.length > 0 && (
                        <div className="space-y-1 mb-4">
                          {banner.leftContent.features.slice(0, 3).map((feature, index) => (
                            <div key={index} className="flex items-center text-white/90">
                              <div className="w-1.5 h-1.5 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full mr-2"></div>
                              <span className="text-xs">{feature}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <button className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold py-2 px-6 rounded-full text-sm shadow-lg">
                        Order Now
                      </button>
                    </div>
                    
                    {/* Mobile navigation dots */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                      <div className="w-2 h-2 bg-white rounded-full opacity-50"></div>
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                      <div className="w-2 h-2 bg-white rounded-full opacity-50"></div>
                    </div>
                  </div>
                </div>
                
                {/* Mobile bottom content */}
                <div className="p-4 bg-gray-50">
                  <div className="text-center text-gray-600 text-sm">
                    Swipe to see more banners
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Banner Info Panel */}
          <div className="bg-white px-6 py-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">Status</h4>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  banner.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {banner.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">Media Type</h4>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {banner.type === 'video' ? 'Video' : 'Image'}
                </span>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">Features</h4>
                <span className="text-sm text-gray-600">
                  {banner.leftContent?.features?.filter(f => f.trim()).length || 0} items
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              Close Preview
            </button>
            <button
              onClick={() => {
                // This would trigger edit functionality
                console.log('Edit banner:', banner);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              Edit Banner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannerPreview;