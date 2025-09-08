import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaShoppingCart, FaCheck, FaCopy, FaShareAlt, FaStar } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import { useProduct } from '../../context/ProductContext/ProductContext';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, cartItems, updateQuantity } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [messageOnCake, setMessageOnCake] = useState('');
  const [numberOnCake, setNumberOnCake] = useState('');
  const [couponCopied, setCouponCopied] = useState(false);
  const [showFloatingCart, setShowFloatingCart] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [cartItem, setCartItem] = useState(null);
  const [error, setError] = useState(null);
  const { getProduct } = useProduct();

  // Calculate total price based on quantity and selected variant
  const totalPrice = selectedVariant ? selectedVariant.price * quantity : 0;

  // Handle scroll to show floating cart
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowFloatingCart(true);
      } else {
        setShowFloatingCart(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Handle click outside to close share menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isShareMenuOpen && !event.target.closest('.share-menu-container')) {
        setIsShareMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isShareMenuOpen]);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getProduct(id);
        if (data) {
          setProduct(data);
          // Set the first variant as default
          if (data.variants && data.variants.length > 0) {
            setSelectedVariant(data.variants[0]);
          }
        } else {
          setError('Product not found');
        }
        // eslint-disable-next-line no-empty
      } catch (err) {
        setError('Failed to fetch product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, getProduct]);

  // Check if product is already in cart
  useEffect(() => {
    if (product && cartItems.length > 0 && selectedVariant) {
      const currentOptions = {
        variant: selectedVariant._id,
        message: messageOnCake,
        number: numberOnCake
      };
      
      const foundItem = cartItems.find(item => 
        item.id === product.id && 
        JSON.stringify(item.options) === JSON.stringify(currentOptions)
      );
      
      if (foundItem) {
        setIsInCart(true);
        setCartItem(foundItem);
        setQuantity(foundItem.quantity);
      } else {
        setIsInCart(false);
        setCartItem(null);
        setQuantity(1);
      }
    }
  }, [product, cartItems, selectedVariant, messageOnCake, numberOnCake]);

  const handleVariantChange = (variant) => {
    setSelectedVariant(variant);
    setQuantity(1); // Reset quantity when variant changes
  };

  const increaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleCopyCoupon = () => {
    navigator.clipboard.writeText("DXB1234");
    setCouponCopied(true);
    setTimeout(() => {
      setCouponCopied(false);
    }, 2000);
  };
  
  const handleShare = (platform) => {
    const url = window.location.href;
    const text = `Check out this delicious ${product.name} on Sweet Cake!`;
    
    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
        break;
      default:
        break;
    }
    
    setIsShareMenuOpen(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 mt-24">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cakePink"></div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">{error || 'Product not found'}</h2>
          <Link to="/products" className="mt-4 inline-block text-cakePink hover:underline">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-8 py-16 mt-16">
      {/* Breadcrumb */}
      <nav className="flex mb-6 text-sm text-gray-500">
        <Link to="/" className="hover:text-cakePink">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/products" className="hover:text-cakePink">Products</Link>
        <span className="mx-2">/</span>
        <span className="text-cakePink">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left side - Product Images */}
        <div className="lg:sticky lg:top-24 self-start">
          {/* Main image */}
          <div className="aspect-square max-w-md mx-auto rounded-lg overflow-hidden bg-white border border-gray-100 mb-3 shadow-sm">
            <img
              src={product.images[selectedImage]}
              alt={product.name}
              className="w-full h-full object-contain transition-transform duration-300 hover:scale-105"
            />
          </div>
          
          {/* Thumbnails */}
          <div className="flex justify-center space-x-2">
            {product.images.map((image, index) => (
              <button
                key={index}
                className={`w-12 h-12 border rounded-md overflow-hidden transition-all ${
                  selectedImage === index 
                    ? "border-cakePink shadow-sm ring-1 ring-cakePink/30" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSelectedImage(index)}
              >
                <img
                  src={image}
                  alt={`${product.name} ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Right side - Product Info */}
        <div className="space-y-5">
          {/* Header Section */}
          <div className="pb-5">
            {/* Badge */}
            {product.badge && (
              <span className="inline-block bg-yellow-500 text-white text-xs font-medium px-2 py-1 rounded-full mb-2">
                {product.badge}
              </span>
            )}

            {/* Title */}
            <h1 className="text-2xl font-bold text-cakeBrown mb-2">{product.name}</h1>
           
            {/* Price Section */}
            <div className="flex items-center mb-3">
              <div className="mr-3">
                <span className="text-2xl font-bold text-cakePink">
                  ₹{totalPrice.toFixed(2)}
                </span>
                {selectedVariant?.originalPrice && (
                  <span className="text-sm text-gray-400 line-through ml-2">
                    ₹{(selectedVariant.originalPrice * quantity).toFixed(2)}
                  </span>
                )}
              </div>
              {quantity > 1 && (
                <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                  {quantity} × ₹{selectedVariant?.price.toFixed(2)}
                </div>
              )}
            </div>
              
            {/* Description */}
            <p className="text-gray-700 text-sm leading-relaxed">{product.description}</p>
          </div>

          {/* Coupon Box */}
          {!product.discount && (
            <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-md p-2 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 w-10 h-10">
                <div className="absolute transform rotate-45 bg-green-500 text-white text-[10px] font-bold py-1 right-[-25px] top-[6px] w-[90px] text-center">
                  SAVE ₹100
                </div>
              </div>
              <div className="flex items-center">
                <div className="bg-green-100 rounded-full p-1 mr-2 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-green-800">Save ₹100 on this cake!</p>
                  <div className="flex items-center mt-1 relative">
                    <div className="relative flex-1">
                      <span className="bg-white border border-dashed border-green-300 text-green-700 font-mono text-xs font-bold px-2 py-1 rounded-l block">
                        DXB1234
                      </span>
                      {couponCopied && (
                        <div className="absolute inset-0 bg-green-100 bg-opacity-90 flex items-center justify-center rounded-l">
                          <div className="flex items-center text-green-700 text-xs">
                            <FaCheck className="mr-1" />
                            <span className="font-medium">Copied!</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <button 
                      className={`flex items-center justify-center text-xs font-bold py-1 px-2 rounded-r transition-colors duration-200 min-w-[45px] ${
                        couponCopied 
                          ? "bg-green-700 text-white" 
                          : "bg-green-600 hover:bg-green-700 text-white"
                      }`}
                      onClick={handleCopyCoupon}
                    >
                      {couponCopied ? <FaCheck className="mr-1" /> : <FaCopy className="mr-1" />}
                      {couponCopied ? 'COPIED' : 'COPY'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Variant Selection */}
          {product.variants && product.variants.length > 0 && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="text-sm font-semibold text-cakeBrown mb-2">Select Quantity</h3>
              <div className="grid grid-cols-2 gap-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant._id}
                    className={`p-2 border rounded-lg transition-all text-xs ${
                      selectedVariant?._id === variant._id
                        ? "bg-cakePink text-white border-cakePink shadow-md"
                        : "bg-white text-gray-700 border-gray-300 hover:border-cakePink"
                    }`}
                    onClick={() => handleVariantChange(variant)}
                  >
                    <div className="font-semibold text-center">{variant.quantity}{variant.measuringUnit}</div>
                    <div className="text-center mt-1">
                      ₹{variant.price} {variant.originalPrice && (
                        <span className="text-gray-400 line-through ml-1">₹{variant.originalPrice}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Customization Options */}
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <h3 className="text-sm font-semibold text-cakeBrown mb-2">Customize Your Order</h3>
            
            <div className="space-y-2">
              <div>
                <label htmlFor="numberOnCake" className="block text-xs font-semibold text-gray-700 mb-1">
                  Number On Cake (Optional)
                </label>
                <input
                  type="text"
                  id="numberOnCake"
                  placeholder="Enter number (e.g., 18, 21)"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-cakePink focus:border-transparent text-xs"
                  value={numberOnCake}
                  onChange={(e) => setNumberOnCake(e.target.value)}
                  maxLength={2}
                />
              </div>

              <div>
                <label htmlFor="messageOnCake" className="block text-xs font-semibold text-gray-700 mb-1">
                  Message (Optional)
                </label>
                <input
                  type="text"
                  id="messageOnCake"
                  placeholder="Enter your special message"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-cakePink focus:border-transparent text-xs"
                  value={messageOnCake}
                  onChange={(e) => setMessageOnCake(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-800">Quantity:</span>
              <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                <button
                  onClick={decreaseQuantity}
                  className="px-2.5 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-xs"
                >
                  -
                </button>
                <div className="px-3 py-1.5 border-l border-r border-gray-300 font-semibold text-xs">
                  {quantity}
                </div>
                <button
                  onClick={increaseQuantity}
                  className="px-2.5 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-xs"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-3">
            {isInCart ? (
              <div className="flex-1 flex items-center justify-center border border-gray-300 rounded-lg overflow-hidden">
                <button 
                  onClick={() => updateQuantity(product.id, cartItem.quantity - 1, cartItem.options)}
                  className="px-3 py-2 bg-gray-100 font-semibold text-gray-700 hover:bg-gray-200 transition-colors text-xs"
                >
                  -
                </button>
                <div className="px-4 py-2 font-semibold text-xs">
                  {cartItem?.quantity || 0}
                </div>
                <button 
                  onClick={() => updateQuantity(product.id, cartItem.quantity + 1, cartItem.options)}
                  className="px-3 py-2 bg-gray-100 font-semibold text-gray-700 hover:bg-gray-200 transition-colors text-xs"
                >
                  +
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  addToCart(
                    product, 
                    quantity, 
                    {
                      variant: selectedVariant._id,
                      message: messageOnCake,
                      number: numberOnCake
                    }
                  );
                  setAddedToCart(true);
                  setTimeout(() => setAddedToCart(false), 2000);
                }}
                className={`flex-1 px-3 py-2 text-white font-semibold rounded-lg transition-all flex items-center justify-center text-xs ${
                  addedToCart 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-cakePink hover:bg-pink-700'
                } shadow-sm hover:shadow-md`}
              >
                {addedToCart ? (
                  <>
                    <FaCheck className="mr-1" />
                    Added
                  </>
                ) : (
                  <>
                    <FaShoppingCart className="mr-1" />
                    Add - ₹{totalPrice.toFixed(2)}
                  </>
                )}
              </button>
            )}
            
            <button 
              onClick={() => {
                if (!isInCart) {
                  addToCart(
                    product, 
                    quantity, 
                    {
                      variant: selectedVariant._id,
                      message: messageOnCake,
                      number: numberOnCake
                    }
                  );
                }
                navigate('/payment');
              }}
              className="flex-1 px-3 py-2 bg-cakeBrown text-white font-semibold rounded-lg hover:bg-cakeBrown-dark transition-all text-xs shadow-sm hover:shadow-md"
            >
              Buy Now
            </button>
            
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs"
            >
              {isFavorite ? <FaHeart className="text-cakePink text-sm" /> : <FaRegHeart className="text-sm" />}
            </button>

            {/* Share button with dropdown */}
            <div className="relative share-menu-container">
              <button
                onClick={() => setIsShareMenuOpen(!isShareMenuOpen)}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs"
              >
                <FaShareAlt className="text-sm" />
              </button>
              
              {isShareMenuOpen && (
                <div className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg z-20 border border-gray-200">
                  <div className="py-1">
                    <button
                      onClick={() => handleShare('facebook')}
                      className="block w-full text-left px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Facebook
                    </button>
                    <button
                      onClick={() => handleShare('twitter')}
                      className="block w-full text-left px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Twitter
                    </button>
                    <button
                      onClick={() => handleShare('whatsapp')}
                      className="block w-full text-left px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      WhatsApp
                    </button>
                    <button
                      onClick={() => handleShare('copy')}
                      className="block w-full text-left px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating Add to Cart Button */}
      <div 
        className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 flex items-center justify-between z-50 transition-transform duration-300 shadow-lg ${
          showFloatingCart ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex items-center">
          <img 
            src={product.images[0]} 
            alt={product.name} 
            className="w-10 h-10 object-cover rounded-md mr-2 border border-gray-200"
          />
          <div>
            <h3 className="font-semibold text-gray-800 text-xs truncate max-w-[100px]">
              {product.name}
            </h3>
            <div className="flex items-center">
              <span className="text-cakePink font-bold text-sm">
                ₹{totalPrice.toFixed(2)}
              </span>
              {quantity > 1 && (
                <span className="text-[10px] text-gray-500 ml-1">
                  ({quantity} × ₹{selectedVariant?.price.toFixed(2)})
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-1.5">
          {isInCart ? (
            <>
              <div className="flex border border-gray-300 rounded-md overflow-hidden">
                <button 
                  onClick={() => updateQuantity(product.id, cartItem.quantity - 1, cartItem.options)}
                  className="w-7 h-7 bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors text-xs"
                >
                  -
                </button>
                <div className="w-8 h-7 flex items-center justify-center border-l border-r border-gray-300 font-medium text-xs">
                  {cartItem?.quantity || 0}
                </div>
                <button 
                  onClick={() => updateQuantity(product.id, cartItem.quantity + 1, cartItem.options)}
                  className="w-7 h-7 bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors text-xs"
                >
                  +
                </button>
              </div>
              
              <Link
                to="/cart"
                className="px-2 py-1 bg-cakeBrown text-white font-medium rounded-md hover:bg-cakeBrown-dark transition-colors flex items-center text-xs"
              >
                Checkout
              </Link>
            </>
          ) : (
            <>
              <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                <button
                  onClick={decreaseQuantity}
                  className="w-7 h-7 bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors text-xs"
                >
                  -
                </button>
                <div className="w-7 h-7 flex items-center justify-center border-l border-r border-gray-300 font-medium text-xs">
                  {quantity}
                </div>
                <button
                  onClick={increaseQuantity}
                  className="w-7 h-7 bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors text-xs"
                >
                  +
                </button>
              </div>
              
              <button 
                onClick={() => {
                  addToCart(
                    product, 
                    quantity, 
                    {
                      variant: selectedVariant._id,
                      message: messageOnCake,
                      number: numberOnCake
                    }
                  );
                  setAddedToCart(true);
                  setTimeout(() => setAddedToCart(false), 2000);
                }}
                className="px-2 py-1 bg-cakePink text-white font-medium rounded-md hover:bg-pink-700 transition-colors flex items-center text-xs"
              >
                <FaShoppingCart className="mr-1" />
                Add
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;