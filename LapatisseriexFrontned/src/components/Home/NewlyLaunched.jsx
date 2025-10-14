import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useShopStatus } from '../../context/ShopStatusContext';
import { fetchProducts, makeSelectListByKey, makeSelectLoadingByKey } from '../../redux/productsSlice';
import ProductCard from '../Products/ProductCard';
import './gridResponsive.css';
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
    return (
      <section className="w-full py-0 md:py-6">
        <div className="max-w-screen-xl mx-auto pt-6 pb-6 md:pt-0 md:pb-0">
          <DessertLoader />
        </div>
      </section>
    );
  }

  if (!Array.isArray(newProducts) || newProducts.length === 0 || !shouldShowSection()) {
    return null;
  }

  return (
    <section className="w-full py-0 md:py-6 bg-white">
        <div className="max-w-screen-xl mx-auto px-4 pt-6 pb-6 md:pt-0 md:pb-0">
          <div className="mb-8">
            <h2 className="text-2xl font-light tracking-wide text-left text-[#733857]" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Newly Launched
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full min-w-0 grid-3-at-976">
            {Array.isArray(newProducts) && newProducts.slice(0, 3).map((product) => (
              <div key={product._id} className="min-w-0 w-full flex">
                <ProductCard product={product} className="min-w-0 w-full" />
              </div>
            ))}
          </div>
      </div>
    </section>
  );
};

export default NewlyLaunched;
