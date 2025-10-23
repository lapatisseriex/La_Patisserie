import React, { useState, useRef, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { normalizeImageUrl, normalizeVideoUrl } from '../../utils/imageUtils';

/**
 * MediaDisplay component for rendering images or videos from Cloudinary or local sources
 * 
 * @param {Object} props - Component props
 * @param {string} props.src - Source URL of the media
 * @param {string} props.alt - Alternative text for the media
 * @param {string} props.type - Type of media ('image' or 'video')
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.fallbackSrc - Fallback source if primary source fails
 * @param {string} props.aspectRatio - CSS aspect ratio value (e.g. '1/1', '16/9')
 * @param {string} props.objectFit - CSS object-fit property (e.g. 'cover', 'contain')
 * @param {boolean} props.lazy - Whether to lazy load the media
 */
const MediaDisplay = ({
  src,
  alt = '',
  type = 'image',
  className = '',
  fallbackSrc = '/images/cake1.png',
  aspectRatio = 'auto',
  objectFit = 'cover',
  lazy = true,
  transparent = false, // New prop to handle transparent images better
  videoProps = {}
}) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [cacheBuster, setCacheBuster] = useState('');
  const isVideo = type === 'video';
  const MAX_RETRIES = 5;
  const BASE_DELAY_MS = 1500;
  
  // Function to handle image load errors
  const handleError = () => {
    if (isVideo && retryCount < MAX_RETRIES) {
      // Retry with cache-busting to avoid CDN stale errors (e.g., MIME not ready immediately after upload)
      const delay = Math.round(BASE_DELAY_MS * Math.pow(1.5, retryCount));
      setTimeout(() => {
        setRetryCount((c) => c + 1);
        setCacheBuster(String(Date.now()));
        setLoading(true);
      }, delay);
      return;
    }
    console.warn(`Failed to load media from ${src}, using fallback`);
    setError(true);
    setLoading(false);
  };
  
  // Common media styles
  const mediaStyles = {
    objectFit: transparent ? 'contain' : objectFit, // Use contain for transparent images
    aspectRatio
  };
  
  const effectiveFallback = isVideo
    ? (fallbackSrc && fallbackSrc !== '/images/cake1.png' ? fallbackSrc : '')
    : fallbackSrc;

  const normalizedPrimary = isVideo ? normalizeVideoUrl(src) : normalizeImageUrl(src);
  const normalizedFallback = isVideo
    ? normalizeVideoUrl(effectiveFallback)
    : normalizeImageUrl(effectiveFallback, effectiveFallback);

  // Use fallback if error occurred or no src is provided
  const mediaSourceBase = (error || !normalizedPrimary) ? normalizedFallback : normalizedPrimary;
  const mediaSource = useMemo(() => {
    if (!mediaSourceBase) return mediaSourceBase;
    if (!cacheBuster) return mediaSourceBase;
    try {
      const url = new URL(mediaSourceBase, window.location.origin);
      url.searchParams.set('cb', cacheBuster);
      return url.toString();
    } catch {
      // If not a valid absolute URL, append cache buster safely
      return mediaSourceBase + (mediaSourceBase.includes('?') ? `&cb=${cacheBuster}` : `?cb=${cacheBuster}`);
    }
  }, [mediaSourceBase, cacheBuster]);
  // Provide sensible defaults for mobile playback reliability
  const {
    controls = true,
    muted = true,
    playsInline = true,
    autoPlay,
    loop,
    ...restVideoProps
  } = videoProps || {};

  const videoRef = useRef(null);

  // Try to start playback on metadata load if autoplay is requested
  const handleLoadedMetadata = (e) => {
    setLoading(false);
    if (autoPlay && videoRef.current) {
      const v = videoRef.current;
      // Some mobile browsers require an explicit play() even when autoPlay is set
      try { v.play().catch(() => {}); } catch {}
    }
    if (typeof restVideoProps?.onLoadedMetadata === 'function') {
      try { restVideoProps.onLoadedMetadata(e); } catch {}
    }
  };

  // Reset loaders on src/type changes
  useEffect(() => {
    setLoading(true);
    setError(false);
    setRetryCount(0);
    setCacheBuster('');
  }, [src, type]);
  
  return (
    <div className={`media-display ${className}`} style={{ aspectRatio }}>
      {type === 'video' ? (
        <video
          ref={videoRef}
          src={mediaSource}
          controls={controls}
          muted={muted}
          playsInline={playsInline}
          // non-standard attrs for wider device support (ignored where unsupported)
          webkit-playsinline="true"
          // Apply explicit booleans for autoPlay/loop only when provided to avoid React warnings
          {...(autoPlay ? { autoPlay: true } : {})}
          {...(loop ? { loop: true } : {})}
          style={mediaStyles}
          className="w-full h-full"
          preload="metadata"
          onLoadedMetadata={handleLoadedMetadata}
          onWaiting={() => setLoading(true)}
          onPlaying={() => setLoading(false)}
          onStalled={() => setLoading(true)}
          onError={handleError}
          {...restVideoProps}
        >
          <source src={mediaSource} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      ) : (
        <img
          src={mediaSource}
          alt={alt}
          style={mediaStyles}
          className="w-full h-full"
          onLoad={() => setLoading(false)}
          onError={handleError}
          loading={lazy ? "lazy" : "eager"}
        />
      )}

      {/* Loading/Processing overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/5">
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-6 rounded-full border-2 border-[#733857] border-t-transparent animate-spin" aria-label="Loading" />
            {isVideo && retryCount > 0 && !error && (
              <div className="text-[11px] px-2 py-0.5 rounded bg-white/70 text-gray-700">
                Processing video… retry {retryCount}/{MAX_RETRIES}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error fallback message for videos after retries */}
      {isVideo && error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
          <div className="text-xs px-2 py-1 rounded bg-white/80 text-gray-700">
            Video not ready yet. Please try again in a moment.
          </div>
        </div>
      )}
    </div>
  );
};

MediaDisplay.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  type: PropTypes.oneOf(['image', 'video']),
  className: PropTypes.string,
  fallbackSrc: PropTypes.string,
  aspectRatio: PropTypes.string,
  objectFit: PropTypes.string,
  lazy: PropTypes.bool,
  transparent: PropTypes.bool, // New prop for handling transparent images
  videoProps: PropTypes.object
};

export default MediaDisplay;





