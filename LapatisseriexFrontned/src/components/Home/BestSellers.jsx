import { useSelector } from 'react-redux';
import { useRef } from 'react';
import { makeSelectListByKey, makeSelectLoadingByKey, selectHasBestSellers } from '../../redux/productsSlice';
import ProductCard from "../Products/ProductCard";
import RollingGallery from "../common/RollingGallery";
import './gridResponsive.css';
import DessertLoader from "../common/DessertLoader";

// BestSellers.jsx
const BestSellers = () => {
  const selectProducts = makeSelectListByKey('bestSellers');
  const selectLoading = makeSelectLoadingByKey('bestSellers');
  const products = useSelector(selectProducts);
  const loading = useSelector(selectLoading);
  const hasBestSellers = useSelector(selectHasBestSellers);
  const scrollContainerRef = useRef(null);

  // Show loading state
  if (loading) {
    return (
      <section className="w-full py-0 md:py-6">
        <div className="max-w-screen-xl mx-auto pt-6 pb-6 md:pt-0 md:pb-0">
          <DessertLoader 
            variant="cupcake" 
            message="Loading our best sellers..."
          />
        </div>
      </section>
    );
  }

  // Don't render anything if there are no best sellers
  if (!hasBestSellers || !products || products.length === 0) {
    return null;
  }

  return (
    <section className="w-full bg-white">
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-4">
        <div className="mb-8">
          <h2 className="text-2xl font-light tracking-wide text-center md:text-center text-[#733857]" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            Best Sellers
          </h2>
          <p className="text-sm sm:text-base text-center md:text-center text-gray-600 mt-2 font-light">
            Our most loved creations
          </p>
        </div>
        
        {/* Desktop: Use RollingGallery with animations */}
        <div className="hidden md:block">
          <RollingGallery 
            items={products.map(product => ({
              key: product._id,
              content: (
                <div className="min-w-0 w-full flex transform transition-all duration-300 ease-out hover:scale-102 focus:scale-102 active:scale-98">
                  <ProductCard product={product} className="min-w-0 w-full transition-shadow" />
                </div>
              )
            }))}
          />
        </div>

        {/* Mobile: Simple horizontal scroll without animations */}
        <div className="block md:hidden">
          <div 
            ref={scrollContainerRef}
            className="flex overflow-x-auto gap-3 pb-4 snap-x snap-mandatory scrollbar-hide"
            style={{
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {products.map((product) => (
              <div 
                key={product._id}
                className="flex-shrink-0 w-[85vw] max-w-[320px] snap-center"
              >
                <ProductCard product={product} className="w-full h-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BestSellers;
