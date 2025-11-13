import React, { useState, useEffect, useRef, useMemo, useCallback, useDeferredValue } from 'react';
import { Search, X, TrendingUp, Sparkles, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Fallback names used only if no live products are available
const FALLBACK_TYPEWRITER_NAMES = [
  'Oreo Tiramisu',
  'Mango Tiramisu',
  'Classic Cheesecake',
  'Hazelnut Crunch Pastry',
  'Belgian Chocolate Mousse'
];

const SearchBar = ({ 
  bestSellers = [], 
  newLaunches = [], 
  cartPicks = [], 
  onProductClick,
  onQueryChange,
  disableSuggestions = false,
  // Optional: control wrapper z-index for pages with their own sticky bars (e.g., Products)
  baseZIndex = 200
}) => {
  // Shown when animation is paused or no suggestions are available
  const DEFAULT_PLACEHOLDER = 'Search for pastries, cakes, desserts...';
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  const [typewriterState, setTypewriterState] = useState({
    index: 0,
    subIndex: 0,
    deleting: false,
    pause: false,
    placeholder: DEFAULT_PLACEHOLDER
  });
  const searchRef = useRef(null);
  const trimmedQuery = useMemo(() => searchQuery.toLowerCase().trim(), [searchQuery]);
  const deferredQuery = useDeferredValue(trimmedQuery);

  const productSources = useMemo(() => ([
    { list: bestSellers, section: 'Best Sellers', icon: TrendingUp, color: '#733857' },
    { list: newLaunches, section: 'New Launch', icon: Sparkles, color: '#8d4466' },
    { list: cartPicks, section: 'Picked For You', icon: ShoppingCart, color: '#412434' }
  ]), [bestSellers, newLaunches, cartPicks]);

  const buildEntries = useCallback((filterFn) => {
    const seen = new Set();
    const entries = [];

    productSources.forEach(({ list = [], section, icon, color }) => {
      list.forEach((product) => {
        if (!product || !product._id) return;
        if (seen.has(product._id)) return;
        if (typeof filterFn === 'function' && !filterFn(product)) return;

        seen.add(product._id);
        entries.push({
          ...product,
          section,
          icon,
          color
        });
      });
    });

    return entries;
  }, [productSources]);

  const suggestionPool = useMemo(() => {
    const suggestions = buildEntries();
    return suggestions.slice(0, 6);
  }, [buildEntries]);

  // Prefer live product names for the typewriter animation; fallback if empty
  const typewriterNames = useMemo(() => {
    const names = suggestionPool
      .map((item) => item?.name)
      .filter((name, i, arr) => Boolean(name) && arr.indexOf(name) === i);
    return names.length > 0 ? names : FALLBACK_TYPEWRITER_NAMES;
  }, [suggestionPool]);

  // Note: We intentionally avoid resetting the typewriter state based on data changes
  // to keep the animation smooth and continuous even when the component re-renders.

  // Animate the placeholder whenever the field is empty, regardless of focus
  const shouldAnimatePlaceholder = trimmedQuery === '';

  // Typewriter animation for placeholder text when input is empty and focused
  useEffect(() => {
    if (!shouldAnimatePlaceholder || typewriterNames.length === 0) {
      if (
        typewriterState.placeholder !== DEFAULT_PLACEHOLDER ||
        typewriterState.subIndex !== 0 ||
        typewriterState.deleting ||
        typewriterState.pause ||
        typewriterState.index !== 0
      ) {
        setTypewriterState((prev) => ({
          ...prev,
          placeholder: DEFAULT_PLACEHOLDER,
          subIndex: 0,
          deleting: false,
          pause: false,
          index: 0
        }));
      }
      return;
    }

    if (typewriterState.pause) {
      return;
    }

    const timeout = setTimeout(() => {
      setTypewriterState((prev) => {
        const names = typewriterNames;
        if (names.length === 0) {
          return { ...prev, placeholder: DEFAULT_PLACEHOLDER };
        }

        const currentName = names[prev.index] || '';

        if (!prev.deleting && prev.subIndex === currentName.length) {
          return {
            ...prev,
            pause: true,
            placeholder: `Search for ${currentName}`
          };
        }

        if (prev.deleting && prev.subIndex === 0) {
          const nextIndex = (prev.index + 1) % names.length;
          return {
            ...prev,
            deleting: false,
            index: nextIndex,
            placeholder: 'Search for '
          };
        }

        const nextSubIndex = prev.subIndex + (prev.deleting ? -1 : 1);
        return {
          ...prev,
          subIndex: nextSubIndex,
          placeholder: `Search for ${currentName.slice(0, nextSubIndex)}`
        };
      });
    }, typewriterState.deleting ? 55 : 110);

    return () => clearTimeout(timeout);
  }, [typewriterNames, typewriterState, shouldAnimatePlaceholder, DEFAULT_PLACEHOLDER]);

  // Resume animation after pause duration
  useEffect(() => {
    if (!typewriterState.pause || !shouldAnimatePlaceholder || typewriterNames.length === 0) return;

    const timeout = setTimeout(() => {
      setTypewriterState((prev) => ({
        ...prev,
        pause: false,
        deleting: true
      }));
    }, 1500);

    return () => clearTimeout(timeout);
  }, [typewriterState.pause, typewriterNames.length, shouldAnimatePlaceholder]);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Track viewport changes for responsive sizing
  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const searchResults = useMemo(() => {
    if (deferredQuery === '') {
      return suggestionPool;
    }

    return buildEntries((product) => {
      const nameMatch = product.name?.toLowerCase().includes(deferredQuery);
      const descriptionMatch = product.description?.toLowerCase().includes(deferredQuery);
      return Boolean(nameMatch || descriptionMatch);
    }).slice(0, 8);
  }, [deferredQuery, suggestionPool, buildEntries]);

  const isShowingDefaultSuggestions = deferredQuery === '' && suggestionPool.length > 0;

  const handleClearSearch = () => {
    setSearchQuery('');
    if (typeof onQueryChange === 'function') onQueryChange('');
  };

  const handleProductClick = (product) => {
    setSearchQuery('');
    setIsSearchFocused(false);
    if (onProductClick) {
      onProductClick(product);
    }
  };

  const getProductImage = (product) => {
    if (product.images && product.images.length > 0) {
      return typeof product.images[0] === 'string' 
        ? product.images[0] 
        : product.images[0]?.url || '/placeholder.png';
    }
    return '/placeholder.png';
  };

  const showDropdown = !disableSuggestions && isSearchFocused && searchResults.length > 0;
  const showEmptyState = !disableSuggestions && isSearchFocused && deferredQuery !== '' && searchResults.length === 0;

  const isMobile = viewportWidth < 640;
  const isTablet = viewportWidth >= 640 && viewportWidth < 1024;
  const isSmallPhone = viewportWidth < 360;
  // Compact sizing (reduced height for sleeker feel) with extra small phone support
  const inputHeight = isSmallPhone ? 40 : isMobile ? 44 : isTablet ? 48 : 52;
  // Pill radius stays generous for premium aesthetic
  const containerRadius = isMobile ? 999 : 999; // fully rounded pill across breakpoints
  // Collapsed vs expanded widths for interactive polish
  const collapsedWidth = isSmallPhone ? '96%' : isMobile ? '92%' : isTablet ? '72%' : '60%';
  const dropdownOffset = isMobile ? 8 : 12;
  const dropdownMaxHeight = isSmallPhone ? '60vh' : isMobile ? '55vh' : isTablet ? '50vh' : '360px';
  const sectionPadding = isMobile ? '0 12px' : '0';
  const iconPaddingLeft = isSmallPhone ? 12 : isMobile ? 16 : 20;
  const shadowFocused = isMobile
    ? '0 14px 32px rgba(115, 56, 87, 0.22)'
    : '0 18px 40px rgba(115, 56, 87, 0.18)';
  const shadowIdle = isMobile
    ? '0 8px 22px rgba(17, 24, 39, 0.08)'
    : '0 12px 30px rgba(17, 24, 39, 0.08)';

  return (
    <div 
      ref={searchRef} 
      className="relative w-full"
      style={{
        // Keep high by default (Home page), but allow pages to override to avoid overlapping sticky headers
        zIndex: baseZIndex,
        maxWidth: isMobile ? '100%' : '1100px',
        padding: sectionPadding
      }}
    >
      {/* Width-animating wrapper */}
      <motion.div
        className="relative mx-auto"
        initial={false}
        animate={{ width: isSearchFocused ? '100%' : collapsedWidth }}
        transition={{ type: 'spring', stiffness: 320, damping: 36, mass: 0.6 }}
        style={{ willChange: 'width' }}
      >
        {/* Elevated backdrop */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(115,56,87,0.08) 0%, rgba(140,83,109,0.12) 100%)',
            borderRadius: `${containerRadius}px`,
            transform: 'translateY(-6px)',
            filter: 'blur(12px)',
            zIndex: -1
          }}
        />
        
        {/* Search Input Container */}
        <div 
          className="relative flex items-center transition-all duration-300 bg-white/95 backdrop-blur-sm"
          style={{
            border: '1px solid',
            borderColor: isSearchFocused ? '#733857' : 'rgba(115,56,87,0.18)',
            boxShadow: isSearchFocused 
              ? '0 6px 22px rgba(115,56,87,0.22), 0 2px 6px rgba(0,0,0,0.06)'
              : '0 4px 14px rgba(17,24,39,0.08)',
            minHeight: `${inputHeight}px`,
            height: `${inputHeight}px`,
            visibility: 'visible',
            opacity: 1,
            display: 'flex',
            width: '100%',
            borderRadius: `${containerRadius}px`,
            background: isSearchFocused
              ? 'linear-gradient(135deg, #ffffff 0%, #fdf7fa 55%, #f8eef3 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #fcfbfc 60%, #faf7fa 100%)',
            willChange: 'box-shadow, border-color, background',
            transform: 'translateZ(0)'
          }}
        >
        {/* Search Icon */}
        <div style={{ paddingLeft: `${iconPaddingLeft}px`, paddingRight: '10px', display: 'flex', alignItems: 'center' }}>
          {/* High-res custom SVG magnifier for crisp rendering */}
          <svg
            width={isSmallPhone ? '17' : '19'}
            height={isSmallPhone ? '17' : '19'}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="transition-all duration-300"
            style={{
              stroke: isSearchFocused ? '#733857' : 'rgba(115,56,87,0.55)',
              strokeWidth: isSmallPhone ? 1.7 : 1.9,
              transform: isSearchFocused ? 'scale(1.06)' : 'scale(1)',
              filter: isSearchFocused ? 'drop-shadow(0 1px 2px rgba(115,56,87,0.25))' : 'none'
            }}
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7.25" />
            <line x1="16.6" y1="16.6" x2="22" y2="22" strokeLinecap="round" />
          </svg>
        </div>

        {/* Input Field */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            const v = e.target.value;
            setSearchQuery(v);
            if (typeof onQueryChange === 'function') onQueryChange(v);
          }}
          onFocus={() => setIsSearchFocused(true)}
          autoComplete="off"
          placeholder={typewriterState.placeholder}
          className="flex-1 text-[12px] sm:text-[13px] md:text-sm outline-none bg-transparent font-light placeholder-gray-400 transition-all duration-300"
          style={{
            color: '#281c20',
            letterSpacing: '0.3px',
            padding: isSmallPhone ? '8px 6px 8px 0' : isMobile ? '10px 8px 10px 0' : '12px 14px 12px 0'
          }}
          aria-label="Search products"
        />

        {/* Clear Button */}
        <AnimatePresence>
          {searchQuery && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handleClearSearch}
              className="mr-4 p-1.5 hover:bg-gray-100 transition-colors duration-200"
              style={{ color: '#733857' }}
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>

    
        </div>

        {/* Search Results Dropdown */}
        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 right-0 w-full bg-white border overflow-hidden"
              style={{
                top: `calc(100% + ${dropdownOffset}px)`,
                borderColor: 'rgba(115, 56, 87, 0.1)',
                boxShadow: '0 12px 32px rgba(115, 56, 87, 0.15), 0 4px 16px rgba(0, 0, 0, 0.08)',
                maxHeight: dropdownMaxHeight,
                zIndex: 400
              }}
            >
              <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: dropdownMaxHeight }}>
                {/* Results Header */}
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-medium tracking-wider uppercase" style={{ color: '#733857' }}>
                    {isShowingDefaultSuggestions
                      ? 'Suggested For You'
                      : `${searchResults.length} ${searchResults.length === 1 ? 'Result' : 'Results'} Found`}
                  </p>
                  {isShowingDefaultSuggestions && (
                    <p className="mt-1 text-[11px] uppercase tracking-wide text-gray-400">
                      Trending picks to get you started
                    </p>
                  )}
                </div>

                {/* Results List */}
                <div className="py-2">
                  {searchResults.map((product, index) => {
                    const Icon = product.icon || Search;
                    return (
                      <motion.button
                        key={`${product._id}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleProductClick(product)}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-all duration-200 group border-b border-gray-50 last:border-b-0"
                      >
                        {/* Product Image */}
                        <div
                          className="flex-shrink-0 bg-gray-100 overflow-hidden relative"
                          style={{
                            width: isMobile ? '52px' : '64px',
                            height: isMobile ? '52px' : '64px',
                            borderRadius: isMobile ? '14px' : '16px'
                          }}
                        >
                          <img
                            src={getProductImage(product)}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          {/* Section Badge */}
                          <div 
                            className="absolute top-1 right-1 p-1"
                            style={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              backdropFilter: 'blur(4px)'
                            }}
                          >
                            <Icon 
                              className="w-3 h-3" 
                              style={{ color: product.color }} 
                            />
                          </div>
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 text-left min-w-0">
                          <h4 
                            className="text-sm md:text-base font-medium truncate group-hover:text-[#733857] transition-colors duration-200"
                            style={{ color: '#281c20' }}
                          >
                            {product.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span 
                              className="text-xs font-light tracking-wide uppercase"
                              style={{ color: product.color }}
                            >
                              {product.section}
                            </span>
                            {product.offerPrice && product.actualPrice && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-medium" style={{ color: '#733857' }}>
                                  ₹{product.offerPrice}
                                </span>
                                <span className="text-xs line-through text-gray-400">
                                  ₹{product.actualPrice}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Arrow Icon */}
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-200">
                          <svg 
                            width="20" 
                            height="20" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2"
                            style={{ color: '#733857' }}
                          >
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                          </svg>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* No Results Message */}
        <AnimatePresence>
          {showEmptyState && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute left-0 right-0 w-full bg-white border p-6 text-center"
              style={{
                top: `calc(100% + ${dropdownOffset}px)`,
                borderColor: 'rgba(115, 56, 87, 0.1)',
                boxShadow: '0 12px 32px rgba(115, 56, 87, 0.15)',
                zIndex: 400
              }}
            >
              <div className="flex flex-col items-center gap-3">
                <div 
                  className="w-12 h-12 flex items-center justify-center"
              
                >
                  <Search className="w-6 h-6" style={{ color: '#733857' }} />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: '#281c20' }}>
                    No products found
                  </p>
                  <p className="text-xs text-gray-500 font-light">
                    Try searching with different keywords
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f5f5f5;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #733857;
          opacity: 0.3;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #8d4466;
        }
      `}</style>
    </div>
  );
};

export default SearchBar;
