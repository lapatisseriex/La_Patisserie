import React, { useState, useEffect } from 'react';
import { useProduct } from '../../context/ProductContext/ProductContext';

const ProductDebugPanel = ({ productId }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});
  const { clearProductCache, clearSpecificProductCache } = useProduct();

  // Toggle debug panel with keyboard shortcut (Ctrl+D)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    if (process.env.NODE_ENV === 'development') {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, []);

  // Collect debug information
  useEffect(() => {
    if (isVisible && productId) {
      const updateInfo = () => {
        const info = {
          productId,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          online: navigator.onLine,
          scrollPosition: window.scrollY,
          scrollBehavior: {
            documentElement: getComputedStyle(document.documentElement).scrollBehavior,
            body: getComputedStyle(document.body).scrollBehavior,
            hasProductClass: document.body.classList.contains('product-display-page-mobile')
          },
          viewportSize: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          localStorage: Object.keys(localStorage).filter(key => 
            key.includes('product') || key.includes('cart')
          ).length,
          sessionStorage: Object.keys(sessionStorage).filter(key => 
            key.includes('product') || key.includes('cart')
          ).length
        };
        setDebugInfo(info);
      };
      
      updateInfo();
      
      // Update scroll position in real-time
      const handleScroll = () => {
        setDebugInfo(prev => ({
          ...prev,
          scrollPosition: window.scrollY,
          timestamp: new Date().toISOString()
        }));
      };
      
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [isVisible, productId]);

  if (process.env.NODE_ENV !== 'development' || !isVisible) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-[9999] bg-black text-white p-4 rounded-lg shadow-2xl max-w-sm text-xs font-mono">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-yellow-400">🐛 Product Debug</h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-white hover:text-red-400"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2 text-gray-300">
        <div><strong>Product ID:</strong> {debugInfo.productId}</div>
        <div><strong>Online:</strong> {debugInfo.online ? '✅' : '❌'}</div>
        <div><strong>Scroll:</strong> {debugInfo.scrollPosition}px</div>
        <div><strong>Scroll Behavior:</strong> {debugInfo.scrollBehavior?.documentElement || 'auto'}</div>
        <div><strong>Mobile Class:</strong> {debugInfo.scrollBehavior?.hasProductClass ? '✅' : '❌'}</div>
        <div><strong>Viewport:</strong> {debugInfo.viewportSize?.width}×{debugInfo.viewportSize?.height}</div>
        <div><strong>Cache Items:</strong> {debugInfo.localStorage + debugInfo.sessionStorage}</div>
        <div><strong>Time:</strong> {debugInfo.timestamp?.split('T')[1]?.split('.')[0]}</div>
      </div>

      <div className="mt-4 space-y-2">
        <button 
          onClick={() => clearSpecificProductCache(productId)}
          className="w-full bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
        >
          🗑️ Clear This Product
        </button>
        <button 
          onClick={() => clearProductCache()}
          className="w-full bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
        >
          🧹 Clear All Cache
        </button>
        <button 
          onClick={() => window.location.reload()}
          className="w-full bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
        >
          🔄 Reload Page
        </button>
      </div>
      
      <div className="mt-2 text-gray-500 text-xs">
        Press <strong>Ctrl+D</strong> to toggle
      </div>
    </div>
  );
};

export default ProductDebugPanel;