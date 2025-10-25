import { useSelector } from 'react-redux';
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
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent" style={{ 
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            Best Sellers
          </h2>
          <p className="text-sm sm:text-base text-center text-gray-600 mt-2 font-light">
            Our most loved creations
          </p>
        </div>
        
      <RollingGallery 
          items={products.map(product => ({
            key: product._id,
            content: (
              <div className="min-w-0 w-full flex transform transition-all duration-300 ease-out hover:scale-102 focus:scale-102 active:scale-98">
                <ProductCard product={product} className="min-w-0 w-full  transition-shadow" />
              </div>
            )
          }))}
        />
      </div>
    </section>
  );
};

export default BestSellers;
