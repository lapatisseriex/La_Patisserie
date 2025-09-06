import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import ProductGrid from './ProductGrid';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const Products = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [regularProducts, setRegularProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to fetch products
    setTimeout(() => {
      // Featured products for carousel
      const featured = [
        {
          id: "f1",
          name: "Chocolate Truffle",
          images: ["/images/cake1.png"],
          price: "1299",
          badge: "Best Seller",
          isVeg: true,
          rating: 4.9,
          reviewCount: 28,
          description: "Rich, decadent chocolate truffle cake layered with premium cocoa and topped with chocolate ganache."
        },
        {
          id: "f2",
          name: "Strawberry Cheesecake",
          images: ["/images/cake2.png"],
          price: "1199",
          badge: "Popular",
          isVeg: true,
          rating: 4.8,
          reviewCount: 24,
          description: "Creamy cheesecake with a buttery graham cracker crust, topped with fresh strawberry compote."
        },
        {
          id: "f3",
          name: "Vanilla Dream",
          images: ["/images/cake3.png"],
          price: "999",
          isVeg: true,
          rating: 4.7,
          reviewCount: 19,
          description: "Light and fluffy vanilla sponge cake with a delicate buttercream frosting and subtle vanilla notes."
        },
        {
          id: "f4",
          name: "Blueberry Delight",
          images: ["/images/cake1.png"],
          price: "1099",
          isVeg: true,
          rating: 4.6,
          reviewCount: 15,
          description: "Moist blueberry-infused cake with cream cheese frosting and fresh blueberry garnish."
        }
      ];
      
      // Regular products for grid display
      const regular = [
        {
          id: '1',
          name: 'First Birthday Mickey Cake',
          price: '1499',
          badge: '',
          isVeg: true,
          rating: 5,
          reviewCount: 2,
          coupon: 'CAKE10',
          images: [
            '/images/cake1.png',
            '/images/cake2.png',
            '/images/cake3.png'
          ]
        },
        {
          id: '2',
          name: 'Round Cream Happy Birthday Pink Cake',
          price: '675',
          badge: 'Best Seller',
          isVeg: true,
          rating: 5,
          reviewCount: 11,
          coupon: 'FIRST50',
          images: [
            '/images/cake2.png',
            '/images/cake1.png',
            '/images/cake3.png'
          ]
        },
        {
          id: '3',
          name: 'Pastel Paradise Birthday Cake',
          price: '2399',
          badge: '',
          isVeg: true,
          rating: 4.9,
          reviewCount: 10,
          images: [
            '/images/cake3.png',
            '/images/cake1.png',
            '/images/cake2.png'
          ]
        },
        {
          id: '4',
          name: 'First Bday Photo Cake',
          price: '749',
          originalPrice: '899',
          badge: 'Personalised',
          isVeg: true,
          rating: 5,
          reviewCount: 25,
          coupon: 'SAVE150',
          images: [
            '/images/cake1.png',
            '/images/cake3.png',
            '/images/cake2.png'
          ]
        },
        {
          id: '5',
          name: 'Chocolate Truffle Cake',
          price: '899',
          badge: '',
          isVeg: true,
          rating: 4.8,
          reviewCount: 15,
          coupon: 'CHOC20',
          images: [
            '/images/cake2.png',
            '/images/cake1.png',
            '/images/cake3.png'
          ]
        },
        {
          id: '6',
          name: 'Butterscotch Delight Cake',
          price: '950',
          badge: '',
          isVeg: true,
          rating: 4.7,
          reviewCount: 8,
          images: [
            '/images/cake3.png',
            '/images/cake2.png',
            '/images/cake1.png'
          ]
        },
        {
          id: '7',
          name: 'Red Velvet Cake',
          price: '1299',
          badge: 'Popular',
          isVeg: true,
          rating: 4.9,
          reviewCount: 22,
          images: [
            '/images/cake1.png',
            '/images/cake3.png',
            '/images/cake2.png'
          ]
        },
        {
          id: '8',
          name: 'Black Forest Cake',
          price: '850',
          badge: '',
          isVeg: true,
          rating: 4.6,
          reviewCount: 18,
          images: [
            '/images/cake2.png',
            '/images/cake1.png',
            '/images/cake3.png'
          ]
        }
      ];

      setFeaturedProducts(featured);
      setRegularProducts(regular);
      setIsLoading(false);
    }, 800);
  }, []);

  return (
    <section className="bg-gradient-to-b from-white to-cakePink-light/20 py-20 mt-8 pt-6" id="product">
      <div className="container mx-auto px-4">
        
        {/* Section Heading */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-cakeBrown relative inline-block">
            Our Exclusive Products
            <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3/4 h-1 bg-cakePink-dark"></span>
          </h2>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
            Handcrafted with love and premium ingredients for your special moments
          </p>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cakePink"></div>
          </div>
        ) : (
          <>
            {/* Featured Products Carousel */}
            <div className="mb-16">
           
            </div>
            
            {/* Regular Products Grid */}
            <ProductGrid products={regularProducts} title="All Cakes & Desserts" />
          </>
        )}
      </div>
    </section>
  );
};

export default Products;
