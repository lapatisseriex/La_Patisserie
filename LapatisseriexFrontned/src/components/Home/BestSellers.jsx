import React, { useEffect, useState } from 'react';
import { useProduct } from '../../context/ProductContext/ProductContext';
import ProductCard from '../products/ProductCard';

const BestSellers = () => {
  const { fetchProducts } = useProduct();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const loadBestSellers = async () => {
      try {
        const best = await fetchProducts({
          limit: 3,
          sort: 'rating:-1' // Change 'rating' to any other key if needed
        });
        setProducts(best.products);
      } catch (err) {
        console.error("Error loading Best Sellers products:", err);
      }
    };
    loadBestSellers();
  }, [fetchProducts]);

  return (
    <section className="w-full py-6 bg-white">
      <h2 className="text-xl font-bold text-black uppercase tracking-wide mb-4 text-center">
        Best Sellers
      </h2>
      <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {products.map(product => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
};

export default BestSellers;
