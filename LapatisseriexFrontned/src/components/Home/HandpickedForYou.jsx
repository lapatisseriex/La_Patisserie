import React, { useEffect, useState } from 'react';
import { useProduct } from '../../context/ProductContext/ProductContext';
import ProductCard from '../Products/ProductCard';
import PremiumSectionSkeleton from '../common/PremiumSectionSkeleton';

const HandpickedForYou = () => {
  const { fetchProducts } = useProduct();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHandpickedProducts = async () => {
      try {
        setLoading(true);
        // Fetch more products than needed so we can randomize
        const result = await fetchProducts({
          limit: 20, // Fetch 20 products to randomize from
          sort: 'createdAt:-1'
        });
        
        // Shuffle the products and take first 3
        const shuffledProducts = [...result.products].sort(() => Math.random() - 0.5);
        const randomProducts = shuffledProducts.slice(0, 3);
        
        setProducts(randomProducts);
      } catch (err) {
        console.error("Error loading Handpicked products:", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadHandpickedProducts();
  }, [fetchProducts]);

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

export default HandpickedForYou;
