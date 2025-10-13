import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0a1a] via-[#2d1b2d] to-[#1a0a1a] py-4 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-light text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-gray-400 text-sm">Last Updated: October 13, 2025</p>
        </div>

        {/* Content */}
        <div className="border border-white/10 p-8 md:p-12">
          <div className="space-y-8 text-gray-300">
            
            <div>
              <p className="leading-relaxed text-lg">
                At La Pâtisserie, we value your privacy and are committed to protecting your personal information. This policy explains how we collect, use, and safeguard your data when you use our website and services.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">Information We Collect</h3>
              <ul className="space-y-3 ml-6 text-gray-300">
                <li>Personal details such as name, phone number, email, and delivery location when you create an account or place an order</li>
                <li>Order history and preferences to personalize your experience</li>
                <li>Payment information for processing transactions (we do not store your UPI or card details)</li>
                <li>Usage data such as pages visited, products viewed, and device/browser information</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">How We Use Your Information</h3>
              <ul className="space-y-3 ml-6 text-gray-300">
                <li>To process orders and deliver products to your selected hostel or location</li>
                <li>To provide personalized recommendations and offers (e.g., Best Sellers, Handpicked For You)</li>
                <li>To improve our website, services, and customer support</li>
                <li>To communicate with you about your orders, offers, and updates</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">Data Security</h3>
              <p className="leading-relaxed">
                We use secure technologies and best practices to protect your data. Sensitive information is encrypted and never shared with third parties except as required to fulfill your order or by law.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">Cookies and Tracking</h3>
              <p className="leading-relaxed mb-3">
                We use cookies to enhance your experience and understand how you use our site. You can control cookies through your browser settings.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">Your Choices</h3>
              <ul className="space-y-3 ml-6 text-gray-300">
                <li>You can update your account information at any time from your profile page</li>
                <li>You may request deletion of your account and data by contacting us</li>
                <li>We do not sell your personal information to third parties</li>
                <li>You can unsubscribe from marketing emails at any time</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">Third-Party Services</h3>
              <p className="leading-relaxed">
                We may use third-party services (like payment processors, delivery partners) to operate our business. These partners have their own privacy policies and we ensure they meet our security standards.
              </p>
            </div>

            <div className="border-t border-white/10 pt-6">
              <h3 className="text-lg font-medium text-white mb-4">Questions?</h3>
              <p className="leading-relaxed mb-4">
                For questions or concerns about your privacy, please contact us:
              </p>
              <div className="space-y-2 text-gray-400">
                <p>Phone: <a href="tel:+917845712388" className="text-[#A855F7] hover:text-white">+91 7845712388</a></p>
                <p>Email: <a href="mailto:lapatisserielapatisserie@gmail.com" className="text-[#A855F7] hover:text-white">lapatisserielapatisserie@gmail.com</a></p>
              </div>
            </div>

            <div className="mt-8 text-center">
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

export default PrivacyPolicy;
