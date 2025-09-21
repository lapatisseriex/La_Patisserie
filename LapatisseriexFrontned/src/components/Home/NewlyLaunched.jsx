import React, { useEffect, useState } from 'react';
import { useProducts } from '../../context/ProductContext/ProductContext';
import { useShopStatus } from '../../context/ShopStatusContext';
import ProductCard from '../Products/ProductCard';
import DessertLoader from '../common/DessertLoader';

const NewlyLaunched = () => {
  const { shouldShowSection } = useShopStatus();
  const { fetchProducts } = useProducts();
  const [newProducts, setNewProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNewProducts = async () => {
      try {
        setLoading(true);
        const response = await fetchProducts({
          limit: 4,
          sort: 'createdAt:-1'
        });
        // Extract products array from the response object
        const products = response?.products || [];
        setNewProducts(products);
      } catch (error) {
        console.error('Error fetching new products:', error);
        setNewProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNewProducts();
  }, [fetchProducts]);

  if (loading) {
    return <DessertLoader />;
  }

  if (!Array.isArray(newProducts) || newProducts.length === 0 || !shouldShowSection()) {
    return null;
  }

  return (
    <section className="w-full py-0 md:py-6">
        <div className="max-w-screen-xl mx-auto px-4 pt-6 pb-6 md:pt-0 md:pb-0">
          <h2 className="text-2xl font-bold tracking-wide text-left mb-8" style={{ 
            background: 'linear-gradient(135deg, #e0a47d 0%, #c17e5b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0px 0px 1px rgba(224, 164, 125, 0.2)'
          }}>
            Newly Launched
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.isArray(newProducts) && newProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
      </div>
    </section>
  );
};

export default NewlyLaunched;
