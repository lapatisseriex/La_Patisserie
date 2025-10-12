import { useSelector } from 'react-redux';
import { makeSelectListByKey, makeSelectLoadingByKey, selectHasBestSellers } from '../../redux/productsSlice';
import ProductCard from "../Products/ProductCard";
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
    <section className="w-full py-0 md:py-6 bg-white">
      <div className="max-w-screen-xl mx-auto px-4 pt-6 pb-6 md:pt-0 md:pb-0">
        <div className="mb-8">
          <h2 className="text-2xl font-light tracking-wide text-left text-[#733857]" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            Best Sellers
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map(product => (
            <div key={product._id}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BestSellers;
