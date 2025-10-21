import React, { useState, useEffect } from 'react';
import { Play, Volume2, VolumeX } from 'lucide-react';
import api from '../../services/apiService';

const NGOVideo = ({ videoUrl, posterImage, fetchFromAPI = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [mediaUrl, setMediaUrl] = useState(videoUrl);
  const [loading, setLoading] = useState(fetchFromAPI);
  const videoRef = React.useRef(null);

  useEffect(() => {
    if (fetchFromAPI && !videoUrl) {
      fetchVideoFromAPI();
    } else {
      setMediaUrl(videoUrl);
    }
  }, [fetchFromAPI, videoUrl]);

  const fetchVideoFromAPI = async () => {
    try {
      setLoading(true);
      const response = await api.get('/ngo-media?active=true');
      // Find first active video
      const video = response.data.find(item => item.type === 'video' && item.isActive);
      if (video) {
        setMediaUrl(video.url);
      }
    } catch (error) {
      console.error('Error fetching video:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="relative bg-gray-100 border border-gray-200 overflow-hidden aspect-video" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-12 h-12 border-2 border-[#733857] border-t-transparent animate-spin mb-4"></div>
          <p className="text-sm tracking-wide" style={{ color: 'rgba(40, 28, 32, 0.7)' }}>
            Loading video...
          </p>
        </div>
      </div>
    );
  }

  // Placeholder component when no video is available
  if (!mediaUrl) {
    return (
      <div className="relative bg-gray-100 border border-gray-200 overflow-hidden aspect-video" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 bg-white border border-gray-200 flex items-center justify-center mb-4">
            <Play className="w-10 h-10" style={{ color: '#733857' }} />
          </div>
          <h4 className="text-xl font-light tracking-wide mb-2" style={{ color: '#281c20' }}>
            See Our Impact in Action
          </h4>
          <p className="text-sm max-w-md tracking-wide" style={{ color: 'rgba(40, 28, 32, 0.7)' }}>
            Watch how your donation transforms lives through education
          </p>
          <div className="mt-6 flex items-center gap-2 text-xs tracking-wide" style={{ color: 'rgba(40, 28, 32, 0.5)' }}>
            <div className="w-2 h-2 bg-[#733857]"></div>
            <span>Video coming soon</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative border border-gray-200 overflow-hidden group">
      <video
        ref={videoRef}
        className="w-full aspect-video object-cover"
        poster={posterImage}
        muted={isMuted}
        loop
        playsInline
        onClick={handlePlayPause}
      >
        <source src={mediaUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Play/Pause Overlay */}
      {!isPlaying && (
        <div
          className="absolute inset-0 bg-black/30 flex items-center justify-center cursor-pointer transition-opacity group-hover:bg-black/40"
          onClick={handlePlayPause}
        >
          <div className="w-16 h-16 bg-white/90 flex items-center justify-center">
            <Play className="w-8 h-8 ml-1" style={{ color: '#733857' }} />
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePlayPause}
            className="p-2 bg-white/20 hover:bg-white/30 transition-colors"
          >
            {isPlaying ? (
              <div className="w-4 h-4 border-2 border-white"></div>
            ) : (
              <Play className="w-4 h-4 text-white" />
            )}
          </button>

          <button
            onClick={toggleMute}
            className="p-2 bg-white/20 hover:bg-white/30 transition-colors"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-white" />
            ) : (
              <Volume2 className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NGOVideo;
