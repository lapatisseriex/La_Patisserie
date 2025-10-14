import React from 'react';
import { Link } from 'react-router-dom';

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 pb-8 border-b border-gray-200">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-wide mb-4" style={{ color: '#281c20' }}>
            Terms & Conditions
          </h1>
          <p className="text-sm text-gray-500 tracking-wide">Last Updated: October 13, 2025</p>
        </div>

        {/* Content */}
        <div className="space-y-10 text-gray-700">
          
          <div>
            <p className="leading-relaxed text-base sm:text-lg">
              Welcome to La Pâtisserie. By accessing our website and using our services, you agree to comply with and be bound by the following terms and conditions. Please read them carefully.
            </p>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-light mb-6 pb-3 border-b border-gray-200" style={{ color: '#281c20' }}>1. Acceptance of Terms</h3>
            <p className="leading-relaxed text-base">
              By using our website, placing an order, or accessing our services, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions, along with our Privacy Policy and Refund Policy.
            </p>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-light mb-6 pb-3 border-b border-gray-200" style={{ color: '#281c20' }}>2. Use of Website</h3>
            <ul className="space-y-3 text-base leading-relaxed">
              <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>You must be at least 18 years old to place an order</span></li>
              <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>You agree to provide accurate and complete information</span></li>
              <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>You are responsible for maintaining the confidentiality of your account</span></li>
              <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>You must not misuse our website or services</span></li>
              <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>You must not attempt to gain unauthorized access to our systems</span></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-light mb-6 pb-3 border-b border-gray-200" style={{ color: '#281c20' }}>3. Products and Pricing</h3>
            <ul className="space-y-3 text-base leading-relaxed">
              <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>All products are subject to availability</span></li>
              <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>Prices are subject to change without notice</span></li>
              <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>We reserve the right to limit quantities</span></li>
              <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>Product images are for illustration purposes and may vary slightly</span></li>
              <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>We strive to display accurate colors, but actual products may vary</span></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-light mb-6 pb-3 border-b border-gray-200" style={{ color: '#281c20' }}>4. Orders and Payment</h3>
            <p className="leading-relaxed text-base mb-3"><strong style={{ color: '#281c20' }}>Placing Orders:</strong></p>
            <ul className="space-y-3 text-base leading-relaxed mb-6">
              <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>Orders are subject to acceptance and availability</span></li>
              <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>We reserve the right to refuse or cancel any order</span></li>
              <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>Order confirmation will be sent via email/SMS</span></li>
            </ul>
            
            <p className="leading-relaxed text-base mb-3"><strong style={{ color: '#281c20' }}>Payment:</strong></p>
            <ul className="space-y-3 text-base leading-relaxed">
              <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>All payments must be made in Indian Rupees (INR)</span></li>
              <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>We accept online payments through Razorpay</span></li>
              <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>Payment must be completed before order processing</span></li>
              <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>Your payment information is encrypted and secure</span></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-light mb-6 pb-3 border-b border-gray-200" style={{ color: '#281c20' }}>5. Delivery</h3>
            <ul className="space-y-3 text-base leading-relaxed">
              <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>Delivery is available within Coimbatore city limits</span></li>
              <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>Delivery times are estimates and not guaranteed</span></li>
              <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>You must provide a valid delivery address</span></li>
              <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>Someone must be available to receive the order</span></li>
              <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>Delivery charges may apply based on location</span></li>
              <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>We are not responsible for delays due to unforeseen circumstances</span></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-light mb-6 pb-3 border-b border-gray-200" style={{ color: '#281c20' }}>6. Returns and Refunds</h3>
            <p className="leading-relaxed text-base mb-3">
              <strong style={{ color: '#281c20' }}>NO RETURN and NO REFUND Policy:</strong> Due to the perishable nature of our products, we maintain a strict no return and no refund policy. Exceptions apply only in cases of:
            </p>
            <ul className="space-y-3 text-base leading-relaxed">
              <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>Wrong product delivered</span></li>
              <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>Damaged or spoiled products</span></li>
              <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>Missing items from your order</span></li>
            </ul>
            <p className="mt-4 text-sm">
              Please refer to our <Link to="/refund-policy" className="hover:opacity-70 transition-opacity" style={{ color: '#733857' }}>Refund Policy</Link> for complete details.
            </p>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-light mb-6 pb-3 border-b border-gray-200" style={{ color: '#281c20' }}>7. Product Quality and Food Safety</h3>
            <ul className="space-y-3 text-base leading-relaxed">
              <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>All products are prepared following strict hygiene standards</span></li>
              <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>Products must be stored as per instructions</span></li>
              <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>Check expiry dates and consume within recommended time</span></li>
              <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>We are not liable for issues arising from improper storage</span></li>
              <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>Allergen information is provided; please check before ordering</span></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-light mb-6 pb-3 border-b border-gray-200" style={{ color: '#281c20' }}>8. Intellectual Property</h3>
            <p className="leading-relaxed text-base">
              All content on this website, including text, images, logos, and designs, is the property of La Pâtisserie and protected by copyright laws. You may not reproduce, distribute, or use any content without our written permission.
            </p>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-light mb-6 pb-3 border-b border-gray-200" style={{ color: '#281c20' }}>9. Limitation of Liability</h3>
            <p className="leading-relaxed text-base">
              La Pâtisserie shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of our website or products. Our total liability shall not exceed the amount paid for the product in question.
            </p>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-light mb-6 pb-3 border-b border-gray-200" style={{ color: '#281c20' }}>10. Governing Law</h3>
            <p className="leading-relaxed text-base">
              These Terms and Conditions are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Coimbatore, Tamil Nadu.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-8 mt-12">
            <h3 className="text-xl sm:text-2xl font-light mb-6" style={{ color: '#281c20' }}>Contact Information</h3>
            <p className="leading-relaxed text-base mb-6">
              For questions about these Terms and Conditions, please contact us:
            </p>
            <div className="space-y-3 text-base">
              <p><strong style={{ color: '#281c20' }}>La Pâtisserie</strong></p>
              <p>LIG 208 Gandhi Nagar, Peelamedu, Coimbatore</p>
              <p>Phone: <a href="tel:+917845712388" className="hover:opacity-70 transition-opacity" style={{ color: '#733857' }}>+91 7845712388</a></p>
              <p>Email: <a href="mailto:lapatisserielapatisserie@gmail.com" className="hover:opacity-70 transition-opacity" style={{ color: '#733857' }}>lapatisserielapatisserie@gmail.com</a></p>
            </div>
          </div>

          <div className="border border-gray-200 p-6 text-center mt-12 bg-gray-50">
            <p className="text-sm leading-relaxed">
              By using our website and services, you acknowledge that you have read and agree to these Terms and Conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
