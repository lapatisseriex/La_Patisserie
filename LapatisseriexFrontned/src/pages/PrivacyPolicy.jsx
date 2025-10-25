import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import HoverButton from '../components/common/HoverButton';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 pb-8 border-b border-gray-200">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-wide mb-4" style={{ color: '#281c20' }}>
            Privacy Policy
          </h1>
          <p className="text-sm text-gray-500 tracking-wide">Last Updated: October 13, 2025</p>
        </div>

        {/* Content */}
        <div className="space-y-10 text-gray-700">
          
          <div>
            <p className="leading-relaxed text-base sm:text-lg">
              At La Pâtisserie, we value your privacy and are committed to protecting your personal information. This policy explains how we collect, use, and safeguard your data when you use our website and services.
            </p>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-light mb-6 pb-3 border-b border-gray-200" style={{ color: '#281c20' }}>Information We Collect</h3>
            <ul className="space-y-4 text-base leading-relaxed">
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>Personal details such as name, phone number, email, and delivery location when you create an account or place an order</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>Order history and preferences to personalize your experience</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>Payment information for processing transactions (we do not store your UPI or card details)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>Usage data such as pages visited, products viewed, and device/browser information</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-light mb-6 pb-3 border-b border-gray-200" style={{ color: '#281c20' }}>How We Use Your Information</h3>
            <ul className="space-y-4 text-base leading-relaxed">
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>To process orders and deliver products to your selected hostel or location</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>To provide personalized recommendations and offers (e.g., Best Sellers, Handpicked For You)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>To improve our website, services, and customer support</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>To communicate with you about your orders, offers, and updates</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-light mb-6 pb-3 border-b border-gray-200" style={{ color: '#281c20' }}>Data Security</h3>
            <p className="leading-relaxed text-base">
              We use secure technologies and best practices to protect your data. Sensitive information is encrypted and never shared with third parties except as required to fulfill your order or by law.
            </p>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-light mb-6 pb-3 border-b border-gray-200" style={{ color: '#281c20' }}>Cookies and Tracking</h3>
            <p className="leading-relaxed text-base">
              We use cookies to enhance your experience and understand how you use our site. You can control cookies through your browser settings.
            </p>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-light mb-6 pb-3 border-b border-gray-200" style={{ color: '#281c20' }}>Your Choices</h3>
            <ul className="space-y-4 text-base leading-relaxed">
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>You can update your account information at any time from your profile page</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>You may request deletion of your account and data by contacting us</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>We do not sell your personal information to third parties</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>You can unsubscribe from marketing emails at any time</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-light mb-6 pb-3 border-b border-gray-200" style={{ color: '#281c20' }}>Third-Party Services</h3>
            <p className="leading-relaxed text-base">
              We may use third-party services (like payment processors, delivery partners) to operate our business. These partners have their own privacy policies and we ensure they meet our security standards.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-8 mt-12">
            <h3 className="text-xl sm:text-2xl font-light mb-6" style={{ color: '#281c20' }}>Questions?</h3>
            <p className="leading-relaxed text-base mb-6">
              For questions or concerns about your privacy, please contact us:
            </p>
            <div className="space-y-3 text-base">
              <p>Phone: <a href="tel:+917845712388" className="hover:opacity-70 transition-opacity" style={{ color: '#733857' }}>+91 7845712388</a></p>
              <p>Email: <a href="mailto:lapatisserielapatisserie@gmail.com" className="hover:opacity-70 transition-opacity" style={{ color: '#733857' }}>lapatisserielapatisserie@gmail.com</a></p>
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

export default PrivacyPolicy;
