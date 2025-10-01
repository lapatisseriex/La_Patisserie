import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, ShoppingCart, Plus, Minus, Share2, ZoomIn, ChevronDown, ChevronUp, ChevronRight, Package, Truck, Shield, Clock, X } from 'lucide-react';
import { fetchProductById, fetchProducts, makeSelectListByKey } from '../redux/productsSlice';
import { useCart } from '../hooks/useCart';
import { useFavorites } from '../context/FavoritesContext/FavoritesContext';
import FavoriteButton from '../components/Favorites/FavoriteButton';

import { useRecentlyViewed } from '../context/RecentlyViewedContext/RecentlyViewedContext';
import { useAuth } from '../context/AuthContext/AuthContext';
import MediaDisplay from '../components/common/MediaDisplay';
import ProductCard from '../components/Products/ProductCard';
import ProductImageModal from '../components/common/ProductImageModal';
import ProductDisplaySkeleton from '../components/common/ProductDisplaySkeleton';
import ProductDebugPanel from '../components/common/ProductDebugPanel';
import ScrollManager from '../utils/scrollManager';
import '../styles/ProductDisplayPage-mobile.css';
import '../styles/premiumButtons.css';

const ProductDisplayPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get product data from Redux store (stable selectors)
  const product = useSelector((state) => state.products.selectedProduct);
  const loading = useSelector((state) => state.products.loading);
  const error = useSelector((state) => state.products.error);
  
  const { addToCart, getItemQuantity, updateQuantity, cartItems, isLoading } = useCart();
  const { fetchRecentlyViewed, trackProductView } = useRecentlyViewed();
  const { user } = useAuth();
  const { isFavorite } = useFavorites();

  // IMMEDIATE scroll prevention - before any other effects
  React.useLayoutEffect(() => {
    console.log(`🚀 ProductDisplayPage mounting for product: ${productId}`);
    
    // Use the comprehensive scroll reset utility
    const cleanupScroll = ScrollManager.resetScrollForProductNavigation(productId);
    
    // Add mobile class for styling
    document.body.classList.add('product-display-page-mobile');
    
    // Monitor scroll for debugging in development
    let stopMonitoring = null;
    if (process.env.NODE_ENV === 'development') {
      stopMonitoring = ScrollManager.monitorScroll((info) => {
        if (info.windowScrollY > 50) {
          console.warn('⚠️ Unexpected scroll detected:', info);
        }
      }, 3000);
    }
    
    return () => {
      console.log(`🧹 ProductDisplayPage cleanup for product: ${productId}`);
      document.body.classList.remove('product-display-page-mobile');
      cleanupScroll();
      if (stopMonitoring) stopMonitoring();
    };
  }, [productId]); // Re-run when productId changes

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(true);
  const [isCareInstructionsOpen, setIsCareInstructionsOpen] = useState(false);
  const [isDeliveryInfoOpen, setIsDeliveryInfoOpen] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  // References to the main "Reserve Yours" buttons (mobile & desktop) to determine when to show sticky bars
  const reserveButtonMobileRef = useRef(null);
  const reserveButtonDesktopRef = useRef(null);
  // Offset for sticky bar to sit below desktop header
  const [stickyTopOffset, setStickyTopOffset] = useState(0);

  // Helper: determines if a referenced element is within the viewport (partial visibility counts)
  const isElementInViewport = (ref) => {
    const el = ref?.current;
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const vw = window.innerWidth || document.documentElement.clientWidth;
    return rect.top < vh && rect.bottom > 0 && rect.left < vw && rect.right > 0;
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
  
  // Keep selectedVariant state in sync with selectedVariantIndex
  useEffect(() => {
    if (product?.variants && product.variants[selectedVariantIndex]) {
      setSelectedVariant(product.variants[selectedVariantIndex]);
    }
  }, [selectedVariantIndex, product]);

  // Track product view
  useEffect(() => {
    if (product?._id && user) {
      trackProductView(product._id, product).catch(console.error);
    }
  }, [product, user, trackProductView]);
  
  // Calculate sticky offset based on header height
  useEffect(() => {
    const computeOffset = () => {
      // Check if we're on desktop
      if (window.innerWidth >= 768) { // md breakpoint
        const headerEl = document.querySelector('header');
        const headerHeight = headerEl ? headerEl.offsetHeight : 0;
        setStickyTopOffset(headerHeight);
      } else {
        // On mobile header is hidden for this page
        setStickyTopOffset(0);
      }
    };

    computeOffset();
    window.addEventListener('resize', computeOffset);
    return () => window.removeEventListener('resize', computeOffset);
  }, []);
  
  // Scroll detection states for sticky mini navbar
  const [showStickyNavbar, setShowStickyNavbar] = useState(false);
  const [showStickyBreadcrumb, setShowStickyBreadcrumb] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollingUp, setScrollingUp] = useState(false);
  
  // Mobile sticky reserve button state - shows when scrolling past product info bar
  const [showMobileStickyReserve, setShowMobileStickyReserve] = useState(false);
  const productInfoRef = useRef(null);

  // Calculate current cart quantity - ensure it updates when cart changes
  const currentCartQuantity = useMemo(() => {
    if (!product?._id) return 0;
    return getItemQuantity(product._id);
  }, [product?._id, getItemQuantity, cartItems]);
  
  // Debug cart state
  useEffect(() => {
    if (product) {
      console.log('🔍 ProductDisplayPage - Cart State Debug:', {
        productId: product._id,
        urlProductId: productId,
        currentCartQuantity,
        isLoading,
        cartItemsLength: cartItems.length,
        shouldShowQuantity: currentCartQuantity > 0
      });
    }
  }, [product, productId, currentCartQuantity, isLoading, cartItems]);

  // Generate consistent random rating for each product based on product ID
  const getProductRating = (productId) => {
    if (!productId) return { rating: 4.5, percentage: 85 };
    
    // Simple hash function to generate consistent "random" numbers from product ID
    let hash = 0;
    for (let i = 0; i < productId.length; i++) {
      const char = productId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Use hash to generate rating between 4.0-5.0 and percentage between 80-100
    const rating = (4.0 + (Math.abs(hash) % 100) / 100).toFixed(1);
    const percentage = 80 + (Math.abs(hash * 7) % 21); // 80-100%
    
    return { 
      rating: parseFloat(rating), 
      percentage: Math.floor(percentage) 
    };
  };

  const productRating = product ? getProductRating(product._id) : { rating: 4.5, percentage: 85 };

  // Deterministic rating count like "3.9K" for display purposes
  const getRatingCount = (productId) => {
    if (!productId) return '3.9K';
    let hash = 0;
    for (let i = 0; i < productId.length; i++) {
      hash = ((hash << 5) - hash) + productId.charCodeAt(i);
      hash |= 0; // 32-bit
    }
    const base = Math.abs(hash % 9000) + 1000; // 1,000 - 9,999
    // Format to X.XK (e.g., 3950 -> 4.0K)
    const k = (base / 1000).toFixed(1);
    return `${k.replace(/\.0$/, '')}K`;
  };
  const ratingCountDisplay = product ? getRatingCount(product._id) : '3.9K';

  // Validate MongoDB ObjectId format
  const isValidObjectId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  };

  // Track retry attempts and error state
  const [retryCount, setRetryCount] = useState(0);
  const [productError, setProductError] = useState(null);
  const maxRetries = 3;
  
  // Fetch Recently Viewed when user is available
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

  // Fetch products from the same category via Redux keyed list
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

  // Auto-sliding functionality for multiple images - smooth and slow
  useEffect(() => {
    if (product && product.images && product.images.length > 1 && !isHoveringImage) {
      const interval = setInterval(() => {
        setSelectedImageIndex((prevIndex) => 
          (prevIndex + 1) % product.images.length
        );
      }, 4000); // Change image every 4 seconds for smooth, slow experience

      return () => clearInterval(interval);
    }
  }, [product?.images, isHoveringImage]);

  // Initialize sticky states on component mount
  useEffect(() => {
    // Force hide the sticky desktop bar on initial load
    setShowStickyNavbar(false);
    
    // Check if we need to show the mobile sticky bar on initial load
    if (window.innerWidth < 768) {
      const reserveVisible = isElementInViewport(reserveButtonMobileRef);
      setShowMobileStickyReserve(!reserveVisible);
    }
  }, [reserveButtonMobileRef]);
  
  // Scroll/resize detection for sticky elements (desktop top bar, mobile bottom CTA)
  useEffect(() => {
    const handleScroll = () => {
      const isMobile = window.innerWidth < 768;
      
      // Check if we're at the top of the page
      const isAtTop = window.scrollY <= 10;

      // Desktop/tablet: show sticky top bar if main desktop Reserve button is NOT visible AND we've scrolled down
      if (!isMobile) {
        const reserveVisible = isElementInViewport(reserveButtonDesktopRef);
        // Only show sticky bar if we're not at the top of the page AND reserve button is not visible
        const shouldShowNavbar = !isAtTop && !reserveVisible;
        if (shouldShowNavbar !== showStickyNavbar) setShowStickyNavbar(shouldShowNavbar);
        // Ensure mobile sticky hidden
        if (showMobileStickyReserve) setShowMobileStickyReserve(false);
      } else {
        // Mobile: show sticky bottom bar if main mobile Reserve button is NOT visible
        const reserveVisible = isElementInViewport(reserveButtonMobileRef);
        const shouldShowMobileReserve = !reserveVisible;
        if (shouldShowMobileReserve !== showMobileStickyReserve) setShowMobileStickyReserve(shouldShowMobileReserve);
        // Ensure desktop sticky hidden on mobile
        if (showStickyNavbar) setShowStickyNavbar(false);
      }

      // Breadcrumbs are removed in UI; keep hidden
      if (showStickyBreadcrumb) setShowStickyBreadcrumb(false);
      setLastScrollY(window.scrollY);
    };

    // Better throttled scroll listener with debounce
    let scrollTimeout;
    const onScroll = () => {
      // Clear any existing timeout
      if (scrollTimeout) {
        cancelAnimationFrame(scrollTimeout);
      }
      
      // Set a new timeout
      scrollTimeout = requestAnimationFrame(() => {
        handleScroll();
        scrollTimeout = null;
      });
    };

    const onResize = () => handleScroll();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    // Initial check after mount to ensure DOM is ready
    const timeoutId = setTimeout(() => handleScroll(), 100);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [reserveButtonMobileRef, reserveButtonDesktopRef, showStickyNavbar, showStickyBreadcrumb, showMobileStickyReserve]);

  const handleAddToCart = async () => {
    if (!product || totalStock === 0 || isAddingToCart) return;
    setIsAddingToCart(true);
    try {
      await addToCart(product, 1, selectedVariantIndex);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleReserve = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (!product) {
      console.log('❌ No product found');
      return;
    }
    
    const currentQuantity = getItemQuantity(product._id);
    console.log('🔍 Reserve button clicked!');
    console.log('🔍 Current quantity in cart:', currentQuantity);
    console.log('🔍 Product details:', { id: product._id, name: product.name, price: product.price });
    console.log('🔍 Cart items:', cartItems);
    console.log('🔍 User status:', user ? 'logged in' : 'guest');
    
    if (currentQuantity > 0) {
      // Product already in cart - just redirect
      console.log('📦 Product already in cart (quantity:', currentQuantity, '), redirecting to cart');
      try {
        navigate('/cart');
      } catch (navError) {
        console.error('❌ Navigation error:', navError);
        window.location.href = '/cart'; // Fallback navigation
      }
    } else {
      // Product not in cart - add one and redirect
      try {
        console.log('🎯 Product not in cart, adding 1 item...');
  await addToCart(product, 1, selectedVariantIndex);
        
        // Double check the cart was updated
        const newQuantity = getItemQuantity(product._id);
        console.log('✅ Product added successfully! New quantity:', newQuantity);
        console.log('🔄 Navigating to cart...');
        try {
          navigate('/cart');
        } catch (navError) {
          console.error('❌ Navigation error:', navError);
          window.location.href = '/cart'; // Fallback navigation
        }
      } catch (error) {
        console.error('❌ Error reserving product:', error);
        alert('Failed to add product to cart. Please try again.');
      }
    }
  };



  const handleBuyNow = async () => {
    if (!product || totalStock === 0 || isAddingToCart) return;
    try {
      const currentQuantity = getItemQuantity(product._id);
      if (currentQuantity === 0) {
        setIsAddingToCart(true);
        await addToCart(product, 1, selectedVariantIndex);
      }
      navigate('/cart');
    } catch (error) {
      console.error('Error in buy now:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity < 0) return;
    
    try {
      updateQuantity(product._id, newQuantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };



  const handleImageSelect = (index) => {
    setSelectedImageIndex(index);
  };

  const handleImageZoom = () => {
    setIsImageModalOpen(true);
  };

  // Dropdown management functions - ensures only one dropdown is open at a time
  const closeAllDropdowns = () => {
    setIsDescriptionOpen(false);
    setIsCareInstructionsOpen(false);
    setIsDeliveryInfoOpen(false);
  };

  const handleDescriptionToggle = () => {
    if (!isDescriptionOpen) {
      closeAllDropdowns();
      setIsDescriptionOpen(true);
    } else {
      setIsDescriptionOpen(false);
    }
  };

  const handleCareInstructionsToggle = () => {
    if (!isCareInstructionsOpen) {
      closeAllDropdowns();
      setIsCareInstructionsOpen(true);
    } else {
      setIsCareInstructionsOpen(false);
    }
  };

  const handleDeliveryInfoToggle = () => {
    if (!isDeliveryInfoOpen) {
      closeAllDropdowns();
      setIsDeliveryInfoOpen(true);
    } else {
      setIsDeliveryInfoOpen(false);
    }
  };

  // Reserve button matching ProductCard style
  const ReserveCTA = ({ onClick, disabled, label = 'Reserve Yours', small = false, className = '', dataRole }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-role={dataRole}
      className={`group relative rounded-lg overflow-hidden transition-all duration-300 font-semibold ${
        small ? 'py-2 px-3 text-xs' : 'py-3 px-5 text-sm'
      } ${
        disabled
          ? 'bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed'
          : 'bg-white text-black border-2 border-black hover:text-white transform hover:scale-[1.02] active:scale-[0.98] active:text-white touch-manipulation'
      } ${className}`}
    >
      {!disabled && (
        <div className="absolute inset-0 bg-black transform -translate-x-full group-hover:translate-x-0 group-active:translate-x-0 transition-transform duration-300 ease-out"></div>
      )}
      <span className="relative z-10 flex items-center justify-center gap-1.5">
        {disabled ? (
          <>
            {totalStock === 0 ? 'Out of Stock' : 'Unavailable'}
          </>
        ) : (
          <>
            <svg className="w-3 h-3 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110 group-active:rotate-12 group-active:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            <span className="transform transition-all duration-300 group-hover:tracking-wider group-active:tracking-wider">{small ? 'Reserve' : label}</span>
            <svg className="w-3 h-3 transition-all duration-300 group-hover:translate-x-1 group-hover:scale-110 group-active:translate-x-1 group-active:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </>
        )}
      </span>
      {!disabled && (
        <>
          <div className="absolute top-1 right-2 w-1 h-1 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 group-active:opacity-100 group-hover:animate-ping group-active:animate-ping transition-opacity duration-300 delay-100"></div>
          <div className="absolute bottom-1 left-3 w-1 h-1 bg-yellow-300 rounded-full opacity-0 group-hover:opacity-100 group-active:opacity-100 group-hover:animate-ping group-active:animate-ping transition-opacity duration-300 delay-200"></div>
          <div className="absolute top-2 left-1/2 w-0.5 h-0.5 bg-yellow-500 rounded-full opacity-0 group-hover:opacity-100 group-active:opacity-100 group-hover:animate-pulse group-active:animate-pulse transition-opacity duration-300 delay-150"></div>
        </>
      )}
      <div className="absolute inset-0 bg-black opacity-0 group-active:opacity-10 transition-opacity duration-150 rounded-lg md:hidden"></div>
    </button>
  );

  if (loading) {
    return <ProductDisplaySkeleton />;
  }

  if (!product) {
    // Keep showing the skeleton until product is available
    return <ProductDisplaySkeleton />;
  }

  // Set default values for derived properties from the selected variant
  const tracks = !!selectedVariant?.isStockActive;
  const discountedPrice = selectedVariant?.price && selectedVariant?.discount?.value
    ? selectedVariant.price - selectedVariant.discount.value
    : selectedVariant?.price || 0;
  const discountPercentage = selectedVariant?.price && selectedVariant?.discount?.value
    ? Math.round((selectedVariant.discount.value / selectedVariant.price) * 100)
    : 0;
  const totalStock = tracks ? (selectedVariant?.stock || 0) : Number.POSITIVE_INFINITY;

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 relative overflow-hidden"
      style={{ scrollMarginTop: 0, scrollPaddingTop: 0 }}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-pink-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-60 right-20 w-48 h-48 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 left-1/4 w-40 h-40 bg-yellow-200/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>
      {/* Enhanced Sticky Mini Navbar - Desktop only */}
      {product && (
        <div className={`hidden md:block fixed left-0 right-0 z-50 transition-all duration-300 ease-out ${
          showStickyNavbar 
            ? 'translate-y-0 opacity-100' 
            : '-translate-y-full opacity-0'
        }`}
        style={{
          top: stickyTopOffset, // Below header on desktop, top on mobile
          zIndex: 100 // Ensure above page content and header if necessary
        }}>
        {/* Backdrop blur for better visual separation */}
        <div className="bg-white/80 backdrop-blur-lg border-t border-pink-200/50 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 sm:py-3">
            <div className="flex items-center justify-between gap-3 sm:gap-6">
              
              {/* Left: Product Info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Product Thumbnail */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 border border-gray-300 overflow-hidden flex-shrink-0 bg-gray-50 rounded-lg">
                  <MediaDisplay
                    src={product.images?.[selectedImageIndex] || product.images?.[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Product Details - Center on mobile, left-aligned on desktop */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs sm:text-sm font-semibold text-black truncate leading-tight">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm sm:text-base font-bold text-black">
                      ₹{Math.round(discountedPrice)}
                    </span>
                    {discountPercentage > 0 && (
                      <>
                        <span className="text-xs text-gray-500 line-through">
                          ₹{selectedVariant.price}
                        </span>
                        <span className="bg-green-500 text-white px-1.5 py-0.5 text-xs font-bold leading-none rounded">
                          {discountPercentage}% OFF
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Action Buttons */}
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                {/* Favorite Button - avoid nested <button> by using a non-button wrapper */}
                <div
                  className="bg-gray-50 border border-rose-300 h-9 sm:h-10 w-9 sm:w-10 flex items-center justify-center rounded-lg hover:border-rose-500"
                  onClick={(e) => e.stopPropagation()}
                  role="presentation"
                >
                  <FavoriteButton productId={productId} size="md" className="text-rose-500" />
                </div>
                
                {/* Quantity Controls or Add to Cart */}
                {currentCartQuantity > 0 ? (
                  <div className="flex flex-col items-center">
                    <div className="flex items-center bg-gray-50 border border-gray-300 h-9 sm:h-10 rounded-lg">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuantityChange(currentCartQuantity - 1);
                      }}
                      disabled={isAddingToCart}
                      className="w-8 sm:w-9 h-full flex items-center justify-center text-black hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-l-lg"
                    >
                      <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    <span className="px-2 sm:px-3 text-black font-semibold text-sm min-w-[2rem] text-center">
                      {isAddingToCart ? '...' : currentCartQuantity}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuantityChange(currentCartQuantity + 1);
                      }}
                      disabled={(tracks && currentCartQuantity >= totalStock) || isAddingToCart}
                      className="w-8 sm:w-9 h-full flex items-center justify-center text-black hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg"
                    >
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    </div>
                    {tracks && currentCartQuantity >= totalStock && (
                      <div className="text-[10px] text-gray-600 mt-1">Max stock reached</div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    disabled={!product?.isActive || (tracks && totalStock === 0) || isAddingToCart}
                    className={`btn-premium-outline px-3 sm:px-5 py-2 text-xs font-medium h-9 sm:h-10 ${
                      !product?.isActive || (tracks && totalStock === 0)
                        ? 'opacity-50 cursor-not-allowed'
                        : isAddingToCart
                        ? 'cursor-wait'
                        : ''
                    }`}
                  >
                    {isAddingToCart ? (
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent animate-spin"></div>
                        <span className="hidden sm:inline">Adding...</span>
                      </div>
                    ) : (
                      'Add to Box'
                    )}
                  </button>
                )}

                {/* Prominent Reserve Yours Button */}
                <ReserveCTA
                  onClick={handleReserve}
                  disabled={!product?.isActive || (tracks && totalStock === 0)}
                  label="Reserve Yours"
                  small
                  className="h-9 sm:h-10 px-3 sm:px-5"
                  dataRole="sticky-reserve"
                />
              </div>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Mobile Layout with Gradient Background and Glassmorphism Cards */}
      <div className="md:hidden min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
        {/* Mobile Image Display */}
        <div className="relative w-full">
          <div className="relative w-full overflow-hidden">
            <div 
              className="relative w-full aspect-square cursor-pointer group"
              onClick={handleImageZoom}
            >
              <MediaDisplay
                src={product.images?.[selectedImageIndex] || product.images?.[0]}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              
              {/* Navigation Controls - Back Arrow and Search */}
              <div className="absolute top-3 left-3 z-10">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(-1);
                  }}
                  className="w-10 h-10 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center shadow-xl border border-white/30 hover:bg-white/30 transition-all duration-300"
                >
                  <ArrowLeft className="w-5 h-5 text-white drop-shadow-lg" />
                </button>
              </div>
              
              {/* Search and Share Icons */}
              <div className="absolute top-3 right-3 flex gap-2 z-10">
                
                <button 
                  onClick={(e) => e.stopPropagation()}
                  className="w-10 h-10 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center shadow-xl border border-white/30 hover:bg-white/30 transition-all duration-300"
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-lg">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                      <polyline points="16 6 12 2 8 6"></polyline>
                      <line x1="12" y1="2" x2="12" y2="15"></line>
                    </svg>
                  </div>
                </button>
              </div>
            </div>
            
            {/* Image dots indicator for multiple images */}
            {product.images && product.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
                {product.images.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === selectedImageIndex
                        ? 'bg-white scale-110'
                        : 'bg-white/50 hover:bg-white/80'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Product Info Cards with Glassmorphism */}
        <div className="bg-gradient-to-br from-pink-50 via-white to-purple-50 px-4 pb-6 space-y-4">
          {/* Product Info Card (Glassmorphism) */}
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/30" ref={productInfoRef}>
            {/* Product Title and Quantity */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-yellow-600 leading-tight flex-1">
                    {product.name}
                  </h1>
                  <div className="flex-shrink-0">
                    <FavoriteButton 
                      productId={productId} 
                      size="md" 
                      className="bg-white/80 rounded-full p-1.5 shadow-sm hover:shadow-md transition-shadow duration-200" 
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2 font-medium">Net Qty: Serves 1</p>
              </div>

            </div>

            {/* Price Row - mobile matches reference */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold text-gray-900">
                ₹{Math.round(discountedPrice)}
              </span>
              {discountPercentage > 0 && (
                <>
                  <span className="text-base text-gray-500 line-through">
                    ₹{selectedVariant.price}
                  </span>
                  <span className="text-green-600 text-lg font-semibold">
                    {discountPercentage}% Off
                  </span>
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-gray-300 text-gray-500 text-[10px]" title="Offer details">
                    i
                  </span>
                </>
              )}
            </div>

            {/* Rating chip below price */}
            <div className="mb-3">
              <div className="inline-flex items-center gap-2 bg-white border border-gray-300 rounded-full px-2.5 py-1 shadow-sm">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-600 text-white text-[10px] leading-none">★</span>
                <span className="text-sm font-medium text-gray-900">{productRating.rating}</span>
                <span className="text-sm text-gray-600">|</span>
                <span className="text-sm text-gray-600">{ratingCountDisplay}</span>
              </div>
            </div>

            {/* Delivery Time */}
            <div className="flex items-center text-green-600 text-sm font-medium">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              <span>Estimated Delivery Time: 6 mins</span>
            </div>

            {/* Dietary Indicators - mobile pills */}
            <div className="flex items-center gap-2 mt-3">
              {/* WITH EGG */}
              <div
                className={`flex items-center gap-2 rounded-[14px] px-3 py-1.5 border ${
                  product.hasEgg ? 'border-black bg-amber-50' : 'border-gray-300 bg-white'
                }`}
                role="img"
                aria-label="With egg indicator"
              >
                <span className="w-5 h-5 grid place-items-center rounded-md border border-red-600 bg-red-50">
                  <span className="w-0 h-0 border-l-[5px] border-r-[5px] border-b-[8px] border-l-transparent border-r-transparent border-b-orange-600"></span>
                </span>
                <span className="text-xs  text-gray-900">WITH EGG</span>
              </div>

              {/* EGGLESS */}
              <div
                className={`flex items-center gap-2 rounded-[14px] px-3 py-1.5 border ${
                  !product.hasEgg ? 'border-black bg-green-50' : 'border-gray-300 bg-white'
                }`}
                role="img"
                aria-label="Eggless indicator"
              >
                <span className="w-5 h-5 grid place-items-center rounded-md border-2 border-green-700 bg-white">
                  <span className="w-3 h-3 rounded-full bg-green-700"></span>
                </span>
                <span className="text-xs  text-gray-900">EGGLESS</span>
              </div>
            </div>
          </div>

          {/* Feature Row (Icons in White Card) */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Features</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* No Return or Exchange */}
              <div className="flex flex-col items-center text-center p-3 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-sm transition-all">
                <div className="w-8 h-8 mb-2 flex items-center justify-center bg-white rounded-full shadow-sm">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728z" />
                  </svg>
                </div>
                <span className="text-xs text-gray-600 font-medium">No Return Or Exchange</span>
              </div>

              {/* Fast Delivery */}
              <div className="flex flex-col items-center text-center p-3 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-sm transition-all">
                <div className="w-8 h-8 mb-2 flex items-center justify-center bg-white rounded-full shadow-sm">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-xs text-gray-600 font-medium">Fast Delivery</span>
              </div>
            </div>
          </div>

          {/* Highlights Section */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-900">Highlights</h3>
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </div>
            
            <div className="space-y-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div className="flex justify-between py-2 px-2">
                <span className="text-sm text-gray-500">Key Features</span>
                <span className="text-sm text-gray-900 text-right flex-1 ml-4">A rich cheesy double egg delight packed into a soft golden bun breakfast lunch or anytime fuel</span>
              </div>
              <div className="flex justify-between py-2 px-2 border-t border-gray-100">
                <span className="text-sm text-gray-500">Dietary Preference</span>
                <span className="text-sm text-gray-900">
                  {product.hasEgg ? 'With Egg' : 'Eggless'}
                </span>
              </div>
            </div>
          </div>

          {/* Information Section (Expandable) */}
          <div className="bg-white rounded-lg shadow-sm">
            <button
              onClick={handleDescriptionToggle}
              className="w-full px-4 py-4 flex items-center justify-between text-left"
            >
              <div className="flex items-center">
                <div className="w-5 h-5 mr-2 flex items-center justify-center bg-gray-100 rounded-full">
                  <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-900">Product Description</h3>
              </div>
              {isDescriptionOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {isDescriptionOpen && (
              <div className="px-4 pb-4 border-t border-gray-100">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 mt-3">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {product.description}
                  </p>
                </div>
                
                {/* Additional product details */}
                {(product.importantField?.name || Object.keys(product.extraFields || {}).length > 0) && (
                  <div className="mt-4 space-y-0 bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
                    {selectedVariant.quantity && (
                      <div className="flex justify-between py-2 px-3 border-b border-gray-200">
                        <span className="text-sm text-gray-500">Weight:</span>
                        <span className="text-sm text-gray-900">{selectedVariant.quantity}{selectedVariant.measuringUnit}</span>
                      </div>
                    )}
                    {product.importantField?.name && (
                      <div className="flex justify-between py-2 px-3 border-b border-gray-200">
                        <span className="text-sm text-gray-500">{product.importantField.name}:</span>
                        <span className="text-sm text-gray-900">{product.importantField.value}</span>
                      </div>
                    )}
                    {Object.entries(product.extraFields || {}).map(([key, value], index, arr) => (
                      <div key={key} className={`flex justify-between py-2 px-3 ${index < arr.length - 1 ? 'border-b border-gray-200' : ''}`}>
                        <span className="text-sm text-gray-500">{key}:</span>
                        <span className="text-sm text-gray-900">{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Care Instructions Section - Mobile */}
          <div className="bg-white rounded-lg shadow-sm">
            <button
              onClick={handleCareInstructionsToggle}
              className="w-full px-4 py-4 flex items-center justify-between text-left"
            >
              <div className="flex items-center">
                <div className="w-5 h-5 mr-2 flex items-center justify-center bg-gray-100 rounded-full">
                  <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-900">Care Instructions</h3>
              </div>
              {isCareInstructionsOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {isCareInstructionsOpen && (
              <div className="px-4 pb-4 border-t border-gray-100">
                <div className="mt-3 space-y-2 bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                    <span className="text-xs text-gray-700">Store cream cakes in a refrigerator. Fondant cakes should be stored in an air conditioned environment.</span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                    <span className="text-xs text-gray-700">Slice and serve the cake at room temperature and make sure it is not exposed to heat.</span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                    <span className="text-xs text-gray-700">Use a serrated knife to cut a fondant cake.</span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                    <span className="text-xs text-gray-700">Sculptural elements and figurines may contain wire supports or toothpicks or wooden skewers for support.</span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                    <span className="text-xs text-gray-700">Please check the placement of these items before serving to small children.</span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                    <span className="text-xs text-gray-700">The cake should be consumed within 24 hours.</span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                    <span className="text-xs text-gray-700">Enjoy your cake!</span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <p className="text-xs font-medium text-gray-900 mb-2 px-1">Manufacturer Details:</p>
                  <div className="space-y-1 bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                      <span className="text-xs text-gray-700">Ferns N Petals Private Limited</span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                      <span className="text-xs text-gray-700">Address: FNP Estate, Ashram Marg, Mandi Road, Gadaipur, South Delhi, Delhi, 110030</span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                      <span className="text-xs text-gray-700">FSSAI License No. 10019011006502</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Delivery Information Section - Mobile */}
          <div className="bg-white rounded-lg shadow-sm">
            <button
              onClick={handleDeliveryInfoToggle}
              className="w-full px-4 py-4 flex items-center justify-between text-left"
            >
              <div className="flex items-center">
                <div className="w-5 h-5 mr-2 flex items-center justify-center bg-gray-100 rounded-full">
                  <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-.293-.707L15 4.586A1 1 0 0014.414 4H14v3z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-900">Delivery Information</h3>
              </div>
              {isDeliveryInfoOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {isDeliveryInfoOpen && (
              <div className="px-4 pb-4 border-t border-gray-100">
                <div className="mt-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <p className="text-xs text-gray-700">We offer fast and reliable delivery services to ensure your orders reach you fresh and on time. Our delivery options include same-day delivery for orders placed before 2 PM and free delivery on orders above ₹500.</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons for Mobile - Horizontal pair */}
          <div className="pt-2">
            <div className="flex items-stretch gap-3">
              {/* Left: Add/Quantity */}
              <div className="flex-1">
                {currentCartQuantity > 0 ? (
                  <>
                  <div className="w-full h-[2.25rem] flex items-center justify-between bg-white border border-gray-300 rounded-lg px-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleQuantityChange(currentCartQuantity - 1); }}
                      className="w-7 h-7 flex items-center justify-center text-black transition-colors border border-gray-300 hover:bg-gray-100 rounded"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm font-semibold text-black min-w-[2rem] text-center">{currentCartQuantity}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleQuantityChange(currentCartQuantity + 1); }}
                      disabled={tracks && currentCartQuantity >= totalStock}
                      className="w-7 h-7 flex items-center justify-center text-black transition-colors border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 rounded"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {tracks && currentCartQuantity >= totalStock && (
                    <div className="text-[10px] text-gray-600 mt-1">Max stock reached</div>
                  )}
                  </>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    disabled={isAddingToCart || (tracks && totalStock === 0)}
                    className={`w-full btn-premium-outline btn-sm-compact font-medium flex items-center justify-center gap-2 ${
                      isAddingToCart || (tracks && totalStock === 0) ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  >
                    {isAddingToCart ? (
                      <div className="inline-block h-3.5 w-3.5 animate-spin border-2 border-black border-t-transparent"></div>
                    ) : (
                      <ShoppingCart className="w-4 h-4 text-gold-soft" />
                    )}
                    <span>{isAddingToCart ? 'Adding...' : (tracks && totalStock === 0) ? 'Out of Stock' : 'Add to Box'}</span>
                  </button>
                )}
              </div>

              {/* Right: Reserve/Buy Now */}
              <div className="flex-1" ref={reserveButtonMobileRef}>
                <ReserveCTA
                  onClick={handleReserve}
                  disabled={tracks && totalStock === 0}
                  label="Reserve Yours"
                  small
                  className="w-full btn-sm-compact"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recently Viewed / Similar Products - Mobile */}
      {(recentlyViewed.length > 0 || sameCategoryProducts.length > 0) && (
        <section className="md:hidden mt-6 px-4 pb-8">
          <div className="text-center mb-6 border-b border-gray-200 pb-4">
            <h2 className="text-xl font-semibold mb-1" style={{
              background: 'linear-gradient(135deg, #e0a47d 0%, #c17e5b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0px 0px 1px rgba(224, 164, 125, 0.2)'
            }}>
              {user && recentlyViewed.length > 0 ? 'Recently Viewed' : 'You Might Also Like'}
            </h2>
            <p className="text-gray-600 text-sm">
              {user && recentlyViewed.length > 0
                ? "Products you've looked at recently"
                : `More delicious ${product?.category?.name || 'products'} for you`}
            </p>
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-4">
            {(user && recentlyViewed.length > 0 ? recentlyViewed : sameCategoryProducts).map((item) => {
              const productToShow = item.productId || item;
              if (!productToShow || !productToShow._id) return null;
              return (
                <ProductCard key={productToShow._id} product={productToShow} />
              );
            })}
          </div>
        </section>
      )}

      {/* Mobile Sticky Product Bar - always mounted for slide animation */}
      <div
        className={`fixed bottom-16 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200 shadow-lg transform transition-transform duration-300 ease-out ${
          showMobileStickyReserve ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px))' }}
      >
          <div className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              {/* Left: Product Info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 border border-gray-300 overflow-hidden flex-shrink-0 bg-gray-50 rounded-lg">
                  <MediaDisplay
                    src={product.images?.[selectedImageIndex] || product.images?.[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-semibold text-yellow-600 truncate leading-tight">{product.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-bold text-black">₹{Math.round(discountedPrice)}</span>
                    {discountPercentage > 0 && (
                      <>
                        <span className="text-[11px] text-gray-500 line-through">₹{selectedVariant.price}</span>
                        <span className=" text-green-500 px-1 py-0.5 text-[10px] font-bold leading-none rounded">{discountPercentage}% OFF</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-stretch gap-2 flex-shrink-0">
                {currentCartQuantity > 0 ? (
                  <div className="flex flex-col items-center">
                    <div className="flex items-center bg-gray-50 border border-gray-300 h-7 rounded-lg">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleQuantityChange(currentCartQuantity - 1); }}
                      className="w-8 h-full flex items-center justify-center text-black hover:bg-gray-100 transition-colors rounded-l-lg"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-2 text-black font-semibold text-sm min-w-[2rem] text-center">{currentCartQuantity}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleQuantityChange(currentCartQuantity + 1); }}
                      disabled={tracks && currentCartQuantity >= totalStock}
                      className="w-8 h-full flex items-center justify-center text-black hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    </div>
                    {tracks && currentCartQuantity >= totalStock && (
                      <div className="text-[10px] text-gray-600 mt-1">Max stock reached</div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    disabled={!product?.isActive || (tracks && totalStock === 0) || isAddingToCart}
                    className={`bg-white border border-gray-300 px-4 h-10 text-sm font-medium rounded-lg flex items-center justify-center leading-none box-border appearance-none whitespace-nowrap select-none ${
                      !product?.isActive || (tracks && totalStock === 0)
                        ? 'opacity-50 cursor-not-allowed text-gray-400'
                        : isAddingToCart
                        ? 'cursor-wait text-gray-600'
                        : 'text-black hover:bg-gray-50'
                    }`}
                  >
                    {isAddingToCart ? 'Adding...' : 'Add'}
                  </button>
                )}
                <button
                  onClick={handleBuyNow}
                  disabled={!product?.isActive || (tracks && totalStock === 0)}
                  className={`px-4 h-10 text-sm font-medium rounded-lg flex items-center justify-center leading-none box-border appearance-none whitespace-nowrap select-none border ${
                    !product?.isActive || totalStock === 0
                      ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                      : 'bg-black text-white hover:bg-gray-800 border-transparent'
                  }`}
                >
                  Reserve
                </button>
              </div>
            </div>
          </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block">
        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Image Gallery */}
          <div className="lg:col-span-7">
            {/* Desktop Image Display Layout - Bounded sticky so sections below don't overlap */}
            <div className="relative">
              <div className="flex gap-4">
              {/* Thumbnail Images - Left Side */}
              {product.images && product.images.length > 1 && (
                <div className="flex flex-col gap-2 w-20 md:w-24 max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => handleImageSelect(index)}
                      className={`aspect-square border-2 transition-all overflow-hidden hover:scale-105 flex-shrink-0 rounded-lg ${
                        index === selectedImageIndex
                          ? 'border-black shadow-lg'
                          : 'border-gray-300 hover:border-gray-500'
                      }`}

                    >
                      <MediaDisplay
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
              
              {/* Main Image - Right Side */}
              <div className="flex-1">
                <div className="relative bg-white/70 backdrop-blur-lg border border-pink-200/50 rounded-2xl shadow-xl">
                  <div 
                    className="aspect-square cursor-pointer group relative overflow-hidden rounded-2xl"
                    onClick={handleImageZoom}
                    onMouseEnter={() => setIsHoveringImage(true)}
                    onMouseLeave={() => setIsHoveringImage(false)}
                  >
                    <MediaDisplay
                      src={product.images?.[selectedImageIndex] || product.images?.[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      style={{
                        opacity: 1
                      }}
                    />
                    
                    {/* Zoom icon always visible */}
                    <div className="absolute inset-0 bg-black bg-opacity-5 transition-all flex items-center justify-center">
                      <ZoomIn className="w-8 h-8 text-white opacity-70" />
                    </div>
                    
                    {/* Stock Status */}
                    {tracks && totalStock === 0 && (
                      <div className="absolute top-4 right-4 bg-black text-white px-3 py-1 text-sm rounded-lg">
                        Out of Stock
                      </div>
                    )}
                  </div>
                </div>
              </div>
              </div>
            </div>
            {/* Moved info sections below the image for large devices */}
            <div className="mt-6 space-y-4">
              {/* Highlights Section */}
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-pink-200/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Highlights</h3>
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </div>
                
                <div className="space-y-4 bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <div className="flex justify-between py-3 px-2">
                    <span className="text-sm text-gray-600 font-medium">Key Features</span>
                    <span className="text-sm text-gray-800 text-right flex-1 ml-6">A rich cheesy double egg delight packed into a soft golden bun breakfast lunch or anytime fuel</span>
                  </div>
                  <div className="flex justify-between py-3 px-2 border-t border-gray-200">
                    <span className="text-sm text-gray-600 font-medium">Dietary Preference</span>
                    <span className="text-sm text-gray-800">
                      {product.hasEgg ? 'With Egg' : 'Eggless'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Information Section (Expandable) */}
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-pink-200/50">
                <button
                  onClick={handleDescriptionToggle}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-pink-50/50 transition-colors rounded-2xl"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 mr-3 flex items-center justify-center bg-gray-100 rounded-full shadow-sm">
                      <svg className="w-4 h-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-base font-medium text-gray-900">Product Description</h3>
                  </div>
                  {isDescriptionOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>
                {isDescriptionOpen && (
                  <div className="px-6 pb-6 border-t border-gray-100">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 mt-4">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {product.description}
                      </p>
                    </div>
                    
                    {/* Additional product details */}
                    {(product.importantField?.name || Object.keys(product.extraFields || {}).length > 0) && (
                      <div className="mt-6 space-y-0 bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
                        {selectedVariant.quantity && (
                          <div className="flex justify-between py-3 px-4 border-b border-gray-200">
                            <span className="text-sm text-gray-600 font-medium">Weight:</span>
                            <span className="text-sm text-gray-800 font-medium">{selectedVariant.quantity}{selectedVariant.measuringUnit}</span>
                          </div>
                        )}
                        {product.importantField?.name && (
                          <div className="flex justify-between py-3 px-4 border-b border-gray-200">
                            <span className="text-sm text-gray-600 font-medium">{product.importantField.name}:</span>
                            <span className="text-sm text-gray-800 font-medium">{product.importantField.value}</span>
                          </div>
                        )}
                        {Object.entries(product.extraFields || {}).map(([key, value]) => (
                          <div key={key} className="flex justify-between py-3 px-4 border-b border-gray-200 last:border-b-0">
                            <span className="text-sm text-gray-600 font-medium">{key}:</span>
                            <span className="text-sm text-gray-800 font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Care Instructions Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <button
                  onClick={handleCareInstructionsToggle}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 mr-3 flex items-center justify-center bg-gray-100 rounded-full shadow-sm">
                      <svg className="w-4 h-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-base font-medium text-gray-900">Care Instructions</h3>
                  </div>
                  {isCareInstructionsOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>
                {isCareInstructionsOpen && (
                  <div className="px-6 pb-6 border-t border-gray-100">
                    <div className="mt-4 space-y-3 bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <div className="flex items-start">
                        <span className="w-2.5 h-2.5 bg-gray-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-sm text-gray-700">Store cream cakes in a refrigerator. Fondant cakes should be stored in an air conditioned environment.</span>
                      </div>
                      <div className="flex items-start">
                        <span className="w-2.5 h-2.5 bg-gray-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-sm text-gray-700">Slice and serve the cake at room temperature and make sure it is not exposed to heat.</span>
                      </div>
                      <div className="flex items-start">
                        <span className="w-2.5 h-2.5 bg-gray-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-sm text-gray-700">Use a serrated knife to cut a fondant cake.</span>
                      </div>
                      <div className="flex items-start">
                        <span className="w-2.5 h-2.5 bg-gray-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-sm text-gray-700">Sculptural elements and figurines may contain wire supports or toothpicks or wooden skewers for support.</span>
                      </div>
                      <div className="flex items-start">
                        <span className="w-2.5 h-2.5 bg-gray-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-sm text-gray-700">Please check the placement of these items before serving to small children.</span>
                      </div>
                      <div className="flex items-start">
                        <span className="w-2.5 h-2.5 bg-gray-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-sm text-gray-700">The cake should be consumed within 24 hours.</span>
                      </div>
                      <div className="flex items-start">
                        <span className="w-2.5 h-2.5 bg-gray-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-sm text-gray-700">Enjoy your cake!</span>
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-gray-100">
                      <p className="text-sm font-medium text-gray-900 mb-3">Manufacturer Details:</p>
                      <div className="space-y-2 bg-gray-50 rounded-lg p-4 border border-gray-100">
                        <div className="flex items-start">
                          <span className="w-2.5 h-2.5 bg-gray-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <span className="text-sm text-gray-700">Ferns N Petals Private Limited</span>
                        </div>
                        <div className="flex items-start">
                          <span className="w-2.5 h-2.5 bg-gray-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <span className="text-sm text-gray-700">Address: FNP Estate, Ashram Marg, Mandi Road, Gadaipur, South Delhi, Delhi, 110030</span>
                        </div>
                        <div className="flex items-start">
                          <span className="w-2.5 h-2.5 bg-gray-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <span className="text-sm text-gray-700">FSSAI License No. 10019011006502</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Delivery Information Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <button
                  onClick={handleDeliveryInfoToggle}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 mr-3 flex items-center justify-center bg-gray-100 rounded-full shadow-sm">
                      <svg className="w-4 h-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                        <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-.293-.707L15 4.586A1 1 0 0014.414 4H14v3z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-medium text-gray-900">Delivery Information</h3>
                  </div>
                  {isDeliveryInfoOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>
                {isDeliveryInfoOpen && (
                  <div className="px-6 pb-6 border-t border-gray-100">
                    <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <p className="text-sm text-gray-700 leading-relaxed">We offer fast and reliable delivery services to ensure your orders reach you fresh and on time. Our delivery options include same-day delivery for orders placed before 2 PM and free delivery on orders above ₹500.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Product Information - Right Side with Layered Design */}
          <div className="lg:col-span-5">
            <div className="space-y-4">
              
              {/* Product Info Card (White Block) */}
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 border border-pink-200/50">
                {/* Product Title and Quantity */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <h1 className="text-2xl md:text-3xl font-medium leading-tight text-yellow-600 flex-1">
                        {product.name}
                      </h1>
                      <div className="flex-shrink-0">
                        <FavoriteButton 
                          productId={productId} 
                          size="lg" 
                          className="bg-white/90 p-2  transition-all duration-200" 
                        />
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Net Qty: Serves 1</p>
                  </div>

                </div>

                {/* Price Row (matches reference) */}
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl font-bold text-gray-900">
                    ₹{Math.round(discountedPrice)}
                  </span>
                  {discountPercentage > 0 && (
                    <>
                      <span className="text-lg text-gray-500 line-through">
                        ₹{selectedVariant.price}
                      </span>
                      <span className="text-green-600 text-xl font-semibold">
                        {discountPercentage}% Off
                      </span>
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-gray-300 text-gray-500" title="Offer details">
                        i
                      </span>
                    </>
                  )}
                </div>

                {/* Rating chip below price */}
                <div className="mb-4">
                  <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-pink-200/50 rounded-full px-3 py-1">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-600 text-white">★</span>
                    <span className="text-sm font-medium text-gray-900">{productRating.rating}</span>
                    <span className="text-sm text-gray-600">|</span>
                    <span className="text-sm text-gray-600">{ratingCountDisplay}</span>
                  </div>
                </div>

                {/* Delivery Time */}
                <div className="flex items-center text-green-600 text-base font-medium">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                  <span>Estimated Delivery Time: 6 mins</span>
                </div>

                {/* Dietary Indicators - show both options like reference UI */}
                <div className="flex items-center gap-3 mt-4">
                  {/* WITH EGG pill */}
                  <div
                    className={`flex items-center gap-2 rounded-[14px] px-4 py-2 border ${
                      product.hasEgg ? 'border-black bg-red-100' : 'border-gray-300 bg-white'
                    }`}
                    role="img"
                    aria-label="With egg indicator"
                  >
                    <span className="w-5 h-5 grid place-items-center rounded-md border border-red-600 bg-red-50">
                      <span className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[9px] border-l-transparent border-r-transparent border-b-red-600"></span>
                    </span>
                    <span className="text-sm text-gray-900">WITH EGG</span>
                  </div>

                  {/* EGGLESS pill */}
                  <div
                    className={`flex items-center gap-2 rounded-[14px] px-4 py-2 border ${
                      !product.hasEgg ? 'border-black bg-green-50' : 'border-gray-300 bg-white'
                    }`}
                    role="img"
                    aria-label="Eggless indicator"
                  >
                    <span className="w-5 h-5 grid place-items-center rounded-md border-2 border-green-700 bg-white">
                      <span className="w-3 h-3 rounded-full bg-green-700"></span>
                    </span>
                    <span className="text-sm text-gray-900">EGGLESS</span>
                  </div>
                </div>
              </div>

              {/* Feature Row (Icons in White Card) */}
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 border border-pink-200/50 mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Features</h3>
                <div className="grid grid-cols-2 gap-6">
                  {/* No Return or Exchange */}
                  <div className="flex flex-col items-center text-center p-5 bg-white/50 backdrop-blur-sm rounded-xl border border-pink-200/30 hover:scale-105 transition-all">
                    <div className="w-12 h-12 mb-3 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full">
                      <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728z" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-700 font-medium">No Return Or Exchange</span>
                  </div>

                  {/* Fast Delivery */}
                  <div className="flex flex-col items-center text-center p-5 bg-white/50 backdrop-blur-sm rounded-xl border border-pink-200/30 hover:scale-105 transition-all">
                    <div className="w-12 h-12 mb-3 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full">
                      <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-700 font-medium">Fast Delivery</span>
                  </div>
                </div>
              </div>


              {/* Variant Selection and Action Buttons */}
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 space-y-6 border border-pink-200/50 mb-4">
              
                {/* Variant Selection */}
                {product.variants && product.variants.length > 1 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">
                      Available Sizes
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {product.variants.map((variant, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedVariantIndex(index)}
                          className={`p-3 text-center transition-all border rounded-lg ${
                            index === selectedVariantIndex
                              ? 'bg-black text-white border-black'
                              : 'bg-white border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {/* Product Image */}
                          <div className="mb-2">
                            <MediaDisplay
                              src={product.images?.[0] || product.images?.[index] || '/placeholder-image.jpg'}
                              alt={`${product.name} ${variant.quantity}${variant.measuringUnit}`}
                              className="w-full h-20 object-cover rounded-md"
                            />
                          </div>
                          
                          <div className="text-sm font-medium">
                            {variant.quantity}{variant.measuringUnit}
                          </div>
                          <div className="text-xs opacity-75">
                            ₹{variant.price}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons - Horizontal pair on desktop */}
                <div className="flex items-stretch gap-3">
                  <div className="flex-1">
                    {currentCartQuantity > 0 ? (
                      <>
                      <div className="w-full h-12 flex items-center justify-between bg-white border border-gray-300 rounded-lg px-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleQuantityChange(currentCartQuantity - 1); }}
                          className="w-9 h-9 flex items-center justify-center text-black transition-colors border border-gray-300 hover:bg-gray-100 rounded"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-base font-semibold text-black min-w-[2.25rem] text-center">{currentCartQuantity}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleQuantityChange(currentCartQuantity + 1); }}
                          disabled={currentCartQuantity >= totalStock}
                          className="w-9 h-9 flex items-center justify-center text-black transition-colors border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 rounded"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      {tracks && currentCartQuantity >= totalStock && (
                        <div className="text-[11px] text-gray-600 mt-1">Max stock reached</div>
                      )}
                      </>
                    ) : (
                      <button
                        onClick={handleAddToCart}
                        disabled={isAddingToCart || totalStock === 0}
                        className={`w-full btn-premium-outline font-medium py-3 px-5 flex items-center justify-center gap-2 text-sm ${
                          isAddingToCart || totalStock === 0 ? 'opacity-60 cursor-not-allowed' : ''
                        }`}
                      >
                        {isAddingToCart ? (
                          <div className="inline-block h-4 w-4 animate-spin border-2 border-black border-t-transparent"></div>
                        ) : (
                          <ShoppingCart className="w-5 h-5 text-gold-soft" />
                        )}
                        Add to Box
                      </button>
                    )}
                  </div>
                  <div className="flex-1" ref={reserveButtonDesktopRef}>
                    <ReserveCTA
                      onClick={handleReserve}
                      disabled={totalStock === 0}
                      label="Reserve Yours"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recently Viewed / Similar Products - Desktop */}
        {(recentlyViewed.length > 0 || sameCategoryProducts.length > 0) && (
          <section className="mt-16">
            <div className="text-center mb-8 border-b border-pink-200/50 pb-6">
              <h2 className="text-2xl font-semibold mb-2" style={{ 
                background: 'linear-gradient(135deg, #e0a47d 0%, #c17e5b 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0px 0px 1px rgba(224, 164, 125, 0.2)'
              }}>
                {user && recentlyViewed.length > 0 ? "Recently Viewed" : "You Might Also Like"}
              </h2>
              <p className="text-gray-600">
                {user && recentlyViewed.length > 0 
                  ? "Products you've looked at recently" 
                  : `More delicious ${product?.category?.name || 'products'} for you`}
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {(user && recentlyViewed.length > 0 ? recentlyViewed : sameCategoryProducts).map((item, index) => {
                const productToShow = item.productId || item;
                
                if (!productToShow || !productToShow._id) {
                  return null;
                }

                return (
                  <div key={productToShow._id}>
                    <ProductCard
                      product={productToShow}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        )}
        </div>
      </div>

      {/* Image Modal */}
      {isImageModalOpen && (
        <ProductImageModal
          isOpen={isImageModalOpen}
          images={product.images || []}
          initialIndex={selectedImageIndex}
          onClose={() => setIsImageModalOpen(false)}
        />
      )}

      {/* Debug Panel - Development Only */}
      <ProductDebugPanel productId={productId} />

    </div>
  );
};

export default ProductDisplayPage;