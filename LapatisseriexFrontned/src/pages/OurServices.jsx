import React from 'react';
import { Link } from 'react-router-dom';

const OurServices = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] py-4 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-light text-white mb-4">
            Our Services
          </h1>
          <p className="text-gray-300 text-lg">
            Delivering authentic desserts with excellence
          </p>
        </div>

        {/* Services Grid */}
        <div className="space-y-8">
          {/* Exclusive Delivery */}
          <div className="border border-white/10 p-8 md:p-10">
            <h2 className="text-2xl font-medium text-white mb-6 border-b border-white/10 pb-2">Exclusive Delivery Service</h2>
            <p className="text-gray-300 leading-relaxed mb-6 text-lg">
              We specialize in delivering fresh cakes, pastries, and desserts directly to college hostels and select locations. Our service is tailored for students, ensuring timely and safe delivery right to your hostel room or campus common area.
            </p>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start">
                <span className="text-purple-500 mr-3 mt-1">✓</span>
                <span>Order from a curated menu of best sellers, newly launched treats, and handpicked recommendations</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-3 mt-1">✓</span>
                <span>Enjoy special offers and combos designed for student groups and celebrations</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-3 mt-1">✓</span>
                <span>Track your order and get real-time updates on delivery status</span>
              </li>
            </ul>
          </div>

          {/* Payment Options */}
          <div className="border border-white/10 p-8 md:p-10">
            <h2 className="text-2xl font-medium text-white mb-6 border-b border-white/10 pb-2">Flexible Payment Options</h2>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start">
                <span className="text-[#A855F7] mr-3 mt-1">✓</span>
                <span>Pay easily using UPI apps (Google Pay, PhonePe, Paytm, etc.)</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#A855F7] mr-3 mt-1">✓</span>
                <span>Secure online payment through Razorpay gateway</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#A855F7] mr-3 mt-1">✓</span>
                <span>Cash on Delivery (COD) available for all hostel and campus orders</span>
              </li>
            </ul>
          </div>

          {/* Why Choose Us */}
          <div className="border border-white/10 p-8 md:p-10">
            <h2 className="text-2xl font-medium text-white mb-6 border-b border-white/10 pb-2">Why Choose La Pâtisserie?</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start">
                <span className="text-[#A855F7] mr-3 mt-1">✓</span>
                <span className="text-gray-300">Freshly baked products made daily with premium ingredients</span>
              </div>
              <div className="flex items-start">
                <span className="text-[#A855F7] mr-3 mt-1">✓</span>
                <span className="text-gray-300">Special sections like Best Sellers, Newly Launched, and Handpicked For You</span>
              </div>
              <div className="flex items-start">
                <span className="text-[#A855F7] mr-3 mt-1">✓</span>
                <span className="text-gray-300">Recently Viewed and Cart Picked For You features</span>
              </div>
              <div className="flex items-start">
                <span className="text-[#A855F7] mr-3 mt-1">✓</span>
                <span className="text-gray-300">Easy browsing by category and seamless ordering process</span>
              </div>
              <div className="flex items-start">
                <span className="text-[#A855F7] mr-3 mt-1">✓</span>
                <span className="text-gray-300">Responsive customer support for all your queries</span>
              </div>
              <div className="flex items-start">
                <span className="text-[#A855F7] mr-3 mt-1">✓</span>
                <span className="text-gray-300">Authentic Italian recipes with premium quality</span>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="border border-white/10 p-8 md:p-10 text-center">
            <h3 className="text-2xl md:text-3xl font-light text-white mb-4">
              Experience the Best of Bakery Delights
            </h3>
            <p className="text-gray-300 mb-6 text-lg">
              Delivered exclusively for students. Place your order today!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/products"
                className="inline-block bg-white text-black px-8 py-3 hover:bg-gray-100 transition-colors"
              >
                BROWSE PRODUCTS
              </Link>
              <Link 
                to="/contact"
                className="inline-block bg-white text-black px-8 py-3 hover:bg-gray-100 transition-colors"
              >
                CONTACT US
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="mt-16 bg-[#0a0a0a] py-12 border-t border-[#733857]/30">
          <div className="max-w-5xl mx-auto text-center px-4">
            <h3 className="text-2xl font-light bg-gradient-to-r from-[#A855F7] via-[#ec4899] to-[#A855F7] bg-clip-text text-transparent mb-4">La Pâtisserie</h3>
            <p className="text-gray-300 mb-6">The Authentic Tiramisu Experience</p>
            <div className="space-y-2 text-gray-400 mb-8">
              <p>LIG 208 Gandhi Nagar, Peelamedu, Coimbatore</p>
              <p>Phone: <a href="tel:+917845712388" className="text-[#A855F7] hover:text-white transition-colors">+91 7845712388</a></p>
              <p>Email: <a href="mailto:lapatisserielapatisserie@gmail.com" className="text-[#A855F7] hover:text-white transition-colors">lapatisserielapatisserie@gmail.com</a></p>
            </div>
            <Link 
              to="/contact" 
              className="inline-block bg-white text-black px-8 py-3 hover:bg-gray-100 transition-colors"
            >
              CONTACT US
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OurServices;
