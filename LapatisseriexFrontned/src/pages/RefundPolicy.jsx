import React from 'react';
import { Link } from 'react-router-dom';

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] py-4 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 pb-8 border-b border-white/10">
          <h1 className="text-4xl md:text-5xl font-light text-white mb-3 tracking-wide">
            Refund Policy
          </h1>
          <p className="text-gray-500 text-sm">Last Updated: October 13, 2025</p>
        </div>

        {/* Content */}
        <div className="space-y-10 text-gray-300">
          
          {/* No Return Policy Notice */}
          <div className="bg-[#151515] border-l-2 border-[#A855F7] p-6">
            <h2 className="text-lg font-medium text-white mb-3">Important Notice</h2>
            <p className="leading-relaxed">
              La Pâtisserie operates a <strong className="text-white">NO RETURN and NO REFUND policy</strong> for all food items due to the perishable nature of our products and food safety regulations.
            </p>
          </div>

          {/* Policy Details */}
          <div className="space-y-10">
            <div>
              <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">1. No Returns on Food Items</h3>
              <p className="leading-relaxed mb-3">
                Due to health and safety regulations, we cannot accept returns on any food products, including:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="text-gray-400">Tiramisu desserts (all flavors)</li>
                <li className="text-gray-400">Cakes and pastries</li>
                <li className="text-gray-400">Any other bakery items</li>
                <li className="text-gray-400">Custom-made or special orders</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">2. No Refund Policy</h3>
              <p className="leading-relaxed">
                All sales are final. Once an order is placed and payment is processed, we cannot issue refunds except in the exceptional circumstances listed in Section 4.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">3. Quality Assurance</h3>
              <p className="leading-relaxed mb-3">
                We take pride in the quality of our products. Every dessert is:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="text-gray-400">Freshly prepared with premium ingredients</li>
                <li className="text-gray-400">Quality checked before packaging</li>
                <li className="text-gray-400">Properly packaged to maintain freshness</li>
                <li className="text-gray-400">Handled following strict hygiene standards</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">4. Exceptions - When Refunds May Apply</h3>
              <p className="leading-relaxed mb-3">
                Refunds or replacements will only be considered in the following cases:
              </p>
              <ul className="space-y-3 ml-6 text-gray-400">
                <li><strong className="text-white">Wrong Product Delivered:</strong> If you receive a different product than ordered</li>
                <li><strong className="text-white">Damaged During Delivery:</strong> If the product arrives in damaged or spoiled condition</li>
                <li><strong className="text-white">Missing Items:</strong> If parts of your order are missing</li>
                <li><strong className="text-white">Quality Issues:</strong> If the product is defective or does not meet quality standards (must be reported within 2 hours of delivery)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">5. How to Report Issues</h3>
              <p className="leading-relaxed mb-3">
                If you receive a damaged or incorrect product, please:
              </p>
              <ol className="space-y-2 ml-6 text-gray-400 list-decimal">
                <li>Contact us immediately at <a href="tel:+917845712388" className="text-[#A855F7] hover:underline">+91 7845712388</a></li>
                <li>Provide clear photos of the issue</li>
                <li>Include your order number and details</li>
                <li>Report within 2 hours of delivery</li>
              </ol>
              <p className="mt-4 text-sm text-gray-400">
                We will review your case and provide a replacement or refund if the claim is valid.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">6. Order Cancellation</h3>
              <p className="leading-relaxed">
                <strong className="text-white">Before Preparation:</strong> Orders can be cancelled before preparation begins. Contact us immediately.<br />
                <strong className="text-white">After Preparation:</strong> Once your order is being prepared or out for delivery, it cannot be cancelled or refunded.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">7. Refund Process (If Applicable)</h3>
              <p className="leading-relaxed mb-3">
                If a refund is approved:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="text-gray-400">Refunds will be processed within 5-7 business days</li>
                <li className="text-gray-400">Amount will be credited to the original payment method</li>
                <li className="text-gray-400">You will receive an email confirmation</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">8. Customer Responsibility</h3>
              <p className="leading-relaxed mb-3">Please ensure:</p>
              <ul className="space-y-2 ml-6">
                <li className="text-gray-400">Correct delivery address is provided</li>
                <li className="text-gray-400">Someone is available to receive the order</li>
                <li className="text-gray-400">Products are stored properly after delivery</li>
                <li className="text-gray-400">You check your order immediately upon receipt</li>
              </ul>
            </div>

            <div className="border-t border-white/10 pt-8">
              <h3 className="text-lg font-medium text-white mb-4">Contact Us</h3>
              <p className="leading-relaxed mb-4">
                For any questions about our refund policy, please contact us:
              </p>
              <div className="space-y-2 text-gray-400">
                <p>Phone: <a href="tel:+917845712388" className="text-[#A855F7] hover:text-white transition-colors">+91 7845712388</a></p>
                <p>Email: <a href="mailto:lapatisserielapatisserie@gmail.com" className="text-[#A855F7] hover:text-white transition-colors">lapatisserielapatisserie@gmail.com</a></p>
                <p>Address: LIG 208 Gandhi Nagar, Peelamedu, Coimbatore</p>
              </div>
            </div>

            <div className="mt-10 text-center">
              <Link 
                to="/contact" 
                className="inline-block bg-white text-black px-8 py-3 hover:bg-gray-100 transition-colors tracking-wide text-sm"
              >
                CONTACT SUPPORT
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

export default RefundPolicy;
