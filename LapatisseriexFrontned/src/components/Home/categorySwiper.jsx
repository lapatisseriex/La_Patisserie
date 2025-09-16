import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
// Icons
import { FaStar, FaFire, FaNewspaper } from "react-icons/fa";

const CategorySwiperHome = ({
  categories = [],
  loading,
  selectedCategory = null,
  onSelectCategory,
  topTrendingRef,
  bestSellersRef,
  newlyLaunchedRef,
}) => {
  const navigate = useNavigate();

  const scrollContainerRef1 = useRef(null);
  const scrollContainerRef2 = useRef(null);
  const autoScrollIntervalRef1 = useRef(null);
  const autoScrollIntervalRef2 = useRef(null);
  const userScrollTimeoutRef = useRef(null);

  const [isUserScrolling, setIsUserScrolling] = useState(false);

  const handleUserScroll = () => {
    setIsUserScrolling(true);
    clearInterval(autoScrollIntervalRef1.current);
    clearInterval(autoScrollIntervalRef2.current);
    if (userScrollTimeoutRef.current) clearTimeout(userScrollTimeoutRef.current);
    userScrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 5000);
  };

  const handleCategoryClick = (categoryId) => {
    navigate(`/products?category=${categoryId}`, { replace: true });
    if (onSelectCategory) onSelectCategory(categoryId);
  };

  const handleScrollTo = (sectionRef) => {
    if (sectionRef?.current) {
      const navbarHeight = 100; // Adjust for fixed navbar
      const elementPosition =
        sectionRef.current.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - navbarHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  // Auto-scroll logic for both rows
  useEffect(() => {
    if (isUserScrolling) return;

    const scrollStep = 1;
    
    const scrollContainer1 = scrollContainerRef1.current;
    const scrollContainer2 = scrollContainerRef2.current;
    
    if (!scrollContainer1 || !scrollContainer2) return;

    autoScrollIntervalRef1.current = setInterval(() => {
      if (scrollContainer1.scrollLeft + scrollContainer1.clientWidth >= scrollContainer1.scrollWidth) {
        scrollContainer1.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        scrollContainer1.scrollBy({ left: scrollStep, behavior: "smooth" });
      }
    }, 50);

    autoScrollIntervalRef2.current = setInterval(() => {
      if (scrollContainer2.scrollLeft + scrollContainer2.clientWidth >= scrollContainer2.scrollWidth) {
        scrollContainer2.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        scrollContainer2.scrollBy({ left: scrollStep, behavior: "smooth" });
      }
    }, 50);

    return () => {
      clearInterval(autoScrollIntervalRef1.current);
      clearInterval(autoScrollIntervalRef2.current);
    };
  }, [isUserScrolling]);

  if (loading) {
    return (
      <div className="text-center py-4 font-sans">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    );
  }

  if (!categories.length) {
    return (
      <div className="text-center text-gray-500 py-4 font-sans">
        No categories found.
      </div>
    );
  }

  // Define special buttons with refs from props
  const specialButtons = [
    { id: "top-trending", name: "Top Trending", icon: <FaStar size={28} className="text-yellow-500" />, ref: topTrendingRef },
    { id: "best-sellers", name: "Best Sellers", icon: <FaFire size={28} className="text-red-500" />, ref: bestSellersRef },
    { id: "newly-launched", name: "Newly Launched", icon: <FaNewspaper size={28} className="text-blue-500" />, ref: newlyLaunchedRef }
  ];

  // Combine special buttons with categories
  const allItems = [...specialButtons, ...categories];
  
  // Split into two rows - first row gets more items if odd count
  const half = Math.ceil(allItems.length / 2);
  const firstRowItems = allItems.slice(0, half);
  const secondRowItems = allItems.slice(half);

  return (
    <div className="w-full bg-gray-100 py-6 font-sans">
      <div className="flex flex-col md:flex-row max-w-screen-xl mx-auto px-4 sm:px-6 md:px-16 md:space-x-40">
        {/* Left text */}
        <div className="md:w-10/2 text-center md:text-left py-4 mb-6 md:mb-0">
          <p className="text-sm text-gray-500 uppercase mb-2 font-medium">Discover Categories</p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            Browse through our categories and find what inspires you
          </h2>
          <p className="text-xs text-gray-500 hidden md:block">
            Swipe left or right to explore more
          </p>
        </div>

        {/* Right content with two scrollable rows */}
        <div className="md:w-3/5 space-y-4">
          {/* First row */}
          <div 
            ref={scrollContainerRef1}
            className="flex overflow-x-auto scrollbar-hide space-x-4 pb-2"
            onScroll={handleUserScroll}
            onTouchStart={handleUserScroll}
            onMouseDown={handleUserScroll}
          >
            {firstRowItems.map((item) => (
              <div 
                key={item.id || item._id}
                onClick={() => 
                  specialButtons.some(sb => sb.id === item.id) 
                    ? handleScrollTo(item.ref) 
                    : handleCategoryClick(item._id)
                }
                className="flex-shrink-0 w-20 text-center cursor-pointer transition-transform hover:scale-105"
              >
                <div className="w-20 h-20 mx-auto bg-white rounded-full shadow-md hover:shadow-lg flex items-center justify-center">
                  {item.icon ? (
                    item.icon
                  ) : (
                    <img
                      src={item.images?.[0] || '/images/default-category.png'}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-full"
                    />
                  )}
                </div>
                <p className="text-xs font-medium text-gray-700 mt-2 truncate px-1">{item.name}</p>
              </div>
            ))}
          </div>

          {/* Second row */}
          <div 
            ref={scrollContainerRef2}
            className="flex overflow-x-auto scrollbar-hide space-x-4 pb-2"
            onScroll={handleUserScroll}
            onTouchStart={handleUserScroll}
            onMouseDown={handleUserScroll}
          >
            {secondRowItems.map((item) => (
              <div 
                key={item.id || item._id}
                onClick={() => 
                  specialButtons.some(sb => sb.id === item.id) 
                    ? handleScrollTo(item.ref) 
                    : handleCategoryClick(item._id)
                }
                className="flex-shrink-0 w-20 text-center cursor-pointer transition-transform hover:scale-105"
              >
                <div className="w-20 h-20 mx-auto bg-white rounded-full shadow-md hover:shadow-lg flex items-center justify-center">
                  {item.icon ? (
                    item.icon
                  ) : (
                    <img
                      src={item.images?.[0] || '/images/default-category.png'}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-full"
                    />
                  )}
                </div>
                <p className="text-xs font-medium text-gray-700 mt-2 truncate px-1">{item.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategorySwiperHome;