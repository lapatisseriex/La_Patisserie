import React, { useEffect, useState } from 'react';
import ProductCard from '../Products/ProductCard';

// NewlyLaunched.jsx
const NewlyLaunched = ({ products }) => {
  return (
    <section className="w-full py-6 bg-gray-50">
      <div className="max-w-screen-xl mx-auto px-4">
        <h2 className="text-xl font-bold text-black uppercase tracking-wide mb-4 text-left">
          Newly Launched
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {products.map(product => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewlyLaunched;
