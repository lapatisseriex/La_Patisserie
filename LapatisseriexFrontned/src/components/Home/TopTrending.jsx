import React, { useEffect, useState } from 'react';
import { useProduct } from '../../context/ProductContext/ProductContext';
import ProductCard from '../products/ProductCard';

const TopTrending = () => {
  const { fetchProducts } = useProduct();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const loadTopTrending = async () => {
      try {
        const trending = await fetchProducts({
          limit: 3,
          sort: 'soldCount:-1' // Change 'soldCount' to any other key if needed
        });
        setProducts(trending.products);
      } catch (err) {
        console.error("Error loading Top Trending products:", err);
      }
    };
    loadTopTrending();
  }, [fetchProducts]);

  return (
    <section className="w-full py-10 bg-gray-50">
      <h2 className="text-xl font-bold text-black uppercase tracking-wide mb-4 text-center">
        Top Trending
      </h2>
      <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {products.map(product => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
};

export default TopTrending;
