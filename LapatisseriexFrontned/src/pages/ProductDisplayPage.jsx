import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, ShoppingCart, Plus, Minus, Share2, ChevronDown, ChevronUp, Package, Truck, Shield, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { fetchProductById, fetchProducts, makeSelectListByKey } from '../redux/productsSlice';
import { useCart } from '../hooks/useCart';
import { useFavorites } from '../context/FavoritesContext/FavoritesContext';
import FavoriteButton from '../components/Favorites/FavoriteButton';
import { useRecentlyViewed } from '../context/RecentlyViewedContext/RecentlyViewedContext';
import { useAuth } from '../hooks/useAuth';
import MediaDisplay from '../components/common/MediaDisplay';
import ProductCard from '../components/Products/ProductCard';
import ProductImageModal from '../components/common/ProductImageModal';
import ProductDisplaySkeleton from '../components/common/ProductDisplaySkeleton';
import OfferBadge from '../components/common/OfferBadge';
import BlobButton from '../components/common/BlobButton';
import ScrollManager from '../utils/scrollManager';
import { calculatePricing } from '../utils/pricingUtils';
import { formatVariantLabel } from '../utils/variantUtils';
import { getOrderExperienceInfo } from '../utils/orderExperience';

import { WebsiteLiveTimerCompact } from '../components/WebsiteLiveTimer/index.js';
import '../styles/ProductDisplayPageNew.css';

const ProductDisplayPageNew = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get product data from Redux store
  const product = useSelector((state) => state.products.selectedProduct);
  const loading = useSelector((state) => state.products.loading);
  const error = useSelector((state) => state.products.error);
  
  const { addToCart, getItemQuantity, updateQuantity, cartItems, isLoading } = useCart();
  const { fetchRecentlyViewed, trackProductView } = useRecentlyViewed();
  const { user, toggleAuthPanel, changeAuthType } = useAuth();
  const { isFavorite } = useFavorites();

  const orderExperience = useMemo(() => getOrderExperienceInfo(user), [user]);

  const mediaItems = useMemo(() => {
    const items = [];
    if (Array.isArray(product?.images)) {
      product.images.forEach((src, idx) => {
        if (src) {
          items.push({ type: 'image', src, key: `image-${idx}` });
        }
      });
    }
    // Only include videos for logged-in users to avoid heavy loads for guests
    if (user && Array.isArray(product?.videos)) {
      product.videos.forEach((src, idx) => {
        if (src) {
          items.push({ type: 'video', src, key: `video-${idx}` });
        }
      });
    }
    return items;
  }, [product?.images, product?.videos, user]);

  // IMMEDIATE scroll prevention
  React.useLayoutEffect(() => {
    console.log(`🚀 ProductDisplayPageNew mounting for product: ${productId}`);
    const cleanupScroll = ScrollManager.resetScrollForProductNavigation(productId);
    document.body.classList.add('product-display-page-new');
    
    return () => {
      console.log(`🧹 ProductDisplayPageNew cleanup for product: ${productId}`);
      document.body.classList.remove('product-display-page-new');
      cleanupScroll();
    };
  }, [productId]);

  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [lastQuantityChangeTime, setLastQuantityChangeTime] = useState(0);
  const [jellyAnimationKey, setJellyAnimationKey] = useState(0);
  const [animationDirection, setAnimationDirection] = useState('none');
  
  const reserveButtonMobileRef = useRef(null);
  const reserveButtonDesktopRef = useRef(null);
  const [stickyTopOffset, setStickyTopOffset] = useState(0);

  const isElementInViewport = (ref) => {
    const el = ref?.current;
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const vw = window.innerWidth || document.documentElement.clientWidth;
    return rect.top < vh && rect.bottom > 0 && rect.left < vw && rect.right > 0;
  };

  // Check if element is above the viewport (scrolled past)
  const isElementAboveViewport = (ref) => {
    const el = ref?.current;
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return rect.bottom < 0;
  };

  // Fetch product data
  useEffect(() => {
    if (productId) {
      dispatch(fetchProductById(productId));
    }
  }, [dispatch, productId]);

  // Set initial variant when product loads
  useEffect(() => {
    if (product?.variants?.length > 0) {
      setSelectedVariant(product.variants[0]);
      setSelectedVariantIndex(0);
    }
  }, [product]);
  
  // Keep selectedVariant state in sync
  useEffect(() => {
    if (product?.variants && product.variants[selectedVariantIndex]) {
      setSelectedVariant(product.variants[selectedVariantIndex]);
    }
  }, [selectedVariantIndex, product]);

  useEffect(() => {
    if (mediaItems.length === 0) {
      setSelectedMediaIndex(0);
      return;
    }

    const firstImageIndex = mediaItems.findIndex((item) => item.type === 'image');
    const fallbackIndex = firstImageIndex !== -1 ? firstImageIndex : 0;
    setSelectedMediaIndex(fallbackIndex);
  }, [productId, mediaItems.length]);

  useEffect(() => {
    setSelectedMediaIndex((prev) => {
      if (mediaItems.length === 0) {
        return 0;
      }
      if (prev >= mediaItems.length) {
        return mediaItems.length - 1;
      }
      return prev;
    });
  }, [mediaItems.length]);

  const imageIndices = useMemo(() => {
    return mediaItems
      .map((item, idx) => (item.type === 'image' ? idx : null))
      .filter((idx) => idx !== null);
  }, [mediaItems]);

  const modalImages = useMemo(() => {
    return imageIndices.map((idx) => mediaItems[idx]).filter(Boolean);
  }, [imageIndices, mediaItems]);

  const modalInitialIndex = useMemo(() => {
    const relativeIndex = imageIndices.indexOf(selectedMediaIndex);
    return relativeIndex >= 0 ? relativeIndex : 0;
  }, [imageIndices, selectedMediaIndex]);

  const isSelectedMediaImage = mediaItems[selectedMediaIndex]?.type === 'image';

  // Auto-advance through ALL media (images + videos) with simple timing
  const timerRef = useRef(null);
  const [mediaDelay, setMediaDelay] = useState(4000);
  const [isUserPausing, setIsUserPausing] = useState(false);
  const advanceToNextMedia = useCallback(() => {
    setSelectedMediaIndex((prev) => {
      if (!mediaItems.length) return 0;
      return (prev + 1) % mediaItems.length;
    });
  }, [mediaItems.length]);

  const advanceToPrevMedia = useCallback(() => {
    setSelectedMediaIndex((prev) => {
      if (!mediaItems.length) return 0;
      return (prev - 1 + mediaItems.length) % mediaItems.length;
    });
  }, [mediaItems.length]);

  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Pause when page hidden or no media or user hovering (desktop)
    if (document.hidden || mediaItems.length <= 1 || isHoveringImage || isUserPausing) {
      return () => {};
    }

    const current = mediaItems[selectedMediaIndex];
    const delay = current?.type === 'video' ? 8000 : 4000; // videos show a bit longer
    setMediaDelay(delay);

    timerRef.current = setTimeout(() => {
      advanceToNextMedia();
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [selectedMediaIndex, mediaItems.length, isHoveringImage, isUserPausing, advanceToNextMedia]);

  useEffect(() => {
    const handleVisibility = () => {
      // retrigger effect by updating state subtly when visibility changes
      setSelectedMediaIndex((i) => i);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Track product view
  useEffect(() => {
    if (product?._id && user) {
      trackProductView(product._id, product).catch(console.error);
    }
  }, [product, user, trackProductView]);
  
  // Calculate sticky offset
  useEffect(() => {
    const computeOffset = () => {
      if (window.innerWidth >= 768) {
        const headerEl = document.querySelector('header');
        const headerHeight = headerEl ? headerEl.offsetHeight : 0;
        setStickyTopOffset(headerHeight);
      } else {
        setStickyTopOffset(0);
      }
    };

    computeOffset();
    window.addEventListener('resize', computeOffset);
    return () => window.removeEventListener('resize', computeOffset);
  }, []);
  
  // Scroll detection states
  const [showStickyNavbar, setShowStickyNavbar] = useState(false);
  const [showMobileStickyReserve, setShowMobileStickyReserve] = useState(false);
  const productInfoRef = useRef(null);

  // Calculate current cart quantity
  const currentCartQuantity = useMemo(() => {
    if (!product?._id) return 0;
    return getItemQuantity(product._id);
  }, [product?._id, getItemQuantity, cartItems]);

  // Generate rating
  const getProductRating = (productId) => {
    if (!productId) return { rating: 4.5, percentage: 85 };
    let hash = 0;
    for (let i = 0; i < productId.length; i++) {
      const char = productId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const rating = (4.0 + (Math.abs(hash) % 100) / 100).toFixed(1);
    const percentage = 80 + (Math.abs(hash * 7) % 21);
    return { rating: parseFloat(rating), percentage: Math.floor(percentage) };
  };

  const productRating = product ? getProductRating(product._id) : { rating: 4.5, percentage: 85 };

  const getRatingCount = (productId) => {
    if (!productId) return '3.9K';
    let hash = 0;
    for (let i = 0; i < productId.length; i++) {
      hash = ((hash << 5) - hash) + productId.charCodeAt(i);
      hash |= 0;
    }
    const base = Math.abs(hash % 9000) + 1000;
    const k = (base / 1000).toFixed(1);
    return `${k.replace(/\.0$/, '')}K`;
  };
  const ratingCountDisplay = product ? getRatingCount(product._id) : '3.9K';

  // Fetch Recently Viewed
  useEffect(() => {
    const loadRecent = async () => {
      if (!user) { setRecentlyViewed([]); return; }
      try {
        const data = await fetchRecentlyViewed();
        const filtered = (Array.isArray(data) ? data : []).filter(item => item.productId && item.productId._id !== productId).slice(0, 3);
        setRecentlyViewed(filtered);
      } catch (err) {
        console.error('Error loading recently viewed:', err);
        setRecentlyViewed([]);
      }
    };
    loadRecent();
  }, [user, productId, fetchRecentlyViewed]);

  // Fetch same category products
  const selectSameCategory = makeSelectListByKey('sameCategory');
  const sameCategoryAll = useSelector(selectSameCategory);
  useEffect(() => {
    if (product?.category?._id) {
      dispatch(fetchProducts({ key: 'sameCategory', category: product.category._id, limit: 6, isActive: true }));
    }
  }, [dispatch, product?.category?._id]);

  const sameCategoryProducts = useMemo(() => {
    const list = Array.isArray(sameCategoryAll) ? sameCategoryAll : [];
    return list.filter(p => p && p._id !== productId).slice(0, 3);
  }, [sameCategoryAll, productId]);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const isMobile = window.innerWidth < 768;
      const scrollY = window.scrollY;

      if (!isMobile) {
        // For desktop: show sticky navbar when user scrolls down past 400px or when reserve button is not visible
        const reserveVisible = isElementInViewport(reserveButtonDesktopRef);
        const shouldShowNavbar = scrollY > 400 && !reserveVisible;
        if (shouldShowNavbar !== showStickyNavbar) setShowStickyNavbar(shouldShowNavbar);
        if (showMobileStickyReserve) setShowMobileStickyReserve(false);
      } else {
        const reserveVisible = isElementInViewport(reserveButtonMobileRef);
        const shouldShowMobileReserve = !reserveVisible;
        if (shouldShowMobileReserve !== showMobileStickyReserve) setShowMobileStickyReserve(shouldShowMobileReserve);
        if (showStickyNavbar) setShowStickyNavbar(false);
      }
    };

    let scrollTimeout;
    const onScroll = () => {
      if (scrollTimeout) cancelAnimationFrame(scrollTimeout);
      scrollTimeout = requestAnimationFrame(() => {
        handleScroll();
        scrollTimeout = null;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    const timeoutId = setTimeout(() => handleScroll(), 100);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [reserveButtonMobileRef, reserveButtonDesktopRef, showStickyNavbar, showMobileStickyReserve]);

  const handleAddToCart = async () => {
    if (!product || totalStock === 0 || isAddingToCart) return;
    // If user is not logged in, open auth modal/sidebar and return
    if (!user) {
      if (typeof toggleAuthPanel === 'function') toggleAuthPanel();
      if (typeof changeAuthType === 'function') changeAuthType('login');
      return;
    }
    setIsAddingToCart(true);
    try {
      await addToCart(product, 1, selectedVariantIndex);
    } catch (error) {
      console.error('Error adding to cart:', error);
      try { const { toast } = await import('react-toastify'); toast.error(typeof error?.error === 'string' ? error.error : error?.message || 'Failed to add to cart'); } catch {}
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleReserve = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!product) return;
    // If user is not logged in, open auth modal/sidebar and return
    if (!user) {
      if (typeof toggleAuthPanel === 'function') toggleAuthPanel();
      if (typeof changeAuthType === 'function') changeAuthType('login');
      return;
    }
    const currentQuantity = getItemQuantity(product._id);
    const goCart = () => {
      try { navigate('/cart'); } catch { window.location.href = '/cart'; }
    };
    if (currentQuantity > 0) {
      goCart();
    } else {
      try {
        // Wait for addToCart operation to complete before navigating
        await addToCart(product, 1, selectedVariantIndex);
        console.log('✅ Product added successfully, navigating to cart');
        goCart();
      } catch (error) {
        console.error('❌ Error reserving product:', error);
        try { const { toast } = await import('react-toastify'); toast.error(typeof error?.error === 'string' ? error.error : error?.message || 'Failed to add to cart'); } catch {}
      }
    }
  };

  const handleQuantityChange = useCallback(async (newQuantity) => {
    if (newQuantity < 0 || !product?._id) return;
    
    const now = Date.now();
    const timeSinceLastClick = now - lastQuantityChangeTime;
    
    // Increase debounce time to prevent rapid clicks
    if (timeSinceLastClick < 300) {
      console.log('⏳ Throttling quantity update - too fast');
      return;
    }
    
    setLastQuantityChangeTime(now);
    
    const currentQuantity = getItemQuantity(product._id);
    const delta = newQuantity - currentQuantity;
    setAnimationDirection(delta > 0 ? 'up' : delta < 0 ? 'down' : 'none');
    
    setJellyAnimationKey(prev => prev + 1);
    
    try {
      await updateQuantity(product._id, newQuantity);
      console.log('✅ Quantity updated successfully');
    } catch (error) {
      console.error('❌ Error updating quantity:', error);
      // Don't show toast here as it's already handled in the hook
    }
  }, [updateQuantity, product?._id, lastQuantityChangeTime, getItemQuantity]);

  // Calculate pricing
  const pricingDetails = useMemo(() => {
    return calculatePricing(selectedVariant);
  }, [selectedVariant]);
  
  const selectedVariantLabel = useMemo(() => {
    if (!product) return '';

    const variantFromProduct = Array.isArray(product.variants) && Number.isInteger(selectedVariantIndex)
      ? product.variants[selectedVariantIndex]
      : null;

    const explicitLabel = variantFromProduct?.variantLabel;
    if (typeof explicitLabel === 'string' && explicitLabel.trim()) {
      return explicitLabel.trim();
    }

    const computedLabel = formatVariantLabel(selectedVariant || variantFromProduct);
    if (computedLabel) {
      return computedLabel;
    }

    const fallbackLabel = typeof product.variantLabel === 'string' && product.variantLabel.trim()
      ? product.variantLabel.trim()
      : typeof product.defaultVariantLabel === 'string' && product.defaultVariantLabel.trim()
        ? product.defaultVariantLabel.trim()
        : '';

    return fallbackLabel;
  }, [product, selectedVariant, selectedVariantIndex]);

  const tracks = !!selectedVariant?.isStockActive;
  const totalStock = tracks ? (selectedVariant?.stock || 0) : Number.POSITIVE_INFINITY;

  const selectedMedia = mediaItems[selectedMediaIndex] || null;
  const fallbackMediaSrc = Array.isArray(product?.images) && product.images.length > 0
    ? product.images[0]
    : Array.isArray(product?.videos) && product.videos.length > 0
      ? product.videos[0]
      : null;
  const fallbackMediaType = Array.isArray(product?.images) && product.images.length > 0
    ? 'image'
    : Array.isArray(product?.videos) && product.videos.length > 0
      ? 'video'
      : 'image';
  const selectedMediaSrc = selectedMedia?.src || fallbackMediaSrc;
  const selectedMediaType = selectedMedia?.type || fallbackMediaType;
  const hasVideos = Array.isArray(product?.videos) && product.videos.length > 0;
  const mediaCount = mediaItems.length;

  const handleMediaSelect = (index) => {
    if (index >= 0 && index < mediaCount) {
      setSelectedMediaIndex(index);
    }
  };

  const handleImageZoom = () => {
    if (selectedMediaType === 'image') {
      setIsImageModalOpen(true);
    }
  };
  
  // Function to handle sharing product
  const handleShare = async (e) => {
    e.stopPropagation();
    
    // Get current URL and product details
    const shareUrl = window.location.href;
    const shareTitle = product?.name || 'Check out this product';
    const shareText = product?.description?.short || 'I found this amazing product at La Patisserie!';
    
    // Try using Web Share API (works on mobile and modern desktop browsers)
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl});
        console.log('Product shared successfully');
        // Show a confirmation toast even after successful sharing
        toast.success('Product shared successfully!');
      } catch (error) {
        console.error('Error sharing:', error);
        // If sharing fails, fall back to clipboard
        copyToClipboard(shareUrl);
      }
    } else {
      // Fallback for browsers without Web Share API
      copyToClipboard(shareUrl);
    }
  };
  
  // Helper function to copy content to clipboard
  const copyToClipboard = async (text) => {
    try {
      // Modern clipboard API
      await navigator.clipboard.writeText(text);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          toast.success('Link copied to clipboard!');
        } else {
          toast.error('Failed to copy link');
        }
      } catch (err) {
        console.error('Fallback clipboard copy failed:', err);
        toast.error('Failed to copy link');
      }
      
      document.body.removeChild(textArea);
    }
  };
  
  // Show toast notification
  const showToast = (message) => {
    toast.success(message, {
      position: "top-center",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true
    });
  };

  // Reserve CTA Button Component with Orders page styling
  const ReserveCTA = ({ onClick, disabled, label = 'Reserve Yours', small = false, className = '', dataRole }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-role={dataRole}
      className={`relative rounded-md overflow-hidden transition-all duration-300 font-light tracking-wide ${
        small ? 'py-2 px-4 text-xs' : 'py-3 px-6 text-sm'
      } ${
        disabled
          ? 'bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed'
          : 'text-white hover:opacity-90 transform hover:scale-[1.02] active:scale-[0.98]'
      } ${className}`}
      style={{
        letterSpacing: '0.05em',
        background: disabled ? undefined : 'linear-gradient(135deg, #733857 0%, #8d4466 50%, #412434 100%)'
      }}
    >
      <span className="relative z-10 flex items-center justify-center gap-2 uppercase">
        {disabled ? (
          <>{totalStock === 0 ? 'Out of Stock' : 'Unavailable'}</>
        ) : (
          <>{label}</>
        )}
      </span>
    </button>
  );

  if (loading) {
    return <ProductDisplaySkeleton />;
  }

  if (!product) {
    return <ProductDisplaySkeleton />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Website Live Timer - STICKY FOR ALL DEVICES */}
      <div className="fixed top-0 left-0 right-0 z-[90] bg-white" style={{ 
        willChange: 'transform',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden'
      }}>
        {/* Timer */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-2.5">
          <WebsiteLiveTimerCompact />
        </div>
        
        {/* Mobile Back Button - Combined with timer */}
        <div className="md:hidden">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-gray-700 hover:text-gray-900 transition-colors px-3 py-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="text-[11px] font-light">Back</span>
          </button>
        </div>
      </div>

      {/* Enhanced Sticky Mini Navbar - Desktop only */}
      {product && (
        <div className={`hidden md:block fixed left-0 right-0 z-[95] transition-all duration-300 ease-out ${
          showStickyNavbar 
            ? 'translate-y-0 opacity-100' 
            : '-translate-y-full opacity-0'
        }`}
        style={{ top: '45px' }}>
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between gap-6">
              
              {/* Left: Product Info */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 border border-gray-100 overflow-hidden flex-shrink-0 bg-gray-50">
                  <MediaDisplay
                    src={selectedMediaSrc}
                    type={selectedMediaType}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    videoProps={{ controls: false, muted: true, loop: true, playsInline: true, autoPlay: true }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-light tracking-wide truncate leading-tight" style={{ color: '#1a1a1a', letterSpacing: '0.02em' }}>
                    {product.name}
                  </h3>
                  <div className="flex items-center flex-wrap gap-2 mt-1">
                    <span className="text-base font-light" style={{ color: '#1a1a1a' }}>
                      ₹{Math.round(pricingDetails.finalPrice)}
                    </span>
                    {pricingDetails.discountPercentage > 0 && (
                      <>
                        <span className="text-xs line-through" style={{ color: 'rgba(26, 26, 26, 0.5)' }}>
                          ₹{pricingDetails.mrp}
                        </span>
                        <OfferBadge label={`${pricingDetails.discountPercentage}% OFF`} className="text-[9px]" style={{ padding: '0px 4px' }} />
                      </>
                    )}
                  </div>
                  {selectedVariantLabel && (
                    <div className="mt-1 text-[11px] font-medium tracking-[0.2em] uppercase text-gray-500 truncate">
                      {selectedVariantLabel}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Action Buttons */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div
                  className="bg-gray-50 border border-gray-100 h-10 w-10 flex items-center justify-center hover:border-gray-200"
                  onClick={(e) => e.stopPropagation()}
                  role="presentation"
                >
                  <FavoriteButton productId={productId} size="md" />
                </div>
                
                {currentCartQuantity > 0 ? (
                  <div className="flex items-center bg-gray-50 border border-gray-100 h-10 rounded-md">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuantityChange(currentCartQuantity - 1);
                      }}
                      disabled={isAddingToCart}
                      className="w-9 h-full flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ color: '#1a1a1a' }}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <motion.span 
                      key={`jelly-${jellyAnimationKey}`}
                      initial={{ scaleX: 1, scaleY: 1, y: animationDirection === 'up' ? -10 : animationDirection === 'down' ? 10 : 0, opacity: animationDirection !== 'none' ? 0.7 : 1 }}
                      animate={{
                        scaleX: [1, 1.15, 0.95, 1.03, 1],
                        scaleY: [1, 0.85, 1.05, 0.98, 1],
                        y: [animationDirection === 'up' ? -10 : animationDirection === 'down' ? 10 : 0, animationDirection === 'up' ? -5 : animationDirection === 'down' ? 5 : 0, 0, 0, 0],
                        opacity: [animationDirection !== 'none' ? 0.7 : 1, 1, 1, 1, 1]
                      }}
                      transition={{ duration: 0.6, times: [0, 0.2, 0.5, 0.8, 1], ease: "easeInOut" }}
                      className="px-3 font-light text-sm min-w-[2rem] text-center"
                      style={{ color: '#1a1a1a' }}
                    >
                      {isAddingToCart ? '...' : currentCartQuantity}
                    </motion.span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuantityChange(currentCartQuantity + 1);
                      }}
                      disabled={(tracks && currentCartQuantity >= totalStock) || isAddingToCart}
                      className="w-9 h-full flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ color: '#1a1a1a' }}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <BlobButton
                    onClick={handleAddToCart}
                    disabled={!product?.isActive || (tracks && totalStock === 0) || isAddingToCart}
                    className="px-5 py-2 h-10"
                    style={{ 
                      letterSpacing: '0.05em',
                      fontSize: '12px'
                    }}
                  >
                    {isAddingToCart ? 'Adding...' : 'Add to Box'}
                  </BlobButton>
                )}

                <ReserveCTA
                  onClick={handleReserve}
                  disabled={!product?.isActive || (tracks && totalStock === 0)}
                  label="Reserve"
                  small
                  className="h-10 px-5"
                  dataRole="sticky-reserve"
                />
              </div>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Mobile Layout */}
      <div className="md:hidden min-h-screen bg-white pt-[60px]">
        {/* Mobile Image Display */}
        <div className="relative w-full">
          <div className="relative w-full overflow-hidden">
            <div 
              className={`relative w-full aspect-square ${selectedMediaType === 'image' ? 'cursor-pointer group' : 'cursor-default'} overflow-hidden touch-pan-y`}
              onClick={handleImageZoom}
            >
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.1}
                dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
                dragDirectionLock
                onDragEnd={(e, info) => {
                  const threshold = 50; // minimum distance to trigger a swipe
                  if (info.offset.x > threshold) {
                    // Swiped right - go to previous
                    advanceToPrevMedia();
                  } else if (info.offset.x < -threshold) {
                    // Swiped left - go to next
                    advanceToNextMedia();
                  }
                }}
                className="w-full h-full touch-none"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedMediaIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full"
                  >
                    <MediaDisplay
                      src={selectedMediaSrc}
                      type={selectedMediaType}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      videoProps={{
                        controls: false,
                        playsInline: true,
                        autoPlay: true,
                        muted: true,
                        loop: false,
                        onEnded: advanceToNextMedia
                      }}
                    />
                  </motion.div>
                </AnimatePresence>
              </motion.div>
              
              {/* Share button only */}
             <div className="absolute md:bottom-3 md:right-3 bottom-2 right-2 flex gap-3 z-30">
  <button
    onClick={handleShare}
    className="relative w-10 h-10 md:w-11 md:h-11 bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-md rounded-xl md:rounded-2xl flex items-center justify-center border border-white/40 shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)] hover:scale-105 hover:rotate-3 transition-all duration-500 ease-out group"
  >
    <Share2
      className="w-4 h-4 md:w-5 md:h-5 text-gray-900 group-hover:text-pink-600 transition-colors duration-500"
    />
    <span className="absolute -bottom-7 text-xs bg-black/70 text-white px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      Share
    </span>
  </button>
</div>


            </div>
            
            {/* Media dots indicator */}
            {mediaCount > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
                {mediaItems.map((item, index) => (
                  <div
                    key={item.key || index}
                    className={`flex h-2 w-3 items-center justify-center rounded-full transition-all duration-300 ${
                      index === selectedMediaIndex ? 'scale-110' : ''
                    }`}
                    style={{
                      background: index === selectedMediaIndex
                        ? 'linear-gradient(135deg, #733857 0%, #8d4466 50%, #412434 100%)'
                        : 'rgba(115, 56, 87, 0.3)'
                    }}
                  >
                    {item.type === 'video' && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-2 w-2 text-white"
                      >
                        <path d="M10 8l6 4-6 4V8z" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Product Info */}
        <div className="bg-white px-4 pb-6 space-y-4">
          {/* Product Info Card */}
          <div className="bg-white border-b border-gray-100 pt-6 pb-4" ref={productInfoRef}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-light tracking-wide leading-tight flex-1" style={{ color: '#1a1a1a', letterSpacing: '0.02em' }}>
                    {product.name}
                  </h1>
                 <div className="flex-shrink-0">
  <div className="relative group">
    <FavoriteButton
      productId={productId}
      size="md"
      className="p-2  hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)] hover:scale-105 hover:-rotate-3 transition-all duration-500 ease-out"
    />
    <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-xs bg-black/70 text-white px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      Favorite
    </span>
  </div>
</div>

                </div>
             
              </div>
            </div>

            {/* Price Row */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-light" style={{ color: '#1a1a1a' }}>
                ₹{Math.round(pricingDetails.finalPrice)}
              </span>
              {pricingDetails.discountPercentage > 0 && (
                <>
                  <span className="text-base line-through" style={{ color: 'rgba(26, 26, 26, 0.5)' }}>
                    ₹{pricingDetails.mrp}
                  </span>
                  <OfferBadge label={`${pricingDetails.discountPercentage}% OFF`} className="text-sm" />
                </>
              )}
            </div>
            {/* Rating chip */}
            <div className="mb-3">
              <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-full px-2.5 py-1">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#10b981] text-white text-[10px] leading-none">★</span>
                <span className="text-sm font-light" style={{ color: '#1a1a1a' }}>{productRating.rating}</span>
                <span className="text-sm" style={{ color: 'rgba(26, 26, 26, 0.5)' }}>|</span>
                <span className="text-sm" style={{ color: 'rgba(26, 26, 26, 0.5)' }}>{ratingCountDisplay}</span>
              </div>
            </div>

            {/* Returning customer badge */}
            <div className="mb-3">
              <span
                className="text-sm font-semibold tracking-wide"
                style={{ color: orderExperience.color}}
              >
                {orderExperience.label}
              </span>
            </div>

            {/* Dietary Indicators */}
            <div className="flex items-center gap-2 mt-3">
              {product.hasEgg ? (
                <div className="flex items-center gap-2 rounded-md px-3 py-1.5 border border-gray-200 bg-red-50">
                  <span className="w-5 h-5 grid place-items-center rounded-md border border-red-600 bg-red-50">
                    <span className="w-0 h-0 border-l-[5px] border-r-[5px] border-b-[8px] border-l-transparent border-r-transparent border-b-red-600"></span>
                  </span>
                  <span className="text-xs tracking-wide" style={{ color: '#1a1a1a', letterSpacing: '0.05em' }}>WITH EGG</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-md px-3 py-1.5 border border-gray-200 bg-green-50">
                  <span className="w-5 h-5 grid place-items-center rounded-md border-2 border-green-700 bg-white">
                    <span className="w-3 h-3 rounded-full bg-green-700"></span>
                  </span>
                  <span className="text-xs tracking-wide" style={{ color: '#1a1a1a', letterSpacing: '0.05em' }}>EGGLESS</span>
                </div>
              )}
            </div>

            {/* Product Description - Mobile */}
            {product.description && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
                  className="w-full flex items-center justify-between py-2"
                >
                  <h3 className="text-sm font-light tracking-wide uppercase" style={{ color: '#1a1a1a', letterSpacing: '0.05em' }}>
                    Product Description
                  </h3>
                  {isDescriptionOpen ? (
                    <ChevronUp className="w-4 h-4" style={{ color: '#733857' }} />
                  ) : (
                    <ChevronDown className="w-4 h-4" style={{ color: '#733857' }} />
                  )}
                </button>
                {isDescriptionOpen && (
                  <div className="mt-3 text-sm leading-relaxed" style={{ color: 'rgba(26, 26, 26, 0.7)' }}>
                    {product.description}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons for Mobile */}
          <div className="pt-2">
            <div className="flex items-stretch gap-3">
              {/* Left: Add/Quantity */}
              <div className="flex-1">
                {currentCartQuantity > 0 ? (
                  <div className="w-full h-[2.5rem] flex items-center justify-between bg-white border border-gray-100 rounded-md px-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleQuantityChange(currentCartQuantity - 1); }}
                      className="w-7 h-7 flex items-center justify-center transition-colors border border-gray-100 hover:bg-gray-50 rounded"
                      style={{ color: '#1a1a1a' }}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <motion.span 
                      key={`jelly-mobile-${jellyAnimationKey}`}
                      initial={{ scaleX: 1, scaleY: 1, y: animationDirection === 'up' ? -8 : animationDirection === 'down' ? 8 : 0, opacity: animationDirection !== 'none' ? 0.7 : 1 }}
                      animate={{
                        scaleX: [1, 1.15, 0.95, 1.03, 1],
                        scaleY: [1, 0.85, 1.05, 0.98, 1],
                        y: [animationDirection === 'up' ? -8 : animationDirection === 'down' ? 8 : 0, animationDirection === 'up' ? -4 : animationDirection === 'down' ? 4 : 0, 0, 0, 0],
                        opacity: [animationDirection !== 'none' ? 0.7 : 1, 1, 1, 1, 1]
                      }}
                      transition={{ duration: 0.6, times: [0, 0.2, 0.5, 0.8, 1], ease: "easeInOut" }}
                      className="text-sm font-light min-w-[2rem] text-center"
                      style={{ color: '#1a1a1a' }}
                    >
                      {currentCartQuantity}
                    </motion.span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleQuantityChange(currentCartQuantity + 1); }}
                      disabled={(tracks && currentCartQuantity >= totalStock)}
                      className="w-7 h-7 flex items-center justify-center transition-colors border border-gray-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 rounded"
                      style={{ color: '#1a1a1a' }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <BlobButton
                    onClick={handleAddToCart}
                    disabled={isAddingToCart || (tracks && totalStock === 0)}
                    className="w-full flex items-center justify-center gap-2 h-[2.5rem]"
                    style={{ 
                      letterSpacing: '0.05em',
                      fontSize: '12px'
                    }}
                  >
                    {isAddingToCart ? (
                      <div className="inline-block h-3.5 w-3.5 animate-spin border-2 border-[#733857] border-t-transparent rounded-full"></div>
                    ) : (
                      <span>Add to Box</span>
                    )}
                  </BlobButton>
                )}
              </div>

              {/* Right: Reserve */}
              <div className="flex-1" ref={reserveButtonMobileRef}>
                <ReserveCTA
                  onClick={handleReserve}
                  disabled={tracks && totalStock === 0}
                  label="Reserve Yours"
                  small
                  className="w-full h-[2.5rem]"
                />
              </div>
            </div>

            {/* Cancellation & Return Policy - Simple & Natural */}
            <div className="mt-4">
              <p className="text-xs leading-relaxed text-center" style={{ color: 'rgba(26, 26, 26, 0.6)' }}>
                Due to the perishable nature of our products, we do not accept cancellations or returns once the order is placed.
              </p>
            </div>
          </div>

          {/* Care Instructions & Info - Below Action Buttons (Mobile) */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="space-y-5">
              {/* Care Instructions */}
              <div>
                <h3 className="text-sm font-semibold tracking-wide uppercase mb-3" style={{ color: '#733857', letterSpacing: '0.08em' }}>
                  Care Instructions
                </h3>
                <div className="space-y-2.5">
                  <div className="flex gap-2">
                    <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5" style={{ background: '#733857' }}></span>
                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(26, 26, 26, 0.7)' }}>
                      Store cream cakes in refrigerator. Fondant cakes in air conditioned environment.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5" style={{ background: '#733857' }}></span>
                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(26, 26, 26, 0.7)' }}>
                      Slice and serve at room temperature. Avoid exposure to heat.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5" style={{ background: '#733857' }}></span>
                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(26, 26, 26, 0.7)' }}>
                      Use serrated knife for fondant cakes. Check for supports before serving to children.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5" style={{ background: '#733857' }}></span>
                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(26, 26, 26, 0.7)' }}>
                      Best consumed within 24 hours.
                    </p>
                  </div>
                </div>
              </div>

              {/* Delivery Timing */}
              <div className="p-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <h4 className="text-xs font-semibold tracking-wide uppercase mb-1.5" style={{ color: '#1a1a1a', letterSpacing: '0.08em' }}>
                      Delivery Timing
                    </h4>
                    <div className="space-y-1 text-xs" style={{ color: 'rgba(26, 26, 26, 0.7)' }}>
                      <p>
                        <strong style={{ color: '#1a1a1a' }}>Weekdays:</strong> 8:00 PM - 10:00 PM
                      </p>
                      <p>
                        <strong style={{ color: '#1a1a1a' }}>Weekends:</strong> 9:00 PM - 10:00 PM
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Manufacturer Details */}
              <div className="p-3">
                <h4 className="text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: '#1a1a1a', letterSpacing: '0.08em' }}>
                  Manufacturer Details
                </h4>
                <div className="space-y-0.5 text-xs" style={{ color: 'rgba(26, 26, 26, 0.7)' }}>
                 
                  <p>LIG 208 Gandhi Maannagar</p>
                  <p>Peelamedu, Coimbatore</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recently Viewed / Similar Products - Mobile */}
      {(recentlyViewed.length > 0 || sameCategoryProducts.length > 0) && (
        <section className="md:hidden mt-6 px-4 pb-8">
          <div className="text-center mb-6 border-b border-gray-100 pb-4">
            <h2 className="text-xl font-light tracking-wide mb-1" style={{ color: '#1a1a1a', letterSpacing: '0.02em' }}>
              {user && recentlyViewed.length > 0 ? 'Recently Viewed' : 'You Might Also Like'}
            </h2>
            <p className="text-sm tracking-wide" style={{ color: 'rgba(26, 26, 26, 0.5)', letterSpacing: '0.05em' }}>
              {user && recentlyViewed.length > 0
                ? "Products you've looked at recently"
                : `More delicious ${product?.category?.name || 'products'} for you`}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 xs:gap-4">
            {(user && recentlyViewed.length > 0 ? recentlyViewed : sameCategoryProducts).map((item) => {
              const productToShow = item.productId || item;
              if (!productToShow || !productToShow._id) return null;
              return (
                <ProductCard key={productToShow._id} product={productToShow} compact={true} />
              );
            })}
          </div>
        </section>
      )}

      {/* Mobile Sticky Product Bar */}
      <div
        className={`fixed bottom-16 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-100 shadow-lg transform transition-transform duration-300 ease-out ${
          showMobileStickyReserve ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
        style={{ maxHeight: '80px', overflow: 'hidden', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Product Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 border border-gray-100 overflow-hidden flex-shrink-0 bg-gray-50">
                <MediaDisplay
                  src={selectedMediaSrc}
                  type={selectedMediaType}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  videoProps={{ controls: false, muted: true, loop: true, playsInline: true, autoPlay: true }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-light tracking-wide truncate leading-tight" style={{ color: '#1a1a1a', letterSpacing: '0.02em' }}>{product.name}</h3>
                <div className="flex items-center flex-wrap gap-1 mt-0.5">
                  <span className="text-sm font-light" style={{ color: '#1a1a1a' }}>₹{Math.round(pricingDetails.finalPrice)}</span>
                  {pricingDetails.discountPercentage > 0 && (
                    <>
                      <span className="text-[11px]" style={{ color: 'rgba(26, 26, 26, 0.5)', textDecorationLine: 'line-through', textDecorationStyle: 'solid', textDecorationColor: 'rgba(26, 26, 26, 0.5)', textDecorationThickness: '1.5px' }}>₹{pricingDetails.mrp}</span>
                      <OfferBadge label={`${pricingDetails.discountPercentage}% OFF`} className="text-[9px] leading-none" style={{ padding: '0px 4px' }} />
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-stretch gap-2 flex-shrink-0">
              {currentCartQuantity > 0 ? (
                <div className="flex items-center bg-gray-50 border border-gray-100 h-8 rounded-md">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleQuantityChange(currentCartQuantity - 1); }}
                    className="w-8 h-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                    style={{ color: '#1a1a1a' }}
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <motion.span 
                    key={`jelly-sticky-${jellyAnimationKey}`}
                    initial={{ scaleX: 1, scaleY: 1, y: animationDirection === 'up' ? -6 : animationDirection === 'down' ? 6 : 0, opacity: animationDirection !== 'none' ? 0.7 : 1 }}
                    animate={{
                      scaleX: [1, 1.15, 0.95, 1.03, 1],
                      scaleY: [1, 0.85, 1.05, 0.98, 1],
                      y: [animationDirection === 'up' ? -6 : animationDirection === 'down' ? 6 : 0, animationDirection === 'up' ? -3 : animationDirection === 'down' ? 3 : 0, 0, 0, 0],
                      opacity: [animationDirection !== 'none' ? 0.7 : 1, 1, 1, 1, 1]
                    }}
                    transition={{ duration: 0.6, times: [0, 0.2, 0.5, 0.8, 1], ease: "easeInOut" }}
                    className="px-2 font-light text-sm min-w-[2rem] text-center"
                    style={{ color: '#1a1a1a' }}
                  >
                    {currentCartQuantity}
                  </motion.span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleQuantityChange(currentCartQuantity + 1); }}
                    disabled={(tracks && currentCartQuantity >= totalStock)}
                    className="w-8 h-full flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ color: '#1a1a1a' }}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <BlobButton
                  onClick={handleAddToCart}
                  disabled={!product?.isActive || (tracks && totalStock === 0) || isAddingToCart}
                  className="px-4 h-8"
                  style={{ 
                    letterSpacing: '0.05em',
                    fontSize: '12px'
                  }}
                >
                  {isAddingToCart ? 'Adding...' : 'Add to Cart'}
                </BlobButton>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block" style={{ paddingTop: '50px' }}>
        {/* Breadcrumb Navigation - Desktop only */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="font-light">Back</span>
              </button>
              <span className="text-gray-400">/</span>
              <button
                onClick={() => navigate('/products')}
                className="font-light text-gray-600 hover:text-gray-900 transition-colors"
              >
                Products
              </button>
              {product?.category && (
                <>
                  <span className="text-gray-400">/</span>
                  <button
                    onClick={() => navigate(`/products?category=${typeof product.category === 'object' ? product.category._id : product.category}`)}
                    className="font-light text-gray-600 hover:text-gray-900 transition-colors capitalize"
                  >
                    {typeof product.category === 'object' ? product.category.name : product.category}
                  </button>
                </>
              )}
              <span className="text-gray-400">/</span>
              <span className="font-light text-gray-900 truncate max-w-md">{product?.name}</span>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Image Gallery */}
          <div className="lg:col-span-7">
            <div className="relative">
              <div className="flex gap-4">
              {/* Thumbnail Media */}
              {mediaCount > 1 && (
                <div className="flex flex-col gap-2 w-24 max-h-[80vh] overflow-y-auto">
                  {mediaItems.map((item, index) => (
                    <button
                      key={item.key || index}
                      onClick={() => handleMediaSelect(index)}
                      className={`relative aspect-square transition-all overflow-hidden hover:scale-105 flex-shrink-0 ${
                        index === selectedMediaIndex
                          ? 'border-2'
                          : 'border border-gray-100 hover:border-gray-200'
                      }`}
                      style={index === selectedMediaIndex ? {
                        borderColor: '#733857'
                      } : {}}
                    >
                      <MediaDisplay
                        src={item.src}
                        type={item.type}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                        videoProps={{ controls: false, muted: true, loop: true, playsInline: true }}
                      />
                      {item.type === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                            className="h-6 w-6"
                          >
                            <path d="M10 8l6 4-6 4V8z" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Main Media */}
              <div className="flex-1">
                <div className="relative bg-white border border-gray-100">
                  <div 
                    className={`aspect-square relative overflow-hidden ${selectedMediaType === 'image' ? 'cursor-pointer group' : 'cursor-default'}`}
                    onClick={handleImageZoom}
                    onMouseEnter={() => setIsHoveringImage(true)}
                    onMouseLeave={() => setIsHoveringImage(false)}
                  >
                    {/* Desktop Share Button */}
                    <div className="absolute top-4 right-4 z-30">
                      <button
                        onClick={handleShare}
                        className="relative w-12 h-12 bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/50 shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)] hover:scale-105 hover:rotate-3 transition-all duration-500 ease-out group"
                      >
                        <Share2
                          className="w-5 h-5 text-gray-900 group-hover:text-pink-600 transition-colors duration-500"
                        />
                        <span className="absolute -bottom-8 text-xs bg-black/70 text-white px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          Share Product
                        </span>
                      </button>
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={selectedMediaIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="w-full h-full"
                      >
                        <MediaDisplay
                          src={selectedMediaSrc}
                          type={selectedMediaType}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          videoProps={{
                            controls: false,
                            playsInline: true,
                            autoPlay: true,
                            muted: true,
                            loop: false,
                            onEnded: advanceToNextMedia
                          }}
                        />
                      </motion.div>
                    </AnimatePresence>
                    {/* Removed play icon overlay to prevent covering native controls and improve UX */}
                    
                    {tracks && totalStock === 0 && (
                      <div 
                        className="absolute top-4 right-4 text-white px-3 py-1 text-sm tracking-wide" 
                        style={{ 
                          letterSpacing: '0.05em',
                          background: 'linear-gradient(135deg, #733857 0%, #8d4466 50%, #412434 100%)'
                        }}
                      >
                        Out of Stock
                      </div>
                    )}
                  </div>
                </div>
              </div>
              </div>

              {/* Important Information - Below Image (Desktop) */}
              <div className="mt-6 bg-white border border-gray-100 rounded-md p-5">
                <div className="space-y-5">
                  {/* Care Instructions */}
                  <div>
                    <h3 className="text-sm font-semibold tracking-wide uppercase mb-3" style={{ color: '#733857', letterSpacing: '0.08em' }}>
                      Care Instructions
                    </h3>
                    <div className="space-y-2.5">
                      <div className="flex gap-3">
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2" style={{ background: '#733857' }}></span>
                        <p className="text-sm leading-relaxed" style={{ color: 'rgba(26, 26, 26, 0.7)' }}>
                          Store cream cakes in refrigerator. Fondant cakes should be stored in air conditioned environment.
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2" style={{ background: '#733857' }}></span>
                        <p className="text-sm leading-relaxed" style={{ color: 'rgba(26, 26, 26, 0.7)' }}>
                          Slice and serve at room temperature. Avoid exposure to heat.
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2" style={{ background: '#733857' }}></span>
                        <p className="text-sm leading-relaxed" style={{ color: 'rgba(26, 26, 26, 0.7)' }}>
                          Use serrated knife for fondant cakes. Check for supports before serving to children.
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2" style={{ background: '#733857' }}></span>
                        <p className="text-sm leading-relaxed" style={{ color: 'rgba(26, 26, 26, 0.7)' }}>
                          Best consumed within 24 hours.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Timing */}
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold tracking-wide uppercase mb-2" style={{ color: '#1a1a1a', letterSpacing: '0.08em' }}>
                          Delivery Timing
                        </h4>
                        <div className="space-y-1 text-sm" style={{ color: 'rgba(26, 26, 26, 0.7)' }}>
                          <p><strong style={{ color: '#1a1a1a' }}>Weekdays:</strong> 8:00 PM - 10:00 PM</p>
                          <p><strong style={{ color: '#1a1a1a' }}>Weekends:</strong> 9:00 PM - 10:00 PM</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Manufacturer Details */}
                  <div className="p-4">
                    <h4 className="text-sm font-semibold tracking-wide uppercase mb-2.5" style={{ color: '#1a1a1a', letterSpacing: '0.08em' }}>
                      Manufacturer Details
                    </h4>
                    <div className="space-y-1 text-sm" style={{ color: 'rgba(26, 26, 26, 0.7)' }}>
                    
                      <p>LIG 208 Gandhi Maannagar</p>
                      <p>Peelamedu, Coimbatore</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Information */}
          <div className="lg:col-span-5">
            <div className="space-y-4">
              
              {/* Product Info Card */}
              <div className="bg-white border-b border-gray-100 pb-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <h1 className="text-3xl font-light tracking-wide leading-tight flex-1" style={{ color: '#1a1a1a', letterSpacing: '0.02em' }}>
                        {product.name}
                      </h1>
                      <div className="flex-shrink-0">
                        <FavoriteButton 
                          productId={productId} 
                          size="lg" 
                          className="bg-gray-50 p-2 border border-gray-100" 
                        />
                      </div>
                    </div>

                  </div>
                </div>

                {/* Price Row */}
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl font-light" style={{ color: '#1a1a1a' }}>
                    ₹{Math.round(pricingDetails.finalPrice)}
                  </span>
                  {pricingDetails.discountPercentage > 0 && (
                    <>
                      <span className="text-lg line-through" style={{ color: 'rgba(26, 26, 26, 0.5)' }}>
                        ₹{pricingDetails.mrp}
                      </span>
                      <OfferBadge label={`${pricingDetails.discountPercentage}% OFF`} className="text-sm md:text-base" />
                    </>
                  )}
                </div>
                {selectedVariantLabel && (
                  <div className="hidden md:block mt-1 text-xs uppercase tracking-[0.3em] text-gray-500">
                    {selectedVariantLabel}
                  </div>
                )}

                {/* Rating chip */}
                <div className="mb-4">
                  <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-full px-3 py-1">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#10b981] text-white text-sm">★</span>
                    <span className="text-sm font-light" style={{ color: '#1a1a1a' }}>{productRating.rating}</span>
                    <span className="text-sm" style={{ color: 'rgba(26, 26, 26, 0.5)' }}>|</span>
                    <span className="text-sm" style={{ color: 'rgba(26, 26, 26, 0.5)' }}>{ratingCountDisplay}</span>
                  </div>
                </div>

                {/* Returning customer badge */}
                <div className="mb-4">
                  <span
                    className="text-base font-semibold tracking-wide"
                    style={{ color: orderExperience.color}}
                  >
                    {orderExperience.label}
                  </span>
                </div>

                {/* Dietary Indicators */}
                <div className="flex items-center gap-3 mt-4">
                  {product.hasEgg ? (
                    <div className="flex items-center gap-2 rounded-md px-4 py-2 border border-gray-200 bg-red-50">
                      <span className="w-5 h-5 grid place-items-center rounded-md border border-red-600 bg-red-50">
                        <span className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[9px] border-l-transparent border-r-transparent border-b-red-600"></span>
                      </span>
                      <span className="text-sm tracking-wide" style={{ color: '#1a1a1a', letterSpacing: '0.05em' }}>WITH EGG</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-md px-4 py-2 border border-gray-200 bg-green-50">
                      <span className="w-5 h-5 grid place-items-center rounded-md border-2 border-green-700 bg-white">
                        <span className="w-3 h-3 rounded-full bg-green-700"></span>
                      </span>
                      <span className="text-sm tracking-wide" style={{ color: '#1a1a1a', letterSpacing: '0.05em' }}>EGGLESS</span>
                    </div>
                  )}
                </div>

                {/* Product Description - Desktop */}
                {product.description && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <button
                      onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
                      className="w-full flex items-center justify-between py-2"
                    >
                      <h3 className="text-base font-light tracking-wide uppercase" style={{ color: '#1a1a1a', letterSpacing: '0.05em' }}>
                        Product Description
                      </h3>
                      {isDescriptionOpen ? (
                        <ChevronUp className="w-5 h-5" style={{ color: '#733857' }} />
                      ) : (
                        <ChevronDown className="w-5 h-5" style={{ color: '#733857' }} />
                      )}
                    </button>
                    {isDescriptionOpen && (
                      <div className="mt-4 text-sm leading-relaxed" style={{ color: 'rgba(26, 26, 26, 0.7)' }}>
                        {product.description}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Variant Selection and Actions */}
              <div className="bg-white border-b border-gray-100 py-6 space-y-6">
                {/* Variant Selection */}
                {product.variants && product.variants.length > 1 && (
                  <div>
                    <label className="block text-sm font-light tracking-wide mb-3" style={{ color: '#1a1a1a', letterSpacing: '0.05em' }}>
                      AVAILABLE SIZES
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {product.variants.map((variant, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedVariantIndex(index)}
                          className={`p-3 text-center transition-all border ${
                            index === selectedVariantIndex
                              ? 'text-white border-[#733857]'
                              : 'bg-white border-gray-100 hover:border-gray-200'
                          }`}
                          style={index === selectedVariantIndex ? {
                            background: 'linear-gradient(135deg, #733857 0%, #8d4466 50%, #412434 100%)'
                          } : {}}
                        >
                          <div className="mb-2">
                            <MediaDisplay
                              src={fallbackMediaSrc || '/placeholder-image.jpg'}
                              type={fallbackMediaType}
                              alt={`${product.name} ${variant.quantity}${variant.measuringUnit}`}
                              className="w-full h-20 object-cover"
                              videoProps={{ controls: false, muted: true, loop: true, playsInline: true, autoPlay: true }}
                            />
                          </div>
                          
                          <div className="text-sm font-light tracking-wide" style={{ letterSpacing: '0.05em' }}>
                            {variant.quantity}{variant.measuringUnit}
                          </div>
                          <div className="text-xs" style={{ opacity: 0.75 }}>
                            ₹{variant.price}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-stretch gap-3">
                  <div className="flex-1">
                    {currentCartQuantity > 0 ? (
                      <div className="w-full h-12 flex items-center justify-between bg-white border border-gray-100 px-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleQuantityChange(currentCartQuantity - 1); }}
                          className="w-9 h-9 flex items-center justify-center transition-colors border border-gray-100 hover:bg-gray-50"
                          style={{ color: '#1a1a1a' }}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <motion.span 
                          key={`jelly-desktop-${jellyAnimationKey}`}
                          initial={{ scaleX: 1, scaleY: 1, y: animationDirection === 'up' ? -12 : animationDirection === 'down' ? 12 : 0, opacity: animationDirection !== 'none' ? 0.7 : 1 }}
                          animate={{
                            scaleX: [1, 1.15, 0.95, 1.03, 1],
                            scaleY: [1, 0.85, 1.05, 0.98, 1],
                            y: [animationDirection === 'up' ? -12 : animationDirection === 'down' ? 12 : 0, animationDirection === 'up' ? -6 : animationDirection === 'down' ? 6 : 0, 0, 0, 0],
                            opacity: [animationDirection !== 'none' ? 0.7 : 1, 1, 1, 1, 1]
                          }}
                          transition={{ duration: 0.6, times: [0, 0.2, 0.5, 0.8, 1], ease: "easeInOut" }}
                          className="text-base font-light min-w-[2.25rem] text-center"
                          style={{ color: '#1a1a1a' }}
                        >
                          {currentCartQuantity}
                        </motion.span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleQuantityChange(currentCartQuantity + 1); }}
                          disabled={(currentCartQuantity >= totalStock)}
                          className="w-9 h-9 flex items-center justify-center transition-colors border border-gray-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          style={{ color: '#1a1a1a' }}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <BlobButton
                        onClick={handleAddToCart}
                        disabled={isAddingToCart || totalStock === 0}
                        className="w-full py-3 px-5 flex items-center justify-center gap-2"
                        style={{ 
                          letterSpacing: '0.05em',
                          fontSize: '14px'
                        }}
                      >
                        {isAddingToCart ? (
                          <div className="inline-block h-4 w-4 animate-spin border-2 border-[#733857] border-t-transparent rounded-full"></div>
                        ) : (
                          <span>Add to Box</span>
                        )}
                      </BlobButton>
                    )}
                  </div>
                  <div className="flex-1" ref={reserveButtonDesktopRef}>
                    <ReserveCTA
                      onClick={handleReserve}
                      disabled={totalStock === 0}
                      label="Reserve Yours"
                      className="w-full py-3 px-5"
                    />
                  </div>
                </div>

                {/* Cancellation & Return Policy - Simple & Natural */}
                <div className="mt-6">
                  <p className="text-sm leading-relaxed text-center" style={{ color: 'rgba(26, 26, 26, 0.6)' }}>
                    Due to the perishable nature of our products, we do not accept cancellations or returns once the order is placed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recently Viewed / Similar Products - Desktop */}
        {(recentlyViewed.length > 0 || sameCategoryProducts.length > 0) && (
          <section className="hidden md:block mt-16">
            <div className="text-center mb-8 border-b border-gray-100 pb-6">
              <h2 className="text-2xl font-light tracking-wide mb-2" style={{ color: '#1a1a1a', letterSpacing: '0.02em' }}>
                {user && recentlyViewed.length > 0 ? "Recently Viewed" : "You Might Also Like"}
              </h2>
              <p className="text-sm tracking-wide" style={{ color: 'rgba(26, 26, 26, 0.5)', letterSpacing: '0.05em' }}>
                {user && recentlyViewed.length > 0 
                  ? "Products you've looked at recently" 
                  : `More delicious ${product?.category?.name || 'products'} for you`}
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {(user && recentlyViewed.length > 0 ? recentlyViewed : sameCategoryProducts).map((item) => {
                const productToShow = item.productId || item;
                if (!productToShow || !productToShow._id) return null;
                return (
                  <ProductCard key={productToShow._id} product={productToShow} compact={true} />
                );
              })}
            </div>
          </section>
        )}
        </div>
      </div>

      {/* Image Modal */}
      {isImageModalOpen && modalImages.length > 0 && (
        <ProductImageModal
          isOpen={isImageModalOpen}
          images={modalImages.map((item) => item.src)}
          initialIndex={modalInitialIndex}
          onClose={() => setIsImageModalOpen(false)}
        />
      )}
    </div>
  );
};

// Add the ToastContainer component at the top level
const ProductDisplayPageWithToast = () => {
  return (
    <>
      <ProductDisplayPageNew />
      <ToastContainer 
        position="top-center"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
};

export default ProductDisplayPageWithToast;
