import React from 'react';
import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 pb-8 border-b border-gray-200">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-wide mb-4" style={{ color: '#281c20' }}>
            About <span style={{ color: '#733857' }}>La Pâtisserie</span>
          </h1>
          <p className="text-sm text-gray-500 tracking-wide">The Authentic Tiramisu Experience</p>
        </div>

        {/* Main Content */}
        <div className="space-y-10 text-gray-700">
          
          {/* Our Story */}
          <div className="bg-gray-50 p-8 sm:p-10 border border-gray-200">
            <h2 className="text-2xl sm:text-3xl font-light mb-6 pb-4 border-b border-gray-200" style={{ color: '#281c20' }}>Our Story</h2>
            <p className="text-base leading-relaxed mb-4">
              Welcome to La Pâtisserie, where passion meets perfection in every bite. Founded with a love for authentic Italian desserts, we specialize in crafting the finest Tiramisu that Coimbatore has ever tasted.
            </p>
            <p className="text-base leading-relaxed mb-4">
              Our journey began with a simple mission: to bring the authentic taste of traditional Italian patisserie to India. Each dessert is handcrafted with premium ingredients, following time-honored recipes that have been perfected over generations.
            </p>
            <p className="text-base leading-relaxed">
              From our signature Classic Tiramisu to innovative flavors like Lotus Biscoff and Oreo, every creation is a testament to our commitment to quality and authenticity.
            </p>
          </div>

          {/* Our Values */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-light mb-8 pb-4 border-b border-gray-200" style={{ color: '#281c20' }}>Our Values</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="p-6 border border-gray-200 bg-gray-50">
                <h3 className="text-lg font-medium mb-3" style={{ color: '#733857' }}>Quality Ingredients</h3>
                <p className="text-sm leading-relaxed">
                  We use only the finest, premium ingredients sourced from trusted suppliers to ensure every dessert is exceptional.
                </p>
              </div>
              
              <div className="p-6 border border-gray-200 bg-gray-50">
                <h3 className="text-lg font-medium mb-3" style={{ color: '#733857' }}>Handcrafted with Love</h3>
                <p className="text-sm leading-relaxed">
                  Every dessert is carefully handmade by our skilled pastry chefs who pour their heart into each creation.
                </p>
              </div>
              
              <div className="p-6 border border-gray-200 bg-gray-50">
                <h3 className="text-lg font-medium mb-3" style={{ color: '#733857' }}>Authentic Recipes</h3>
                <p className="text-sm leading-relaxed">
                  Traditional Italian recipes passed down through generations, bringing you the true taste of Italy.
                </p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-gray-50 p-8 sm:p-10 border border-gray-200">
            <h2 className="text-2xl sm:text-3xl font-light mb-6 pb-4 border-b border-gray-200" style={{ color: '#281c20' }}>Visit Us</h2>
            <div className="space-y-4 text-base mb-8">
              <p className="flex items-start">
                <span className="font-medium mr-3" style={{ color: '#733857' }}>Location:</span>
                <span>LIG 208 Gandhi Nagar, Peelamedu, Coimbatore</span>
              </p>
              <p className="flex items-start">
                <span className="font-medium mr-3" style={{ color: '#733857' }}>Phone:</span>
                <a href="tel:+917845712388" className="hover:opacity-70 transition-opacity" style={{ color: '#733857' }}>
                  +91 7845712388
                </a>
              </p>
              <p className="flex items-start">
                <span className="font-medium mr-3" style={{ color: '#733857' }}>Email:</span>
                <a href="mailto:lapatisserielapatisserie@gmail.com" className="hover:opacity-70 transition-opacity break-all" style={{ color: '#733857' }}>
                  lapatisserielapatisserie@gmail.com
                </a>
              </p>
            </div>
            
            <div className="mt-8">
              <Link 
                to="/contact" 
                className="inline-block px-10 py-4 text-sm tracking-wider transition-all hover:opacity-80"
                style={{ 
                  backgroundColor: '#281c20',
                  color: 'white'
                }}
              >
                CONTACT US
              </Link>
            </div>
          </div>

          {/* Commitment */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-light mb-6 pb-4 border-b border-gray-200" style={{ color: '#281c20' }}>Our Commitment</h2>
            <p className="text-base leading-relaxed mb-4">
              At La Pâtisserie, we are committed to delivering not just desserts, but memorable experiences. Every order is prepared with meticulous attention to detail, ensuring that each bite transports you to the heart of Italy.
            </p>
            <p className="text-base leading-relaxed">
              We believe in sustainability, ethical sourcing, and supporting local communities. Our ingredients are carefully selected, and we continuously work to minimize our environmental impact while maximizing flavor and quality.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
