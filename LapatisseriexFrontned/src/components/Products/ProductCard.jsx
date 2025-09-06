import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaImages, FaStar } from 'react-icons/fa';
import { MdShoppingCart } from 'react-icons/md';

const ProductCard = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const cardRef = useRef(null);
  
  // Effect to animate card entry
  useEffect(() => {
    setTimeout(() => {
      if (cardRef.current) {
        cardRef.current.style.opacity = '1';
        cardRef.current.style.transform = 'translateY(0)';
      }
    }, Math.random() * 300); // Staggered animation
  }, []);
  
  // Effect to cycle through images when hovering
  useEffect(() => {
    let imageInterval;
    
    if (isHovered && product.images && product.images.length > 1) {
      imageInterval = setInterval(() => {
        setActiveImageIndex((prevIndex) => 
          prevIndex === product.images.length - 1 ? 0 : prevIndex + 1
        );
      }, 1200);
    } else {
      setActiveImageIndex(0);
    }
    
    return () => {
      if (imageInterval) clearInterval(imageInterval);
    };
  }, [isHovered, product.images]);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 500);
  };

  // Check if product has multiple images
  const hasMultipleImages = product.images && product.images.length > 1;

  return (
    <div className="relative group">
      <Link 
        to={`/product/${product.id}`} 
        className="block rounded-lg overflow-hidden h-full bg-white shadow-sm hover:shadow-md transition-shadow"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Badge for special status - moved to top-right to avoid collision */}
        {product.badge && (
          <span className="absolute top-2 right-9 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded z-10">
            {product.badge}
          </span>
        )}
        
        {/* Vegetarian tag - top left */}
        {product.isVeg && (
          <span className="absolute top-2 left-2 z-10">
            <div className="w-6 h-6 rounded-sm border border-green-600 flex items-center justify-center bg-white">
              <div className="w-4 h-4 rounded-sm bg-green-600"></div>
            </div>
          </span>
        )}

        {/* Favorite button */}
        <button 
          onClick={handleFavoriteClick}
          className="absolute top-2 right-2 z-10 p-1.5 text-xl"
        >
          {isFavorite ? <FaHeart className="text-cakePink" /> : <FaRegHeart className="text-gray-600" />}
        </button>

        {/* Product image with CSS transition */}
        <div className="aspect-square overflow-hidden bg-gray-100 relative">
          <div className="relative w-full h-full">
            {product.images && product.images.map((image, index) => (
              <img 
                key={index}
                src={image} 
                alt={`${product.name} - ${index + 1}`} 
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                  activeImageIndex === index ? 'opacity-100' : 'opacity-0'
                }`}
                loading="lazy"
              />
            ))}
            
            {/* Image counter indicator */}
            {hasMultipleImages && (
              <div className="absolute bottom-2 right-2 z-10 bg-black/30 text-white text-xs px-2 py-0.5 rounded-full flex items-center">
                <FaImages className="mr-1" />
                <span>{product.images.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* Product details */}
        <div className="p-3">
          <h3 className="text-base font-semibold text-gray-800 line-clamp-2">{product.name}</h3>
          
          <div className="flex justify-between items-center mt-2">
            <div>
              <p className="text-lg font-bold text-cakePink">₹{product.price}
                {product.originalPrice && (
                  <span className="text-sm text-gray-400 line-through ml-2">₹{product.originalPrice}</span>
                )}
              </p>
            </div>
            
            {/* Rating */}
            {product.rating && (
              <div className="flex items-center">
                <span className="text-sm font-medium bg-green-50 text-green-700 px-1.5 py-0.5 rounded flex items-center">
                  {product.rating} ★ 
                </span>
                <span className="text-xs text-gray-500 ml-1">
                  ({product.reviewCount})
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
