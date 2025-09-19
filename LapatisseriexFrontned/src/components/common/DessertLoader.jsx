import React from 'react';

const DessertLoader = ({ variant = 'cupcake', message = 'Baking fresh treats...' }) => {
  const loaderStyles = `
    @keyframes mixingBowl {
      0% { transform: rotate(0deg); }
      25% { transform: rotate(-5deg); }
      50% { transform: rotate(0deg); }
      75% { transform: rotate(5deg); }
      100% { transform: rotate(0deg); }
    }
    
    @keyframes cupcakeRise {
      0% { transform: translateY(20px) scale(0.8); opacity: 0.5; }
      50% { transform: translateY(-5px) scale(1.1); opacity: 1; }
      100% { transform: translateY(0px) scale(1); opacity: 1; }
    }
    
    @keyframes steamFloat {
      0% { transform: translateY(0) scale(1); opacity: 0.7; }
      50% { transform: translateY(-15px) scale(1.2); opacity: 0.4; }
      100% { transform: translateY(-30px) scale(1.5); opacity: 0; }
    }
    
    @keyframes chocolateMelt {
      0% { height: 100%; }
      50% { height: 60%; }
      100% { height: 100%; }
    }
    
    @keyframes sparkleShine {
      0%, 100% { opacity: 0.3; transform: scale(0.8); }
      50% { opacity: 1; transform: scale(1.2); }
    }
    
    .mixing-bowl { animation: mixingBowl 2s infinite ease-in-out; }
    .cupcake-rise { animation: cupcakeRise 1.5s infinite ease-in-out; }
    .steam { animation: steamFloat 2s infinite ease-out; }
    .chocolate-melt { animation: chocolateMelt 3s infinite ease-in-out; }
    .sparkle { animation: sparkleShine 1.8s infinite ease-in-out; }
  `;

  const CupcakeLoader = () => (
    <div className="relative flex items-center justify-center">
      {/* Cupcake base */}
      <div className="cupcake-rise">
        <div className="relative">
          {/* Cupcake wrapper */}
          <div className="w-16 h-12 bg-gradient-to-b from-yellow-300 to-yellow-600 rounded-b-lg border-2 border-yellow-700 shadow-lg"></div>
          
          {/* Frosting */}
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-20 h-12 bg-gradient-to-b from-pink-200 to-pink-400 rounded-full border-2 border-pink-500 shadow-md"></div>
          
          {/* Cherry */}
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
          <div className="absolute -top-9 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-green-400 rounded-sm" style={{ marginLeft: '2px' }}></div>
          
          {/* Decorative sprinkles */}
          <div className="absolute -top-4 left-3 w-1 h-3 bg-blue-400 rounded-full transform rotate-45"></div>
          <div className="absolute -top-3 right-3 w-1 h-3 bg-green-400 rounded-full transform rotate-12"></div>
          <div className="absolute -top-5 left-6 w-1 h-3 bg-yellow-400 rounded-full transform -rotate-30"></div>
        </div>
      </div>
      
      {/* Steam effect */}
      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute steam text-gray-400 text-xl"
            style={{
              left: `${(i - 1) * 8}px`,
              animationDelay: `${i * 0.5}s`
            }}
          >
            ☁️
          </div>
        ))}
      </div>
      
      {/* Sparkles around cupcake */}
      <div className="absolute inset-0">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute sparkle text-yellow-400"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`
            }}
          >
            ✨
          </div>
        ))}
      </div>
    </div>
  );

  const ChocolateLoader = () => (
    <div className="relative flex items-center justify-center">
      {/* Chocolate bar */}
      <div className="relative w-16 h-20 bg-gradient-to-b from-yellow-800 to-yellow-900 rounded-lg shadow-lg border-2 border-yellow-900">
        {/* Melting chocolate effect */}
        <div className="absolute inset-0 chocolate-melt bg-gradient-to-b from-transparent to-yellow-700 rounded-lg"></div>
        
        {/* Chocolate squares */}
        <div className="absolute inset-1 grid grid-cols-3 gap-0.5">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="bg-yellow-600 rounded-sm shadow-inner"></div>
          ))}
        </div>
        
        {/* Dripping effect */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2 w-2 h-4 bg-yellow-700 rounded-b-full"></div>
        <div className="absolute bottom-0 left-1/4 transform translate-y-1 w-1 h-3 bg-yellow-700 rounded-b-full"></div>
        <div className="absolute bottom-0 right-1/4 transform translate-y-1 w-1 h-2 bg-yellow-700 rounded-b-full"></div>
      </div>
    </div>
  );

  const MixingBowlLoader = () => (
    <div className="relative flex items-center justify-center">
      {/* Mixing bowl */}
      <div className="mixing-bowl relative">
        <div className="w-20 h-16 bg-gradient-to-b from-gray-200 to-gray-400 rounded-full border-4 border-gray-500 shadow-lg"></div>
        
        {/* Batter inside */}
        <div className="absolute top-2 left-2 right-2 h-8 bg-gradient-to-b from-yellow-200 to-yellow-400 rounded-full"></div>
        
        {/* Mixing spoon */}
        <div className="absolute top-0 right-2 w-1 h-12 bg-brown-600 rounded-full transform rotate-12"></div>
        <div className="absolute -top-2 right-1 w-4 h-3 bg-brown-600 rounded-full transform rotate-12"></div>
        
        {/* Ingredients floating */}
        <div className="absolute -top-4 left-4 text-sm animate-bounce">🥚</div>
        <div className="absolute -top-6 right-6 text-sm animate-bounce" style={{ animationDelay: '0.3s' }}>🥛</div>
        <div className="absolute -top-3 left-12 text-sm animate-bounce" style={{ animationDelay: '0.6s' }}>🧈</div>
      </div>
    </div>
  );

  const renderLoader = () => {
    switch (variant) {
      case 'chocolate':
        return <ChocolateLoader />;
      case 'mixing':
        return <MixingBowlLoader />;
      case 'cupcake':
      default:
        return <CupcakeLoader />;
    }
  };

  return (
    <>
      <style>{loaderStyles}</style>
      <div className="flex flex-col items-center justify-center py-16 bg-white">
        {renderLoader()}
        
        {/* Loading message */}
        <div className="mt-8 text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            {variant === 'chocolate' && '🍫 Melting Chocolate...'}
            {variant === 'mixing' && '🥄 Mixing Ingredients...'}
            {variant === 'cupcake' && '🧁 Baking Cupcakes...'}
          </h3>
          
          <p className="text-gray-600 font-medium mb-4">{message}</p>
          
          {/* Progress dots */}
          <div className="flex justify-center gap-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-3 h-3 bg-pink-400 rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              ></div>
            ))}
          </div>
          
          {/* Sweet message */}
          
        </div>
      </div>
    </>
  );
};

export default DessertLoader;