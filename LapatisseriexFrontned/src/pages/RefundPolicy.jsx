import React from 'react';
import { Link } from 'react-router-dom';

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 pb-8 border-b border-gray-200">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-wide mb-4" style={{ color: '#281c20' }}>
            Refund Policy
          </h1>
          <p className="text-sm text-gray-500 tracking-wide">Last Updated: October 13, 2025</p>
        </div>

        {/* Content */}
        <div className="space-y-10 text-gray-700">
          
          {/* No Return Policy Notice */}
          <div className="bg-gray-50 border-l-4 p-6" style={{ borderColor: '#733857' }}>
            <h2 className="text-lg font-medium mb-3" style={{ color: '#281c20' }}>Important Notice</h2>
            <p className="leading-relaxed">
              La Pâtisserie operates a <strong style={{ color: '#281c20' }}>NO RETURN and NO REFUND policy</strong> for all food items due to the perishable nature of our products and food safety regulations.
            </p>
          </div>

          {/* Policy Details */}
          <div className="space-y-10">
            <div>
              <h3 className="text-xl sm:text-2xl font-light mb-6 pb-3 border-b border-gray-200" style={{ color: '#281c20' }}>1. No Returns on Food Items</h3>
              <p className="leading-relaxed text-base mb-4">
                Due to health and safety regulations, we cannot accept returns on any food products, including:
              </p>
              <ul className="space-y-3 text-base leading-relaxed">
                <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>Tiramisu desserts (all flavors)</span></li>
                <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>Cakes and pastries</span></li>
                <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>Any other bakery items</span></li>
                <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>Custom-made or special orders</span></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-light mb-6 pb-3 border-b border-gray-200" style={{ color: '#281c20' }}>2. No Refund Policy</h3>
              <p className="leading-relaxed text-base">
                All sales are final. Once an order is placed and payment is processed, we cannot issue refunds except in the exceptional circumstances listed in Section 4.
              </p>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-light mb-6 pb-3 border-b border-gray-200" style={{ color: '#281c20' }}>3. Quality Assurance</h3>
              <p className="leading-relaxed text-base mb-4">
                We take pride in the quality of our products. Every dessert is:
              </p>
              <ul className="space-y-3 text-base leading-relaxed">
                <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>Freshly prepared with premium ingredients</span></li>
                <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>Quality checked before packaging</span></li>
                <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>Properly packaged to maintain freshness</span></li>
                <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>Handled following strict hygiene standards</span></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-light mb-6 pb-3 border-b border-gray-200" style={{ color: '#281c20' }}>4. Exceptions - When Refunds May Apply</h3>
              <p className="leading-relaxed text-base mb-4">
                Refunds or replacements will only be considered in the following cases:
              </p>
              <ul className="space-y-4 text-base leading-relaxed">
                <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span><strong style={{ color: '#281c20' }}>Wrong Product Delivered:</strong> If you receive a different product than ordered</span></li>
                <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span><strong style={{ color: '#281c20' }}>Damaged During Delivery:</strong> If the product arrives in damaged or spoiled condition</span></li>
                <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span><strong style={{ color: '#281c20' }}>Missing Items:</strong> If parts of your order are missing</span></li>
                <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span><strong style={{ color: '#281c20' }}>Quality Issues:</strong> If the product is defective or does not meet quality standards (must be reported within 2 hours of delivery)</span></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-light mb-6 pb-3 border-b border-gray-200" style={{ color: '#281c20' }}>5. How to Report Issues</h3>
              <p className="leading-relaxed text-base mb-4">
                If you receive a damaged or incorrect product, please:
              </p>
              <ol className="space-y-3 ml-6 text-base leading-relaxed list-decimal">
                <li>Contact us immediately at <a href="tel:+917845712388" className="hover:opacity-70 transition-opacity" style={{ color: '#733857' }}>+91 7845712388</a></li>
                <li>Provide clear photos of the issue</li>
                <li>Include your order number and details</li>
                <li>Report within 2 hours of delivery</li>
              </ol>
              <p className="mt-4 text-sm">
                We will review your case and provide a replacement or refund if the claim is valid.
              </p>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-light mb-6 pb-3 border-b border-gray-200" style={{ color: '#281c20' }}>6. Order Cancellation</h3>
              <p className="leading-relaxed text-base mb-3">
                <strong style={{ color: '#281c20' }}>Before Preparation:</strong> Orders can be cancelled before preparation begins. Contact us immediately.
              </p>
              <p className="leading-relaxed text-base">
                <strong style={{ color: '#281c20' }}>After Preparation:</strong> Once your order is being prepared or out for delivery, it cannot be cancelled or refunded.
              </p>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-light mb-6 pb-3 border-b border-gray-200" style={{ color: '#281c20' }}>7. Refund Process (If Applicable)</h3>
              <p className="leading-relaxed text-base mb-4">
                If a refund is approved:
              </p>
              <ul className="space-y-3 text-base leading-relaxed">
                <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>Refunds will be processed within 5-7 business days</span></li>
                <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>Amount will be credited to the original payment method</span></li>
                <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>You will receive an email confirmation</span></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-light mb-6 pb-3 border-b border-gray-200" style={{ color: '#281c20' }}>8. Customer Responsibility</h3>
              <p className="leading-relaxed text-base mb-4">Please ensure:</p>
              <ul className="space-y-3 text-base leading-relaxed">
                <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>Correct delivery address is provided</span></li>
                <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>Someone is available to receive the order</span></li>
                <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>Products are stored properly after delivery</span></li>
                <li className="flex items-start"><span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span><span>You check your order immediately upon receipt</span></li>
              </ul>
            </div>

            <div className="border-t border-gray-200 pt-8 mt-12">
              <h3 className="text-xl sm:text-2xl font-light mb-6" style={{ color: '#281c20' }}>Contact Us</h3>
              <p className="leading-relaxed text-base mb-6">
                For any questions about our refund policy, please contact us:
              </p>
              <div className="space-y-3 text-base">
                <p>Phone: <a href="tel:+917845712388" className="hover:opacity-70 transition-opacity" style={{ color: '#733857' }}>+91 7845712388</a></p>
                <p>Email: <a href="mailto:lapatisserielapatisserie@gmail.com" className="hover:opacity-70 transition-opacity" style={{ color: '#733857' }}>lapatisserielapatisserie@gmail.com</a></p>
                <p>Address: LIG 208 Gandhi Nagar, Peelamedu, Coimbatore</p>
              </div>
            </div>

            <div className="mt-12 text-center">
              <Link 
                to="/contact" 
                className="inline-block px-10 py-4 text-sm tracking-wider transition-all hover:opacity-80"
                style={{ 
                  backgroundColor: '#281c20',
                  color: 'white'
                }}
              >
                CONTACT SUPPORT
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
