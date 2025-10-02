import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, makeSelectListByKey, makeSelectLoadingByKey } from '../../redux/productsSlice';
import ProductCard from '../Products/ProductCard';
import PremiumSectionSkeleton from '../common/PremiumSectionSkeleton';

const HandpickedForYou = () => {
  const dispatch = useDispatch();
  const selectList = makeSelectListByKey('handpicked');
  const selectLoading = makeSelectLoadingByKey('handpicked');
  const products = useSelector(selectList);
  const loading = useSelector(selectLoading);

  useEffect(() => {
    dispatch(fetchProducts({ key: 'handpicked', limit: 20, sort: 'createdAt:-1' }));
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
    <section className="w-full py-0 md:py-6">
      <div className="max-w-screen-xl mx-auto px-4 pt-6 pb-6 md:pt-0 md:pb-0">
        <div className="mb-8 space-y-3">
          <h2 className="text-2xl font-bold tracking-wide text-left" style={{ 
            background: 'linear-gradient(135deg, #e0a47d 0%, #c17e5b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0px 0px 1px rgba(224, 164, 125, 0.2)'
          }}>
            Handpicked for You
          </h2>
         
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {handpickedProducts.map(product => (
            <div key={product._id}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HandpickedForYou;
