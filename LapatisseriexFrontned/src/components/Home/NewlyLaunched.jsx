import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useShopStatus } from '../../context/ShopStatusContext';
import { fetchProducts, makeSelectListByKey, makeSelectLoadingByKey } from '../../redux/productsSlice';
import ProductCard from '../Products/ProductCard';
import DessertLoader from '../common/DessertLoader';

const NewlyLaunched = () => {
  const { shouldShowSection } = useShopStatus();
  const dispatch = useDispatch();

  // Get products from Redux store (keyed list)
  const selectNewlyLaunched = makeSelectListByKey('newlyLaunched');
  const selectLoading = makeSelectLoadingByKey('newlyLaunched');
  const newProducts = useSelector(selectNewlyLaunched);
  const loading = useSelector(selectLoading);

  useEffect(() => {
    dispatch(fetchProducts({ key: 'newlyLaunched', limit: 4, sort: 'createdAt:-1' }));
  }, [dispatch]);

  if (loading) {
    return <DessertLoader />;
  }

  if (!Array.isArray(newProducts) || newProducts.length === 0 || !shouldShowSection()) {
    return null;
  }

  return (
    <section className="w-full py-0 md:py-6 bg-white">
        <div className="max-w-screen-xl mx-auto px-4 pt-6 pb-6 md:pt-0 md:pb-0">
          <h2 className="text-2xl font-light tracking-wide text-left mb-8 text-[#733857]" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            Newly Launched
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {Array.isArray(newProducts) && newProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
      </div>
    </section>
  );
};

export default NewlyLaunched;
