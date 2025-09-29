// Scroll management utilities to prevent conflicts and ensure consistent behavior

export const ScrollManager = {
  // Force immediate scroll to top without any smooth animation
  scrollToTopInstant: () => {
    // Multiple methods to ensure it works across all browsers and scenarios
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Force with requestAnimationFrame for browsers that delay the scroll
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
  },

  // Disable smooth scrolling temporarily
  disableSmoothScroll: () => {
    const elements = [document.documentElement, document.body];
    const originalBehaviors = [];
    
    elements.forEach((element, index) => {
      if (element) {
        originalBehaviors[index] = element.style.scrollBehavior;
        element.style.scrollBehavior = 'auto';
        element.style.setProperty('scroll-behavior', 'auto', 'important');
      }
    });
    
    return originalBehaviors;
  },

  // Restore smooth scrolling
  restoreSmoothScroll: (originalBehaviors = []) => {
    const elements = [document.documentElement, document.body];
    
    elements.forEach((element, index) => {
      if (element) {
        if (originalBehaviors[index]) {
          element.style.scrollBehavior = originalBehaviors[index];
        } else {
          element.style.removeProperty('scroll-behavior');
        }
      }
    });
  },

  // Disable scroll restoration for navigation
  disableScrollRestoration: () => {
    if ('scrollRestoration' in history) {
      const original = history.scrollRestoration;
      history.scrollRestoration = 'manual';
      return original;
    }
    return null;
  },

  // Restore scroll restoration
  restoreScrollRestoration: (original) => {
    if ('scrollRestoration' in history && original) {
      history.scrollRestoration = original;
    }
  },

  // Get current scroll position for debugging
  getScrollInfo: () => {
    return {
      windowScrollY: window.scrollY,
      windowPageYOffset: window.pageYOffset,
      documentElementScrollTop: document.documentElement.scrollTop,
      bodyScrollTop: document.body.scrollTop,
      scrollBehavior: {
        documentElement: getComputedStyle(document.documentElement).scrollBehavior,
        body: getComputedStyle(document.body).scrollBehavior
      }
    };
  },

  // Check if we're at the top of the page
  isAtTop: (threshold = 10) => {
    return window.scrollY <= threshold;
  },

  // Comprehensive scroll reset for product navigation
  resetScrollForProductNavigation: (productId) => {
    console.log(`🔄 Resetting scroll for product: ${productId}`);
    
    // 1. Disable smooth scrolling immediately
    const originalBehaviors = ScrollManager.disableSmoothScroll();
    
    // 2. Disable scroll restoration
    const originalRestoration = ScrollManager.disableScrollRestoration();
    
    // 3. Force scroll to top multiple times with different timing
    ScrollManager.scrollToTopInstant();
    
    // Additional scroll resets with minimal delays
    setTimeout(() => ScrollManager.scrollToTopInstant(), 1);
    setTimeout(() => ScrollManager.scrollToTopInstant(), 10);
    setTimeout(() => ScrollManager.scrollToTopInstant(), 50);
    
    // Return cleanup function
    return () => {
      ScrollManager.restoreSmoothScroll(originalBehaviors);
      ScrollManager.restoreScrollRestoration(originalRestoration);
    };
  },

  // Monitor scroll position changes (for debugging)
  monitorScroll: (callback, duration = 5000) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const info = ScrollManager.getScrollInfo();
      callback(info);
      
      if (Date.now() - startTime > duration) {
        clearInterval(interval);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }
};

export default ScrollManager;