import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, makeSelectListByKey, makeSelectLoadingByKey } from '../../redux/productsSlice';
import ProductCard from '../Products/ProductCard';
import './gridResponsive.css';
import PremiumSectionSkeleton from '../common/PremiumSectionSkeleton';

const HandpickedForYou = () => {
  const dispatch = useDispatch();
  const selectList = makeSelectListByKey('handpicked');
  const selectLoading = makeSelectLoadingByKey('handpicked');
  const products = useSelector(selectList);
  const loading = useSelector(selectLoading);

  useEffect(() => {
    // Stagger slightly to avoid hammering the API together with other homepage calls
    const t = setTimeout(() => {
      dispatch(fetchProducts({ key: 'handpicked', limit: 20, sort: 'createdAt:-1' }));
    }, 200);
    return () => clearTimeout(t);
  }, [dispatch]);

  // Memoize the shuffled and sliced products
  const handpickedProducts = useMemo(() => {
    if (!products?.length) return [];
    const shuffledProducts = [...products].sort(() => Math.random() - 0.5);
    return shuffledProducts.slice(0, 3);
  }, [products]);

  if (loading) {
    return (
      <section className="w-full py-0 md:py-6">
        <div className="max-w-screen-xl mx-auto pt-6 pb-6 md:pt-0 md:pb-0">
          <PremiumSectionSkeleton 
            variant="products" 
            count={3}
            title="Handpicked for You"
            showHeader={true}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-0 md:py-6 bg-white">
      <div className="max-w-screen-xl mx-auto px-4 pt-6 pb-6 md:pt-0 md:pb-0">
        <div className="mb-8">
          <h2 className="text-2xl font-light tracking-wide text-center md:text-center text-[#733857]" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            Handpicked for You
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full min-w-0 grid-3-at-976">
          {handpickedProducts.map(product => (
            <div key={product._id} className="min-w-0 w-full flex">
              <ProductCard product={product} className="min-w-0 w-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HandpickedForYou;
