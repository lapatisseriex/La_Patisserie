import React, { useEffect, useState } from 'react';
import { useProduct } from '../../context/ProductContext/ProductContext';
import ProductCard from '../Products/ProductCard';

const NewlyLaunched = () => {
  const { fetchProducts } = useProduct();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const loadNewlyLaunched = async () => {
      try {
        const newly = await fetchProducts({
          limit: 3,
          sort: 'createdAt:-1'
        });
        setProducts(newly.products);
      } catch (err) {
        console.error("Error loading Newly Launched products:", err);
      }
    };
    loadNewlyLaunched();
  }, [fetchProducts]);

  return (
    <section className="w-full py-6 bg-gray-50">
      <h2 className="text-xl font-bold text-black uppercase tracking-wide mb-4 text-center">
        Newly Launched
      </h2>
      <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {products.map(product => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
};

export default NewlyLaunched;
