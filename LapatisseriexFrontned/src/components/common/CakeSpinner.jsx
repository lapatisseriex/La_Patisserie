import React from 'react';

const CakeSpinner = ({ size = 'medium', message = 'Loading delicious treats...' }) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  const spinnerStyles = `
    @keyframes cakeRotate {
      0% { transform: rotate(0deg) scale(1); }
      25% { transform: rotate(90deg) scale(1.1); }
      50% { transform: rotate(180deg) scale(1); }
      75% { transform: rotate(270deg) scale(1.1); }
      100% { transform: rotate(360deg) scale(1); }
    }
    
    @keyframes sprinkleFall {
      0% { transform: translateY(-10px) rotate(0deg); opacity: 0; }
      50% { opacity: 1; }
      100% { transform: translateY(30px) rotate(180deg); opacity: 0; }
    }
    
    @keyframes creamSwirl {
      0% { transform: scale(0.8) rotate(0deg); }
      50% { transform: scale(1.2) rotate(180deg); }
      100% { transform: scale(0.8) rotate(360deg); }
    }
    
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    
    .cake-spinner {
      animation: cakeRotate 2s infinite ease-in-out;
    }
    
    .sprinkle {
      animation: sprinkleFall 1.5s infinite ease-in-out;
    }
    
    .cream-swirl {
      animation: creamSwirl 3s infinite ease-in-out;
    }
    
    .bounce-text {
      animation: bounce 1.5s infinite ease-in-out;
    }
  `;

  return (
    <>
      <style>{spinnerStyles}</style>
      <div className="flex flex-col items-center justify-center py-12">
        <div className="relative">
          {/* Main cake spinner */}
          <div className={`${sizeClasses[size]} cake-spinner relative`}>
            {/* Cake base */}
            <div className="absolute inset-0  rounded-full border-4 "></div>
            
            {/* Cake layers */}
            <div className="absolute top-1 left-1 right-1 h-2 bg-gradient-to-b from-pink-200 to-pink-300 rounded-full"></div>
            <div className="absolute top-3 left-2 right-2 h-1 bg-gradient-to-b from-red-200 to-red-300 rounded-full"></div>
            
            {/* Cherry on top */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-2 h-2 bg-red-500 rounded-full shadow-sm"></div>
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-green-400 rounded-sm"></div>
          </div>
          
          {/* Falling sprinkles */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute sprinkle"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 1.5}s`,
                  color: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd'][Math.floor(Math.random() * 6)]
                }}
              >
                {['🌈', '✨', '🎀', '💫', '🌟', '💖'][Math.floor(Math.random() * 6)]}
              </div>
            ))}
          </div>
          
          {/* Cream swirl effect */}
          <div className="absolute -inset-2 cream-swirl opacity-30">
            <div className="w-full h-full border-2 border-dashed border-pink-300 rounded-full"></div>
          </div>
        </div>
        
        {/* Loading message with bouncing text */}
        <div className="mt-6 text-center">
          <div className="flex items-center gap-1 text-gray-600 font-medium">
            {message.split(' ').map((word, index) => (
              <span
                key={index}
                className="bounce-text"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {word}
              </span>
            ))}
          </div>
          
          {/* Animated dots */}
          <div className="flex justify-center gap-1 mt-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.3}s` }}
              ></div>
            ))}
          </div>
          
          {/* Sweet message */}
          <div className="mt-3 text-sm text-gray-500 italic">
            🍰 Preparing something sweet for you... 🧁
          </div>
        </div>
      </div>
    </>
  );
};

export default CakeSpinner;