import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import HoverButton from '../components/common/HoverButton';

const OurServices = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 pb-8 border-b border-gray-200">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-wide mb-4" style={{ color: '#281c20' }}>
            Our Services
          </h1>
          <p className="text-base text-gray-600 tracking-wide">
            Delivering authentic desserts with excellence
          </p>
        </div>

        {/* Services */}
        <div className="space-y-10 text-gray-700">
          
          {/* Exclusive Delivery */}
          <div className="bg-gray-50 p-8 sm:p-10 border border-gray-200">
            <h2 className="text-2xl sm:text-3xl font-light mb-6 pb-4 border-b border-gray-200" style={{ color: '#281c20' }}>Exclusive Delivery Service</h2>
            <p className="text-base leading-relaxed mb-6">
              We specialize in delivering fresh cakes, pastries, and desserts directly to college hostels and select locations. Our service is tailored for students, ensuring timely and safe delivery right to your hostel room or campus common area.
            </p>
            <ul className="space-y-4 text-base leading-relaxed">
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>Order from a curated menu of best sellers, newly launched treats, and handpicked recommendations</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>Enjoy special offers and combos designed for student groups and celebrations</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>Track your order and get real-time updates on delivery status</span>
              </li>
            </ul>
          </div>

          {/* Payment Options */}
          <div className="bg-gray-50 p-8 sm:p-10 border border-gray-200">
            <h2 className="text-2xl sm:text-3xl font-light mb-6 pb-4 border-b border-gray-200" style={{ color: '#281c20' }}>Flexible Payment Options</h2>
            <ul className="space-y-4 text-base leading-relaxed">
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>Pay easily using UPI apps (Google Pay, PhonePe, Paytm, etc.)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>All major credit and debit cards accepted</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>Net banking for convenient transactions</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>Secure payment gateway powered by Razorpay</span>
              </li>
            </ul>
          </div>

          {/* Custom Orders */}
          <div className="bg-gray-50 p-8 sm:p-10 border border-gray-200">
            <h2 className="text-2xl sm:text-3xl font-light mb-6 pb-4 border-b border-gray-200" style={{ color: '#281c20' }}>Custom Orders & Special Occasions</h2>
            <p className="text-base leading-relaxed mb-6">
              Planning a birthday, anniversary, or celebration? We offer custom desserts tailored to your preferences. Contact us to discuss your requirements and create something truly special.
            </p>
            <ul className="space-y-4 text-base leading-relaxed">
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>Personalized flavors and designs</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>Custom portion sizes for events</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>Special packaging for gifts</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>Advance orders for bulk quantities</span>
              </li>
            </ul>
          </div>

          {/* Quality Guarantee */}
          <div className="bg-gray-50 p-8 sm:p-10 border border-gray-200">
            <h2 className="text-2xl sm:text-3xl font-light mb-6 pb-4 border-b border-gray-200" style={{ color: '#281c20' }}>Quality Guarantee</h2>
            <p className="text-base leading-relaxed mb-6">
              Every dessert we create is a work of art. We use only the finest ingredients and follow rigorous quality standards to ensure you receive nothing but the best.
            </p>
            <ul className="space-y-4 text-base leading-relaxed">
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>Freshly prepared daily</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>Premium ingredients sourced from trusted suppliers</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>Strict hygiene and safety protocols</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>Temperature-controlled delivery to maintain freshness</span>
              </li>
            </ul>
          </div>

          {/* Customer Support */}
          <div className="bg-gray-50 p-8 sm:p-10 border border-gray-200">
            <h2 className="text-2xl sm:text-3xl font-light mb-6 pb-4 border-b border-gray-200" style={{ color: '#281c20' }}>Customer Support</h2>
            <p className="text-base leading-relaxed mb-6">
              Our dedicated customer support team is always ready to assist you with orders, inquiries, or any concerns.
            </p>
            <div className="space-y-4 text-base">
              <p className="flex items-start">
                <span className="font-medium mr-3" style={{ color: '#733857' }}>Phone:</span>
                <span>
                  <a href="tel:+917845712388" className="hover:opacity-70 transition-opacity" style={{ color: '#733857' }}>+91 7845712388</a>
                  {' / '}
                  <a href="tel:+919362166816" className="hover:opacity-70 transition-opacity" style={{ color: '#733857' }}>+91 9362166816</a>
                </span>
              </p>
              <p className="flex items-start">
                <span className="font-medium mr-3" style={{ color: '#733857' }}>Email:</span>
                <a href="mailto:lapatisserielapatisserie@gmail.com" className="hover:opacity-70 transition-opacity break-all" style={{ color: '#733857' }}>
                  lapatisserielapatisserie@gmail.com
                </a>
              </p>
              <p className="flex items-start">
                <span className="font-medium mr-3" style={{ color: '#733857' }}>Address:</span>
                <span>LIG 208 Gandhi Nagar, Peelamedu, Coimbatore</span>
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <HoverButton
              onClick={() => navigate('/contact')}
              text="CONTACT US"
              hoverText="GET IN TOUCH"
              variant="primary"
              size="large"
              className="px-10 py-4 text-sm tracking-wider"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OurServices;
