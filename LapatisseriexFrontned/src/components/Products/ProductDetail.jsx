import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaShoppingCart, FaCheck, FaCopy, FaShareAlt } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, cartItems, updateQuantity, removeFromCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedWeight, setSelectedWeight] = useState('0.5 Kg');
  const [selectedFlavor, setSelectedFlavor] = useState('Vanilla');
  const [quantity, setQuantity] = useState(1);
  const [messageOnCake, setMessageOnCake] = useState('');
  const [numberOnCake, setNumberOnCake] = useState('');
  const [couponCopied, setCouponCopied] = useState(false);
  const [showFloatingCart, setShowFloatingCart] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [cartItem, setCartItem] = useState(null);

  // Handle scroll to show floating cart
  useEffect(() => {
    const handleScroll = () => {
      // Show floating cart button when user scrolls past a certain point
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

  // Check if product is already in cart
  useEffect(() => {
    if (product && cartItems.length > 0) {
      const existingItem = cartItems.find(item => 
        item.id === product.id && 
        item.options.weight === selectedWeight && 
        item.options.flavor === selectedFlavor
      );
      
      if (existingItem) {
        setIsInCart(true);
        setCartItem(existingItem);
        setQuantity(existingItem.quantity);
      } else {
        setIsInCart(false);
        setCartItem(null);
      }
    }
  }, [product, cartItems, selectedWeight, selectedFlavor]);

  // Fetch product data
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      // Mock data - in a real app, this would come from an API
      const mockProduct = {
        id: id,
        name: "Round Cream Happy Birthday Pink Cake",
        price: 675,
        originalPrice: 750,
        rating: 5,
        reviewCount: 11,
        badge: "Best Seller",
        isVeg: true,
        coupon: "BDAY100",
        description: "Get ready for some sweet celebrations with this 1st birthday cake! Everyone deserves a special celebration. Make those first years unforgettable with this delicious and beautiful cake that will be the centerpiece of your celebration.",
        images: [
          "/images/cake1.png",
          "/images/cake2.png",
          "/images/cake3.png"
        ],
        availableWeights: ["0.5 Kg", "1 Kg", "1.5 Kg"],
        availableFlavors: ["Vanilla", "Chocolate", "Strawberry", "Butterscotch"],
        customizationOptions: {
          messageAllowed: true,
          numberAllowed: true
        },
        deliveryInfo: {
          cutoffTime: "2 Hrs",
          sameDay: true,
          fixedTime: true,
          midnightDelivery: true
        }
      };
      
      setProduct(mockProduct);
      setLoading(false);
    }, 500);
  }, [id]);

  // Check if product is already in cart
  useEffect(() => {
    if (product && cartItems.length > 0) {
      const currentOptions = {
        weight: selectedWeight,
        flavor: selectedFlavor,
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
      }
    }
  }, [product, cartItems, selectedWeight, selectedFlavor, messageOnCake, numberOnCake]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 mt-24">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cakePink"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Product not found</h2>
          <Link to="/products" className="mt-4 inline-block text-cakePink hover:underline">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const handleWeightChange = (weight) => {
    setSelectedWeight(weight);
  };

  const handleFlavorChange = (e) => {
    setSelectedFlavor(e.target.value);
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
    navigator.clipboard.writeText(product.coupon);
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

  return (
    <div className="container mx-auto px-4 py-8 mt-16 product-detail-container">
      {/* Breadcrumb */}
      <nav className="flex mb-6 text-sm mt-8 pt-4">
        <Link to="/" className="text-gray-500 hover:text-cakePink">Home</Link>
        <span className="mx-2 text-gray-400">/</span>
        <Link to="/products" className="text-gray-500 hover:text-cakePink">Products</Link>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-cakePink">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left side - Product Images */}
        <div>
          {/* Main image */}
          <div className="aspect-square rounded-lg overflow-hidden bg-white border border-gray-100 mb-4">
            <img
              src={product.images[selectedImage]}
              alt={product.name}
              className="w-full h-full object-contain"
            />
          </div>
          
          {/* Thumbnails */}
          <div className="flex space-x-2">
            {product.images.map((image, index) => (
              <button
                key={index}
                className={`w-20 h-20 border-2 rounded-md overflow-hidden ${
                  selectedImage === index ? "border-cakePink" : "border-gray-200"
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
        <div>
          {/* Badge */}
          {product.badge && (
            <span className="inline-block bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded mb-2">
              {product.badge}
            </span>
          )}

          {/* Title */}
          <h1 className="text-2xl font-bold text-cakeBrown mb-1">{product.name}</h1>
          
          {/* Rating */}
          <div className="flex items-center mb-4">
            <div className="flex items-center">
              <span className="text-sm font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded flex items-center mr-2">
                {product.rating} ★
              </span>
              <span className="text-sm text-gray-500">
                ({product.reviewCount} Reviews)
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="mb-3">
            <span className="text-2xl font-bold text-cakePink mr-2">₹{product.price}</span>
            {product.originalPrice && (
              <span className="text-lg text-gray-400 line-through">₹{product.originalPrice}</span>
            )}
          </div>

          {/* Coupon Box */}
          {product.coupon && (
            <div className="mb-6 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-md p-4 relative overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md">
              <div className="absolute top-0 right-0 w-16 h-16">
                <div className="absolute transform rotate-45 bg-green-500 text-white text-xs font-bold py-1 right-[-35px] top-[12px] w-[120px] text-center">
                  SAVE ₹100
                </div>
              </div>
              <div className="flex items-center">
                <div className="bg-green-100 rounded-full p-2 mr-3 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-800">Save ₹100 on this cake!</p>
                  <p className="text-xs text-green-600 mt-0.5">Apply this coupon at checkout</p>
                  <div className="flex items-center mt-2 relative">
                    <div className="relative flex-1">
                      <span className="bg-white border-2 border-dashed border-green-300 text-green-700 font-mono font-bold px-3 py-1 rounded-l-md block overflow-hidden">
                        {product.coupon}
                      </span>
                      {couponCopied && (
                        <div className="absolute inset-0 bg-green-100 bg-opacity-80 flex items-center justify-center rounded-l-md animate-fade-in">
                          <div className="flex items-center text-green-700">
                            <FaCheck className="mr-1" />
                            <span className="text-xs font-medium">Copied!</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <button 
                      className={`flex items-center justify-center ${
                        couponCopied 
                          ? "bg-green-700 text-white" 
                          : "bg-green-600 hover:bg-green-700 text-white"
                      } text-xs font-bold py-1 px-3 rounded-r-md transition-colors duration-200 min-w-[60px]`}
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

          {/* Description */}
          <p className="text-gray-700 mb-6">{product.description}</p>

          {/* Weight Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Select Weight</h3>
            <div className="flex flex-wrap gap-2">
              {product.availableWeights.map((weight) => (
                <button
                  key={weight}
                  className={`px-4 py-2 border rounded-md ${
                    selectedWeight === weight
                      ? "bg-cakePink text-white border-cakePink"
                      : "bg-white text-gray-700 border-gray-300 hover:border-cakePink"
                  }`}
                  onClick={() => handleWeightChange(weight)}
                >
                  {weight}
                </button>
              ))}
            </div>
          </div>

          {/* Customization Options */}
          {product.customizationOptions.numberAllowed && (
            <div className="mb-4">
              <label htmlFor="numberOnCake" className="block text-sm font-semibold text-gray-600 mb-1">
                Number On Cake
              </label>
              <input
                type="text"
                id="numberOnCake"
                placeholder="Enter number if required"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-cakePink focus:border-cakePink"
                value={numberOnCake}
                onChange={(e) => setNumberOnCake(e.target.value)}
                maxLength={2}
              />
            </div>
          )}

          {product.customizationOptions.messageAllowed && (
            <div className="mb-4">
              <label htmlFor="messageOnCake" className="block text-sm font-semibold text-gray-600 mb-1">
                Message
              </label>
              <input
                type="text"
                id="messageOnCake"
                placeholder="Enter message on cake"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-cakePink focus:border-cakePink"
                value={messageOnCake}
                onChange={(e) => setMessageOnCake(e.target.value)}
              />
            </div>
          )}

          {/* Flavor Selection */}
          <div className="mb-6">
            <label htmlFor="flavor" className="block text-sm font-semibold text-gray-600 mb-1">
              Select Flavour
            </label>
            <select
              id="flavor"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-cakePink focus:border-cakePink"
              value={selectedFlavor}
              onChange={handleFlavorChange}
            >
              {product.availableFlavors.map((flavor) => (
                <option key={flavor} value={flavor}>
                  {flavor}
                </option>
              ))}
            </select>
          </div>

          {/* Delivery Information */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Delivery Options</h3>
            <div className="grid grid-cols-3 gap-2">
              {product.deliveryInfo.sameDay && (
                <div className="text-center p-2 border border-gray-200 rounded-md">
                  <img src="/images/delivery-icon.png" alt="Same Day" className="w-8 h-8 mx-auto mb-1" />
                  <p className="text-xs">Same Day Delivery</p>
                </div>
              )}
              {product.deliveryInfo.fixedTime && (
                <div className="text-center p-2 border border-gray-200 rounded-md">
                  <img src="/images/fixed-time-icon.png" alt="Fixed Time" className="w-8 h-8 mx-auto mb-1" />
                  <p className="text-xs">Fixed Time Delivery</p>
                </div>
              )}
              {product.deliveryInfo.midnightDelivery && (
                <div className="text-center p-2 border border-gray-200 rounded-md">
                  <img src="/images/midnight-icon.png" alt="Midnight" className="w-8 h-8 mx-auto mb-1" />
                  <p className="text-xs">Midnight Delivery</p>
                </div>
              )}
            </div>
          </div>

          {/* Quantity selector */}
          

          {/* Add to cart and buy now buttons */}
          <div className="flex space-x-4">
            {isInCart ? (
              <div className="flex-1 flex items-center justify-center border border-gray-300 rounded-md overflow-hidden">
                <button 
                  onClick={() => updateQuantity(product.id, cartItem.quantity - 1, cartItem.options)}
                  className="px-4 py-3 bg-gray-100 font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  -
                </button>
                <div className="px-6 py-3 font-medium">
                  {cartItem?.quantity || 0}
                </div>
                <button 
                  onClick={() => updateQuantity(product.id, cartItem.quantity + 1, cartItem.options)}
                  className="px-4 py-3 bg-gray-100 font-medium text-gray-700 hover:bg-gray-200 transition-colors"
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
                      weight: selectedWeight,
                      flavor: selectedFlavor,
                      message: messageOnCake,
                      number: numberOnCake
                    }
                  );
                  setAddedToCart(true);
                  setTimeout(() => setAddedToCart(false), 2000);
                }}
                className={`flex-1 px-6 py-3 text-white font-medium rounded-md transition-colors flex items-center justify-center ${
                  addedToCart ? 'bg-green-600' : 'bg-cakePink hover:bg-pink-700'
                }`}
              >
                {addedToCart ? (
                  <>
                    <FaCheck className="mr-2" />
                    Added to Cart
                  </>
                ) : (
                  <>
                    <FaShoppingCart className="mr-2" />
                    Add to Cart
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
                      weight: selectedWeight,
                      flavor: selectedFlavor,
                      message: messageOnCake,
                      number: numberOnCake
                    }
                  );
                }
                navigate('/payment');
              }}
              className="flex-1 px-6 py-3 bg-cakeBrown text-white font-medium rounded-md hover:bg-cakeBrown-dark transition-colors"
            >
              Buy Now
            </button>
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="p-3 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {isFavorite ? <FaHeart className="text-cakePink" /> : <FaRegHeart />}
            </button>
            
            {/* Share button with dropdown */}
            <div className="relative share-menu-container">
              <button
                onClick={() => setIsShareMenuOpen(!isShareMenuOpen)}
                className="p-3 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <FaShareAlt />
              </button>
              
              {isShareMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 animate-fade-in">
                  <div className="py-1">
                    <button
                      onClick={() => handleShare('facebook')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Share on Facebook
                    </button>
                    <button
                      onClick={() => handleShare('twitter')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Share on Twitter
                    </button>
                    <button
                      onClick={() => handleShare('whatsapp')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Share on WhatsApp
                    </button>
                    <button
                      onClick={() => handleShare('copy')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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
        className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 flex items-center justify-between z-50 transition-transform duration-300 ${
          showFloatingCart ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div>
          <h3 className="font-semibold text-sm text-gray-800 truncate max-w-[150px]">
            {product.name}
          </h3>
          <div className="flex items-center">
            <span className="text-cakePink font-bold">₹{product.price}</span>
            {product.originalPrice && (
              <span className="text-xs text-gray-400 line-through ml-2">₹{product.originalPrice}</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center">
          {isInCart ? (
            <div className="flex items-center">
              <div className="flex border border-gray-300 rounded-md overflow-hidden">
                <button 
                  onClick={() => updateQuantity(product.id, cartItem.quantity - 1, cartItem.options)}
                  className="w-8 h-8 bg-gray-100 flex items-center justify-center text-sm hover:bg-gray-200 transition-colors"
                >
                  -
                </button>
                <div className="w-10 h-8 flex items-center justify-center text-sm border-l border-r border-gray-300">
                  {cartItem?.quantity || 0}
                </div>
                <button 
                  onClick={() => updateQuantity(product.id, cartItem.quantity + 1, cartItem.options)}
                  className="w-8 h-8 bg-gray-100 flex items-center justify-center text-sm hover:bg-gray-200 transition-colors"
                >
                  +
                </button>
              </div>
              
              <Link
                to="/cart"
                className="ml-3 px-4 py-2 bg-gray-800 text-white font-medium rounded-md hover:bg-gray-700 transition-colors flex items-center text-sm"
              >
                Checkout
              </Link>
            </div>
          ) : (
            <div className="flex items-center">
              <div className="flex items-center mr-3">
                <button
                  onClick={decreaseQuantity}
                  className="w-8 h-8 rounded-l-md bg-gray-100 flex items-center justify-center border border-gray-300 text-sm"
                >
                  -
                </button>
                <input
                  type="text"
                  className="w-8 h-8 text-center text-sm border-t border-b border-gray-300"
                  value={quantity}
                  readOnly
                />
                <button
                  onClick={increaseQuantity}
                  className="w-8 h-8 rounded-r-md bg-gray-100 flex items-center justify-center border border-gray-300 text-sm"
                >
                  +
                </button>
              </div>
              
         
                </div>
              )}
                
           
            </div>
          </div>
        </div>
      );
    };
    
    export default ProductDetail;
