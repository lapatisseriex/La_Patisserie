import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PremiumSectionSkeleton from "../common/PremiumSectionSkeleton";
// Icons
import { FaStar, FaFire, FaNewspaper } from "react-icons/fa";
import { useProduct } from "../../context/ProductContext/ProductContext"; // Import it here

const CategorySwiperHome = ({
  categories = [],
  loading,
  selectedCategory = null,
  onSelectCategory,
  bestSellersRef,
  newlyLaunchedRef,
  bestSellersImage,
  newlyLaunchedImage
}) => {
  const navigate = useNavigate();

  // Refs for auto-scroll and user interaction
  const scrollContainerRef1 = useRef(null);
  const scrollContainerRef2 = useRef(null);
  const autoScrollIntervalRef1 = useRef(null);
  const autoScrollIntervalRef2 = useRef(null);
  const userScrollTimeoutRef = useRef(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  // Handle user scroll interactions
  const handleUserScroll = () => {
    if (!isUserScrolling) {
      setIsUserScrolling(true);
      clearInterval(autoScrollIntervalRef1.current);
      clearInterval(autoScrollIntervalRef2.current);
    }
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
      const navbarHeight = 100;
      const elementPosition =
        sectionRef.current.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - navbarHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  // Auto-scroll logic
  useEffect(() => {
    if (isUserScrolling) return;

    const scrollStep = 1;
    const scrollContainer1 = scrollContainerRef1.current;
    const scrollContainer2 = scrollContainerRef2.current;

    if (!scrollContainer1 || !scrollContainer2) return;

    autoScrollIntervalRef1.current = setInterval(() => {
      if (
        scrollContainer1.scrollLeft + scrollContainer1.clientWidth >=
        scrollContainer1.scrollWidth
      ) {
        scrollContainer1.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        scrollContainer1.scrollBy({ left: scrollStep, behavior: "smooth" });
      }
    }, 50);

    autoScrollIntervalRef2.current = setInterval(() => {
      if (
        scrollContainer2.scrollLeft + scrollContainer2.clientWidth >=
        scrollContainer2.scrollWidth
      ) {
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
      <section className="w-full py-6">
        <div className="max-w-screen-xl mx-auto">
          <PremiumSectionSkeleton 
            variant="category-swiper" 
            showHeader={false}
          />
        </div>
      </section>
    );
  }

  if (!categories.length) {
    return (
      <div className="text-center text-gray-500 py-4 font-sans">
        No categories found.
      </div>
    );
  }
  // Now use the first product's image if available, otherwise fallback
  const specialButtons = [
    {
      id: "best-sellers",
      name: "Best Sellers",
      image: bestSellersImage || "/images/best-sellers.png",
      color: "text-red-600",
      icon: <FaFire className="inline-block mr-1" />,
      ref: bestSellersRef,
    },
    {
      id: "newly-launched",
      name: "Newly Launched",
      image: newlyLaunchedImage || "/images/newlyLaunched.png",
      color: "text-blue-600",
      icon: <FaNewspaper className="inline-block mr-1" />,
      ref: newlyLaunchedRef,
    },
  ];
  

  const interleaveItems = () => {
    const firstRow = [];
    const secondRow = [];

    const half = Math.ceil(categories.length / 2);
    const firstHalf = categories.slice(0, half);
    const secondHalf = categories.slice(half);

    const totalSpecial = specialButtons.length;
    const firstCount = Math.ceil(totalSpecial / 2);
    const secondCount = totalSpecial - firstCount;

    const specialFirst = specialButtons.slice(0, firstCount);
    const specialSecond = specialButtons.slice(firstCount);

    const firstRowPattern = [2];
    const secondRowPattern = [1, 3];

    let firstSpecialIndex = 0;
    for (let i = 0; i < firstHalf.length; i++) {
      firstRow.push(firstHalf[i]);
      if (firstSpecialIndex < specialFirst.length && firstRowPattern.includes(i + 1)) {
        firstRow.push(specialFirst[firstSpecialIndex]);
        firstSpecialIndex++;
      }
    }
    while (firstSpecialIndex < specialFirst.length) {
      firstRow.push(specialFirst[firstSpecialIndex]);
      firstSpecialIndex++;
    }

    let secondSpecialIndex = 0;
    for (let i = 0; i < secondHalf.length; i++) {
      secondRow.push(secondHalf[i]);
      if (secondSpecialIndex < specialSecond.length && secondRowPattern.includes(i + 1)) {
        secondRow.push(specialSecond[secondSpecialIndex]);
        secondSpecialIndex++;
      }
    }
    while (secondSpecialIndex < specialSecond.length) {
      secondRow.push(specialSecond[secondSpecialIndex]);
      secondSpecialIndex++;
    }

    return { firstRow, secondRow };
  };

  const { firstRow, secondRow } = interleaveItems();

  return (
    <div className="w-full py-6 font-sans">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 md:px-16">
        <div className="flex flex-col md:flex-row md:items-start md:gap-8">
          
          {/* Text Section */}
          <div className="w-full md:w-2/5 text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
              Endless Choices, Find Your Next Favorite
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Swipe left or right to explore more
            </p>
            
            {/* Banner Image - Hidden on mobile, visible on larger devices */}
            <div className="hidden md:block mt-6">
              <div className="relative w-full h-48 rounded-lg overflow-hidden shadow-lg">
                <img
                  src="/images/new.jpg"
                  alt="Delicious Cakes Collection"
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  onError={(e) => {
                    // Fallback to a placeholder if image doesn't exist
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial, sans-serif' font-size='16' fill='%236b7280' text-anchor='middle' dy='.3em'%3ECategory Banner%3C/text%3E%3C/svg%3E";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="text-sm font-medium">Fresh Daily</p>
                  <p className="text-xs opacity-90">Premium Quality Cakes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Categories Section */}
          <div className="w-full md:w-3/5 space-y-4 mt-8 md:mt-12">
            <div 
              ref={scrollContainerRef1}
              className="flex overflow-x-auto scrollbar-hide space-x-4 pb-2"
              onScroll={handleUserScroll}
              onTouchStart={handleUserScroll}
              onMouseDown={handleUserScroll}
            >
              {firstRow.map((item, index) => (
                <div 
                  key={item.id || item._id || index}
                  onClick={() =>
                    specialButtons.some(sb => sb.id === item.id)
                      ? handleScrollTo(item.ref)
                      : handleCategoryClick(item._id)
                  }
                  className="flex-shrink-0 w-28 text-center cursor-pointer transition-transform hover:scale-105"
                >
                  <div className="w-20 h-20 mx-auto rounded-full shadow-md hover:shadow-lg flex items-center justify-center">
                    <img
                      src={item.image || item.images?.[0] || '/images/default-category.png'}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-full"
                    />
                  </div>
                  <p className={`text-xs font-medium mt-2 px-1 ${item.color || "text-gray-700"}`}>
                    {item.icon || null}{item.name}
                  </p>
                </div>
              ))}
            </div>

            <div 
              ref={scrollContainerRef2}
              className="flex overflow-x-auto scrollbar-hide space-x-4 pb-2"
              onScroll={handleUserScroll}
              onTouchStart={handleUserScroll}
              onMouseDown={handleUserScroll}
            >
              {secondRow.map((item, index) => (
                <div 
                  key={item.id || item._id || index}
                  onClick={() =>
                    specialButtons.some(sb => sb.id === item.id)
                      ? handleScrollTo(item.ref)
                      : handleCategoryClick(item._id)
                  }
                  className="flex-shrink-0 w-28 text-center cursor-pointer transition-transform hover:scale-105"
                >
                  <div className="w-20 h-20 mx-auto rounded-full shadow-md hover:shadow-lg flex items-center justify-center">
                    <img
                      src={item.image || item.images?.[0] || '/images/default-category.png'}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-full"
                    />
                  </div>
                  <p className={`text-xs font-medium mt-2 px-1 ${item.color || "text-gray-700"}`}>
                    {item.icon || null}{item.name}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CategorySwiperHome;
