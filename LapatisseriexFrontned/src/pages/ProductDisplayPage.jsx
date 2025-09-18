import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, ShoppingCart, Plus, Minus, Share2, ZoomIn, ChevronDown, ChevronUp, ChevronRight, Package, Truck, Shield, Clock, X } from 'lucide-react';
import { useProduct } from '../context/ProductContext/ProductContext';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext/FavoritesContext';
import { useRecentlyViewed } from '../context/RecentlyViewedContext/RecentlyViewedContext';
import { useAuth } from '../context/AuthContext/AuthContext';
import MediaDisplay from '../components/common/MediaDisplay';
import ProductCard from '../components/Products/ProductCard';
import ProductImageModal from '../components/common/ProductImageModal';

const ProductDisplayPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { getProduct, fetchProducts } = useProduct();
  const { addToCart, getProductQuantity, updateProductQuantity } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { fetchRecentlyViewed, trackProductView } = useRecentlyViewed();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [sameCategoryProducts, setSameCategoryProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(true);
  const [isCareInstructionsOpen, setIsCareInstructionsOpen] = useState(false);
  const [isDeliveryInfoOpen, setIsDeliveryInfoOpen] = useState(false);
  
  // Scroll detection states for sticky mini navbar
  const [showStickyNavbar, setShowStickyNavbar] = useState(false);
  const [showStickyBreadcrumb, setShowStickyBreadcrumb] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollingUp, setScrollingUp] = useState(false);

  const currentCartQuantity = getProductQuantity(productId);

  // Validate MongoDB ObjectId format
  const isValidObjectId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  };

  useEffect(() => {
    const loadProduct = async () => {
      if (productId) {
        if (!isValidObjectId(productId)) {
          console.error('Invalid product ID format:', productId);
          setProduct(null);
          setLoading(false);
          return;
        }

        setLoading(true);
        try {
          const productData = await getProduct(productId);
          
          if (!productData) {
            console.error('Product not found:', productId);
            setProduct(null);
            setLoading(false);
            return;
          }

          setProduct(productData);

          // Track product view for logged-in users
          if (user) {
            try {
              await trackProductView(productId);
            } catch (trackError) {
              console.error('Error tracking product view:', trackError);
            }
          }

          // Load recently viewed products for logged-in users
          if (user) {
            try {
              const recentlyViewedData = await fetchRecentlyViewed();
              const filteredRecent = recentlyViewedData
                .filter(item => item.productId && item.productId._id !== productId)
                .slice(0, 3);
              setRecentlyViewed(filteredRecent);
            } catch (recentError) {
              console.error('Error loading recently viewed:', recentError);
              setRecentlyViewed([]);
            }
          }

          // Load products from the same category
          if (productData.category) {
            try {
              const categoryProductsResponse = await fetchProducts({
                category: productData.category._id,
                limit: 6,
                isActive: true
              });
              
              // Handle different response structures
              const categoryProducts = categoryProductsResponse?.products || categoryProductsResponse || [];
              
              // Ensure categoryProducts is an array before filtering
              if (Array.isArray(categoryProducts)) {
                const filteredCategoryProducts = categoryProducts
                  .filter(p => p._id !== productId)
                  .slice(0, 3);
                setSameCategoryProducts(filteredCategoryProducts);
              } else {
                console.warn('Category products is not an array:', categoryProducts);
                setSameCategoryProducts([]);
              }
            } catch (categoryError) {
              console.error('Error loading category products:', categoryError);
              setSameCategoryProducts([]);
            }
          }

        } catch (error) {
          console.error('Error loading product:', error);
          setProduct(null);
        } finally {
          setLoading(false);
        }
      }
    };

    loadProduct();
  }, [productId, getProduct, fetchProducts, trackProductView, fetchRecentlyViewed, user]);

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

  // Scroll detection for sticky mini navbar and breadcrumb
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isMobile = window.innerWidth < 768;
      
      // Show navbar when user scrolls DOWN past the Reserve button (around 600px)
      const shouldShowNavbar = currentScrollY > 600;
      
      // Show breadcrumb when user scrolls past initial content
      // On mobile, show at 150px; on desktop, show at 200px to avoid overlap issues
      const breadcrumbThreshold = isMobile ? 150 : 200;
      const shouldShowBreadcrumb = currentScrollY > breadcrumbThreshold;
      
      setShowStickyNavbar(shouldShowNavbar);
      setShowStickyBreadcrumb(shouldShowBreadcrumb);
      setLastScrollY(currentScrollY);
    };

    // Throttled scroll listener
    let ticking = false;
    const scrollListener = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', scrollListener, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', scrollListener);
    };
  }, [lastScrollY]);

  const handleAddToCart = async () => {
    if (!product || totalStock === 0) return;
    setIsAddingToCart(true);
    try {
      await addToCart(product, 1);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product || totalStock === 0) return;
    try {
      const currentQuantity = getProductQuantity(product._id);
      if (currentQuantity === 0) {
        await addToCart(product, 1);
      }
      navigate('/cart');
    } catch (error) {
      console.error('Error in buy now:', error);
    }
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity < 0) return;
    updateProductQuantity(product._id, newQuantity);
  };

  const handleFavoriteToggle = async () => {
    if (!user || !product) return;
    try {
      await toggleFavorite(product._id);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleImageSelect = (index) => {
    setSelectedImageIndex(index);
  };

  const handleImageZoom = () => {
    setIsImageModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-black animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center bg-white border border-black p-12 rounded-none shadow-lg">
          <h2 className="text-2xl font-bold text-black mb-4">Product Not Found</h2>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-black text-white px-8 py-3 font-medium hover:bg-gray-900 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const selectedVariant = product.variants?.[selectedVariantIndex] || product.variants?.[0] || { price: 0, discount: { value: 0 }, stock: 0 };
  const discountedPrice = selectedVariant.price && selectedVariant.discount?.value
    ? selectedVariant.price - selectedVariant.discount.value
    : selectedVariant.price || 0;
  const discountPercentage = selectedVariant.price && selectedVariant.discount?.value
    ? Math.round((selectedVariant.discount.value / selectedVariant.price) * 100)
    : 0;
  const totalStock = product.stock || selectedVariant.stock || 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Breadcrumb - Shows on scroll */}
      {product && (
        <div className={`fixed left-0 right-0 z-20 transition-all duration-300 ease-out ${
          showStickyBreadcrumb 
            ? 'translate-y-0 opacity-100' 
            : '-translate-y-full opacity-0'
        }`}
        style={{
          top: 'var(--header-height, 130px)'
        }}>
          <div className="bg-gray-50 border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
              <nav className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                <button
                  onClick={() => navigate('/')}
                  className="text-gray-600 hover:text-black transition-colors hover:underline truncate"
                >
                  Home
                </button>
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                
                {product?.category?.name && (
                  <>
                    <button
                      onClick={() => navigate(`/products?category=${product.category._id}`)}
                      className="text-gray-600 hover:text-black transition-colors hover:underline truncate"
                    >
                      {product.category.name}
                    </button>
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                  </>
                )}
                
                <span className="text-black font-medium truncate max-w-[150px] sm:max-w-none">
                  {product?.name}
                </span>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Sticky Mini Navbar - Shows on scroll down past product info */}
      {product && (
        <div className={`fixed left-0 right-0 z-10 transition-all duration-300 ease-out ${
          showStickyNavbar 
            ? 'translate-y-0 opacity-100' 
            : '-translate-y-full opacity-0'
        }`}
        style={{
          top: showStickyBreadcrumb 
            ? 'calc(var(--header-height, 130px) + 36px)' // Header height + breadcrumb height (36px including padding)
            : 'var(--header-height, 130px)'
        }}>
        {/* Backdrop blur for better visual separation */}
        <div className="bg-white border-t border-gray-200 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 sm:py-3">
            <div className="flex items-center justify-between gap-3 sm:gap-6">
              
              {/* Left: Product Info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Product Thumbnail */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 border border-gray-300 overflow-hidden flex-shrink-0 bg-gray-50">
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
                        <span className=" text-green-500 px-1.5 py-0.5 text-xs font-bold leading-none">
                          {discountPercentage}% OFF
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Action Buttons */}
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                {/* Quantity Controls or Add to Cart */}
                {currentCartQuantity > 0 ? (
                  <div className="flex items-center bg-gray-50 border border-gray-300 h-9 sm:h-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuantityChange(currentCartQuantity - 1);
                      }}
                      className="w-8 sm:w-9 h-full flex items-center justify-center text-black hover:bg-gray-100 transition-colors"
                    >
                      <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    <span className="px-2 sm:px-3 text-black font-semibold text-sm min-w-[2rem] text-center">
                      {currentCartQuantity}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuantityChange(currentCartQuantity + 1);
                      }}
                      disabled={currentCartQuantity >= totalStock}
                      className="w-8 sm:w-9 h-full flex items-center justify-center text-black hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    disabled={!product?.isActive || totalStock === 0 || isAddingToCart}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border transition-all duration-200 h-9 sm:h-10 ${
                      !product?.isActive || totalStock === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300'
                        : isAddingToCart
                        ? 'bg-gray-200 text-black cursor-wait border-gray-400'
                        : 'bg-white text-black border-black hover:bg-gray-50'
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
                <button
                  onClick={handleBuyNow}
                  disabled={!product?.isActive || totalStock === 0}
                  className={`px-3 sm:px-5 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 h-9 sm:h-10 ${
                    !product?.isActive || totalStock === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-black text-white hover:bg-gray-800 shadow-md hover:shadow-lg'
                  }`}
                >
                  <span className="hidden sm:inline">Reserve Yours</span>
                  <span className="sm:hidden">Reserve</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>
      )}
      
      {/* Clean Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-black hover:text-gray-700 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Products</span>
            </button>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleFavoriteToggle}
                className={`p-2 transition-colors ${
                  isFavorite(product._id)
                    ? 'text-red-600'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorite(product._id) ? 'fill-current' : ''}`} />
              </button>
              <button className="p-2 text-gray-600 hover:text-black transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <nav className="flex items-center space-x-2 text-sm">
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-black transition-colors hover:underline"
            >
              Home
            </button>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            
            {product?.category?.name && (
              <>
                <button
                  onClick={() => navigate(`/products?category=${product.category._id}`)}
                  className="text-gray-600 hover:text-black transition-colors hover:underline"
                >
                  {product.category.name}
                </button>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </>
            )}
            
            <span className="text-black font-medium truncate">
              {product?.name}
            </span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Image Gallery - Left Side */}
          <div className="lg:col-span-7">
            <div className="sticky top-4 flex gap-4">
              {/* Thumbnail Images - Left Side */}
              {product.images && product.images.length > 1 && (
                <div className="flex flex-col gap-2 w-20 md:w-24 max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => handleImageSelect(index)}
                      className={`aspect-square border-2 transition-all overflow-hidden hover:scale-105 flex-shrink-0 ${
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
                <div className="relative bg-white border border-gray-200">
                  <div 
                    className="aspect-square cursor-pointer group relative overflow-hidden"
                    onClick={handleImageZoom}
                    onMouseEnter={() => setIsHoveringImage(true)}
                    onMouseLeave={() => setIsHoveringImage(false)}
                  >
                    <MediaDisplay
                      src={product.images?.[selectedImageIndex] || product.images?.[0]}
                      alt={product.name}
                      className="w-full h-full object-cover transition-all duration-1000 ease-in-out group-hover:scale-105"
                      style={{
                        transition: 'opacity 1s ease-in-out, transform 1s ease-in-out',
                        opacity: 1
                      }}
                    />
                    
                    {/* Zoom Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
                      <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    
                    {/* Stock Status */}
                    {totalStock === 0 && (
                      <div className="absolute top-4 right-4 bg-black text-white px-3 py-1 text-sm">
                        Out of Stock
                      </div>
                    )}

                    {/* Image dots indicator for multiple images - only show on mobile when thumbnails are hidden */}
                    {product.images && product.images.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 md:hidden">
                        {product.images.map((_, index) => (
                          <div
                            key={index}
                            className={`w-2 h-2 transition-all duration-300 ${
                              index === selectedImageIndex
                                ? 'bg-black scale-110'
                                : 'bg-gray-400 hover:bg-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Information - Right Side */}
          <div className="lg:col-span-5">
            <div className="space-y-6">
              
              {/* Product Title & Info */}
              <div className="space-y-4">
                <h1 className="text-2xl md:text-3xl font-medium text-black leading-tight">
                  {product.name}
                </h1>
                
                {/* Pricing */}
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-black">
                    ₹ {Math.round(discountedPrice)}
                  </span>
                  {discountPercentage > 0 && (
                    <>
                      <span className="text-lg text-gray-500 line-through">
                        ₹{selectedVariant.price}
                      </span>
                      <span className="text-sm font-medium text-green-600">
                        {discountPercentage}% Off
                      </span>
                    </>
                  )}
                </div>

                {/* Star Rating and Reviews */}
             

                {/* Dietary Indicators */}
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center text-xs font-medium px-3 py-1.5 border ${
                    product.hasEgg 
                      ? 'border-red-500 bg-red-50 text-red-700' 
                      : 'border-green-500 bg-green-50 text-green-700'
                  }`}>
                    <span className={`w-3 h-3 mr-2 border flex items-center justify-center ${
                      product.hasEgg 
                        ? 'border-red-500 bg-red-100' 
                        : 'border-green-500 bg-green-100'
                    }`}>
                      {product.hasEgg ? (
                        <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-b-[4px] border-l-transparent border-r-transparent border-b-red-600"></div>
                      ) : (
                        <div className="w-1.5 h-1.5 bg-green-600"></div>
                      )}
                    </span>
                    {product.hasEgg ? 'WITH EGG' : 'EGGLESS'}
                  </span>
                </div>
              </div>

              {/* Variant Selection and Action Buttons */}
              <div className="bg-white border border-black p-6 space-y-6">
                {/* Variant Selection */}
                {product.variants && product.variants.length > 1 && (
                  <div>
                    <label className="block text-sm font-medium text-black mb-3">
                      Available Sizes
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {product.variants.map((variant, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedVariantIndex(index)}
                          className={`p-3 text-center transition-all border ${
                            index === selectedVariantIndex
                              ? 'bg-black text-white border-black'
                              : 'bg-white border-black hover:bg-gray-100'
                          }`}
                        >
                          {/* Product Image */}
                          <div className="mb-2">
                            <MediaDisplay
                              src={product.images?.[0] || product.images?.[index] || '/placeholder-image.jpg'}
                              alt={`${product.name} ${variant.quantity}${variant.measuringUnit}`}
                              className="w-full h-20 object-cover"
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

                {/* Action Buttons */}
                <div className="space-y-3">
                  {/* Add to Cart / Quantity Controls */}
                  {currentCartQuantity > 0 ? (
                    <div className="w-full bg-white border border-black py-3 px-6 flex items-center justify-center gap-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuantityChange(currentCartQuantity - 1);
                        }}
                        className="w-8 h-8 flex items-center justify-center bg-white text-black transition-colors border border-black hover:bg-gray-100"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-medium text-black min-w-[3rem] text-center text-lg">
                        {currentCartQuantity}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuantityChange(currentCartQuantity + 1);
                        }}
                        disabled={currentCartQuantity >= totalStock}
                        className="w-8 h-8 flex items-center justify-center bg-white text-black transition-colors border border-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleAddToCart}
                      disabled={isAddingToCart || totalStock === 0}
                      className="w-full bg-black text-white border-none hover:bg-gray-800 disabled:bg-gray-400 disabled:text-white font-medium py-4 px-6 transition-colors flex items-center justify-center gap-2 text-lg"
                    >
                      {isAddingToCart ? (
                        <div className="inline-block h-4 w-4 animate-spin border-2 border-white border-t-transparent"></div>
                      ) : (
                        <ShoppingCart className="w-5 h-5" />
                      )}
                      {isAddingToCart ? 'Adding...' : totalStock === 0 ? 'Out of Stock' : 'Add to Box'}
                    </button>
                  )}
                  
                  {/* Buy Now Button */}
                  <button
                    onClick={handleBuyNow}
                    disabled={totalStock === 0}
                    className="w-full bg-black text-white hover:bg-gray-800 disabled:bg-gray-400 font-medium py-4 px-6 transition-colors text-lg"
                  >
                    {totalStock === 0 ? 'Out of Stock' : 'Reserve Yours'}
                  </button>
                </div>
              </div>

              {/* Product Features */}
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-3 p-4 bg-white border border-black">
                  <Truck className="w-5 h-5 text-black" />
                  <div>
                    <div className="text-sm font-medium text-black">Free Delivery</div>
                    <div className="text-xs text-gray-600">Orders above ₹500</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white border border-black">
                  <Shield className="w-5 h-5 text-black" />
                  <div>
                    <div className="text-sm font-medium text-black">Fresh Guarantee</div>
                    <div className="text-xs text-gray-600">100% fresh products</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white border border-black">
                  <Clock className="w-5 h-5 text-black" />
                  <div>
                    <div className="text-sm font-medium text-black">Same Day Delivery</div>
                    <div className="text-xs text-gray-600">Order before 2 PM</div>
                  </div>
                </div>
              </div>

              {/* Product Details Accordion */}
              <div className="mt-8">
                <div className="bg-white border border-gray-200">
                  
                  {/* Product Description */}
                  <div className="border-b border-gray-200">
                    <button
                      onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
                      className="w-full px-4 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                    >
                      <h3 className="text-sm font-semibold text-black">Product Description</h3>
                      {isDescriptionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {isDescriptionOpen && (
                      <div className="px-4 pb-4">
                        <p className="text-gray-700 leading-relaxed text-sm mb-4">
                          {product.description}
                        </p>
                        
                        {/* Product Details */}
                        {(product.importantField?.name || Object.keys(product.extraFields || {}).length > 0) && (
                          <div className="bg-white border border-gray-200 p-4">
                            <h4 className="font-medium text-black mb-3 text-sm">Specifications</h4>
                            <div className="space-y-2">
                              {selectedVariant.quantity && (
                                <div className="flex justify-between py-1 border-b border-gray-300">
                                  <span className="text-gray-600 text-xs">Weight:</span>
                                  <span className="text-black font-medium text-xs">{selectedVariant.quantity}{selectedVariant.measuringUnit}</span>
                                </div>
                              )}
                              {product.importantField?.name && (
                                <div className="flex justify-between py-1 border-b border-gray-300">
                                  <span className="text-gray-600 text-xs">{product.importantField.name}:</span>
                                  <span className="text-black font-medium text-xs">{product.importantField.value}</span>
                                </div>
                              )}
                              {Object.entries(product.extraFields || {}).map(([key, value]) => (
                                <div key={key} className="flex justify-between py-1 border-b border-gray-300">
                                  <span className="text-gray-600 text-xs">{key}:</span>
                                  <span className="text-black font-medium text-xs">{value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tags */}
                        {product.tags && product.tags.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-medium text-black mb-2 text-sm">Tags</h4>
                            <div className="flex flex-wrap gap-1">
                              {product.tags.map((tag, index) => (
                                <span key={index} className="bg-white text-black border border-gray-300 px-2 py-1 text-xs">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Care Instructions */}
                  <div className="border-b border-gray-200">
                    <button
                      onClick={() => setIsCareInstructionsOpen(!isCareInstructionsOpen)}
                      className="w-full px-4 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                    >
                      <h3 className="text-sm font-semibold text-black">Care Instructions</h3>
                      {isCareInstructionsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {isCareInstructionsOpen && (
                      <div className="px-4 pb-4">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3 p-3 bg-white border border-gray-300">
                            <Package className="w-4 h-4 text-black mt-1 flex-shrink-0" />
                            <div>
                              <span className="font-medium text-black text-xs">Storage:</span>
                              <p className="text-gray-600 text-xs mt-1">Keep refrigerated at 2-8°C for optimal freshness</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-white border border-gray-300">
                            <Clock className="w-4 h-4 text-black mt-1 flex-shrink-0" />
                            <div>
                              <span className="font-medium text-black text-xs">Best Before:</span>
                              <p className="text-gray-600 text-xs mt-1">Consume within 2-3 days of delivery for best taste</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-white border border-gray-300">
                            <Shield className="w-4 h-4 text-black mt-1 flex-shrink-0" />
                            <div>
                              <span className="font-medium text-black text-xs">Handling:</span>
                              <p className="text-gray-600 text-xs mt-1">Handle with clean hands and serve at room temperature</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Delivery Information */}
                  <div>
                    <button
                      onClick={() => setIsDeliveryInfoOpen(!isDeliveryInfoOpen)}
                      className="w-full px-4 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                    >
                      <h3 className="text-sm font-semibold text-black">Delivery Information</h3>
                      {isDeliveryInfoOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {isDeliveryInfoOpen && (
                      <div className="px-4 pb-4">
                        <div className="grid grid-cols-1 gap-3">
                          <div className="bg-white p-4 border border-gray-300">
                            <h4 className="font-medium text-black mb-2 text-xs">Same Day Delivery</h4>
                            <p className="text-xs text-gray-600">Order before 2 PM for same day delivery in select areas. Fast and reliable service guaranteed.</p>
                          </div>
                          <div className="bg-white p-4 border border-gray-300">
                            <h4 className="font-medium text-black mb-2 text-xs">Free Delivery</h4>
                            <p className="text-xs text-gray-600">Free delivery on all orders above ₹500 within the city limits. No hidden charges.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recently Viewed / Similar Products */}
        {(recentlyViewed.length > 0 || sameCategoryProducts.length > 0) && (
          <section className="mt-16">
            <div className="text-center mb-8 border-b border-gray-200 pb-6">
              <h2 className="text-2xl font-semibold text-black mb-2">
                {user && recentlyViewed.length > 0 ? "Recently Viewed" : "You Might Also Like"}
              </h2>
              <p className="text-gray-600">
                {user && recentlyViewed.length > 0 
                  ? "Products you've looked at recently" 
                  : `More delicious ${product?.category?.name || 'products'} for you`}
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {(user && recentlyViewed.length > 0 ? recentlyViewed : sameCategoryProducts).map((item) => {
                const productToShow = item.productId || item;
                
                if (!productToShow || !productToShow._id) {
                  return null;
                }

                return (
                  <ProductCard
                    key={productToShow._id}
                    product={productToShow}
                  />
                );
              })}
            </div>
          </section>
        )}
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
    </div>
  );
};

export default ProductDisplayPage;