import React from 'react';
import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative py-12 px-4 border-b border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-light text-white mb-4 tracking-wide">
            About <span className="text-[#A855F7]">La Pâtisserie</span>
          </h1>
          <p className="text-base text-gray-400 tracking-wide">
            The Authentic Tiramisu Experience
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Our Story */}
        <div className="bg-[#151515] p-10 mb-8 border border-white/10">
          <h2 className="text-2xl font-light text-[#A855F7] mb-6 tracking-wide border-b border-white/10 pb-4">Our Story</h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            Welcome to La Pâtisserie, where passion meets perfection in every bite. Founded with a love for authentic Italian desserts, we specialize in crafting the finest Tiramisu that Coimbatore has ever tasted.
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            Our journey began with a simple mission: to bring the authentic taste of traditional Italian patisserie to India. Each dessert is handcrafted with premium ingredients, following time-honored recipes that have been perfected over generations.
          </p>
          <p className="text-gray-300 leading-relaxed">
            From our signature Classic Tiramisu to innovative flavors like Lotus Biscoff and Oreo, every creation is a testament to our commitment to quality and authenticity.
          </p>
        </div>

        {/* Our Values */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="p-8 border border-white/10">
            <h3 className="text-lg font-medium text-white mb-3">Quality Ingredients</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              We use only the finest, premium ingredients sourced from trusted suppliers to ensure every dessert is exceptional.
            </p>
          </div>
          
          <div className="p-8 border border-white/10">
            <h3 className="text-lg font-medium text-white mb-3">Handcrafted with Love</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Every dessert is carefully handmade by our skilled pastry chefs who pour their heart into each creation.
            </p>
          </div>
          
          <div className="p-8 border border-white/10">
            <h3 className="text-lg font-medium text-white mb-3">Authentic Recipes</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Traditional Italian recipes passed down through generations, bringing you the true taste of Italy.
            </p>
          </div>
        </div>

        {/* Location */}
        <div className=" p-10 border border-white/10">
          <h2 className="text-2xl font-light text-[#A855F7] mb-6 tracking-wide border-b border-white/10 pb-4">Visit Us</h2>
          <div className="space-y-3 text-gray-300 mb-8">
            <p className="flex items-start">
              <span className="text-[#A855F7] mr-3 font-light">Location:</span>
              <span>LIG 208 Gandhi Nagar, Peelamedu, Coimbatore</span>
            </p>
            <p className="flex items-start">
              <span className="text-[#A855F7] mr-3 font-light">Phone:</span>
              <a href="tel:+917845712388" className="hover:text-[#A855F7] transition-colors">
                +91 7845712388
              </a>
            </p>
            <p className="flex items-start">
              <span className="text-[#A855F7] mr-3 font-light">Email:</span>
              <a href="mailto:lapatisserielapatisserie@gmail.com" className="hover:text-[#A855F7] transition-colors break-all">
                lapatisserielapatisserie@gmail.com
              </a>
            </p>
          </div>
          
          <div className="mt-8">
            <Link 
              to="/contact" 
              className="inline-block bg-white text-black px-8 py-3 hover:bg-gray-100 transition-colors tracking-wide text-sm"
            >
              CONTACT US
            </Link>
          </div>
        </div>

        {/* Footer Section */}
        <div className="mt-16  py-12 border-t border-[#733857]/30 -mx-4">
          <div className="max-w-4xl mx-auto text-center px-4">
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

export default About;
