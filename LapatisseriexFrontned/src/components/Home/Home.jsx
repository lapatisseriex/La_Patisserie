import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCategory } from '../../context/CategoryContext/CategoryContext';
import { useProduct } from '../../context/ProductContext/ProductContext';
import { useAuth } from '../../context/AuthContext/AuthContext';

import BrowseCategories from './BrowseCategories';

const Home = () => {
  const headingRef = useRef(null);
  const textRef = useRef(null);
  const buttonsRef = useRef(null);
  const imageRef = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const { categories, fetchCategories, loading: loadingCategories } = useCategory();
  const { fetchProducts } = useProduct();
  const { isAuthenticated } = useAuth();
  const [categoriesWithProducts, setCategoriesWithProducts] = useState([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        await fetchCategories(false);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    loadCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (!categories.length) return;
    const loadFirstProducts = async () => {
      try {
        const promises = categories.map(async (category) => {
          const result = await fetchProducts({
            category: category._id,
            limit: 1,
            sort: 'createdAt:-1'
          });
          return {
            ...category,
            firstProduct: result.products[0] || null
          };
        });
        const results = await Promise.all(promises);
        setCategoriesWithProducts(results);
      } catch (err) {
        console.error("Error fetching first products:", err);
      }
    };
    loadFirstProducts();
  }, [categories, fetchProducts]);

  useEffect(() => {
    const fadeInElements = (element, delay) => {
      setTimeout(() => {
        if (element.current) {
          element.current.style.opacity = '1';
          element.current.style.transform = 'translateY(0)';
        }
      }, delay);
    };
    fadeInElements(headingRef, 300);
    fadeInElements(textRef, 600);
    fadeInElements(buttonsRef, 900);
    fadeInElements(imageRef, 600);
  }, []);

  return (
    <div className="bg-white flex flex-col items-center">

      {/* Hero Section */}
     
      {/* Browse Categories Section - Visible to all users */}
      <section className="w-full py-4 sm:py-6 md:py-8 bg-white">
        <BrowseCategories categories={categoriesWithProducts} />
      </section>

      {/* Category Slider Section - Only for authenticated users */}
   

      {/* Product Slider Section */}
    
    
    </div>
  );
};

export default Home;







