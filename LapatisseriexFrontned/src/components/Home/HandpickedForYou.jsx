import React, { useEffect, useState } from 'react';
import { useProduct } from '../../context/ProductContext/ProductContext';
import ProductCard from '../Products/ProductCard';

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
    <div className="max-w-screen-xl mx-auto px-4">
        <h2 className="text-xl font-bold text-black uppercase tracking-wide mb-4 text-left">
          Handpicked for You
        </h2>
        <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                <div className="w-full aspect-square bg-gray-200 rounded-lg mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="w-full py-6 ">
      <h2 className="text-xl font-bold text-black uppercase tracking-wide mb-4 text-center">
        Handpicked for You
      </h2>
      <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {products.map(product => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
};

export default HandpickedForYou;
