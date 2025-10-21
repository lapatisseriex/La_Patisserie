import { useState, useEffect } from 'react';

/**
 * Hook to manage NGO side panel state across pages
 * Checks sessionStorage for trigger and auto-opens panel
 */
export const useNGOPanel = () => {
  const [showNGOPanel, setShowNGOPanel] = useState(false);

  useEffect(() => {
    // Check if we should show the panel after navigation
    const shouldShowPanel = sessionStorage.getItem('showNGOPanel');
    
    if (shouldShowPanel === 'true') {
      // Small delay for smooth transition after page load
      const timer = setTimeout(() => {
        setShowNGOPanel(true);
        // Clear the flag after showing
        sessionStorage.removeItem('showNGOPanel');
      }, 300);

      return () => clearTimeout(timer);
    }
  }, []);

  const openPanel = () => setShowNGOPanel(true);
  const closePanel = () => setShowNGOPanel(false);

  return {
    showNGOPanel,
    openPanel,
    closePanel
  };
};
