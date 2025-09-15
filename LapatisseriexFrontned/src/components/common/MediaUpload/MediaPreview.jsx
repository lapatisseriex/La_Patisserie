import React, { useState } from 'react';

/**
 * Media preview component that shows uploaded images and videos
 * Supports multiple media items with delete functionality
 */
const MediaPreview = ({ 
  mediaUrls = [], 
  onRemove, 
  editable = true,
  aspectRatio = "aspect-square",
  limit = null
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!mediaUrls || mediaUrls.length === 0) {
    return null;
  }

  // Determine if a URL is an image or video based on file extension
  const isVideo = (url) => {
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.wmv', '.mkv'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
  };

  // Limit the number of media items shown if limit is specified
  const displayedMedia = limit ? mediaUrls.slice(0, limit) : mediaUrls;

  return (
    <div className="media-preview">
      {/* Main preview - shows the active media item */}
      <div className={`relative ${aspectRatio} overflow-hidden rounded-lg mb-2 bg-white`}>
        {isVideo(displayedMedia[activeIndex]) ? (
          <video 
            src={displayedMedia[activeIndex]} 
            controls 
            className="w-full h-full object-contain"
          />
        ) : (
          <img 
            src={displayedMedia[activeIndex]} 
            alt="Media preview" 
            className="w-full h-full object-contain"
          />
        )}
        
        {/* Delete button */}
        {editable && onRemove && (
          <button 
            type="button" 
            onClick={() => onRemove(activeIndex)}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            aria-label="Remove media"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Thumbnails for multiple media items */}
      {displayedMedia.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto py-2">
          {displayedMedia.map((url, index) => (
            <div 
              key={index} 
              onClick={() => setActiveIndex(index)}
              className={`w-16 h-16 rounded-md overflow-hidden cursor-pointer flex-shrink-0 border-2 ${
                index === activeIndex ? 'border-pink-500' : 'border-transparent'
              }`}
            >
              {isVideo(url) ? (
                <div className="relative bg-white w-full h-full">
                  <video 
                    src={url} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              ) : (
                <img 
                  src={url} 
                  alt={`Thumbnail ${index + 1}`} 
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Show count if there are more media items than the limit */}
      {limit && mediaUrls.length > limit && (
        <div className="text-sm text-black text-right mt-1">
          +{mediaUrls.length - limit} more
        </div>
      )}
    </div>
  );
};

export default MediaPreview;





