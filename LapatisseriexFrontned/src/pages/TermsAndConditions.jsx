import React from 'react';
import { Link } from 'react-router-dom';

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] py-4 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-light text-white mb-4">
            Terms & Conditions
          </h1>
          <p className="text-gray-400 text-sm">Last Updated: October 13, 2025</p>
        </div>

        {/* Content */}
        <div className="border border-white/10 p-8 md:p-12">
          <div className="space-y-8 text-gray-300">
            
            <div>
              <p className="leading-relaxed">
                Welcome to La Pâtisserie. By accessing our website and using our services, you agree to comply with and be bound by the following terms and conditions. Please read them carefully.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">1. Acceptance of Terms</h3>
              <p className="leading-relaxed">
                By using our website, placing an order, or accessing our services, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions, along with our Privacy Policy and Refund Policy.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">2. Use of Website</h3>
              <ul className="space-y-2 ml-6 text-gray-400">
                <li>You must be at least 18 years old to place an order</li>
                <li>You agree to provide accurate and complete information</li>
                <li>You are responsible for maintaining the confidentiality of your account</li>
                <li>You must not misuse our website or services</li>
                <li>You must not attempt to gain unauthorized access to our systems</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">3. Products and Pricing</h3>
              <ul className="space-y-2 ml-6 text-gray-400">
                <li>All products are subject to availability</li>
                <li>Prices are subject to change without notice</li>
                <li>We reserve the right to limit quantities</li>
                <li>Product images are for illustration purposes and may vary slightly</li>
                <li>We strive to display accurate colors, but actual products may vary</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">4. Orders and Payment</h3>
              <p className="leading-relaxed mb-2"><strong>Placing Orders:</strong></p>
              <ul className="space-y-1 ml-6 text-gray-400 mb-3">
                <li>Orders are subject to acceptance and availability</li>
                <li>We reserve the right to refuse or cancel any order</li>
                <li>Order confirmation will be sent via email/SMS</li>
              </ul>
              
              <p className="leading-relaxed mb-2"><strong>Payment:</strong></p>
              <ul className="space-y-1 ml-6 text-gray-400">
                <li>All payments must be made in Indian Rupees (INR)</li>
                <li>We accept online payments through Razorpay</li>
                <li>Payment must be completed before order processing</li>
                <li>Your payment information is encrypted and secure</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">5. Delivery</h3>
              <ul className="space-y-2 ml-6 text-gray-400">
                <li>Delivery is available within Coimbatore city limits</li>
                <li>Delivery times are estimates and not guaranteed</li>
                <li>You must provide a valid delivery address</li>
                <li>Someone must be available to receive the order</li>
                <li>Delivery charges may apply based on location</li>
                <li>We are not responsible for delays due to unforeseen circumstances</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">6. Returns and Refunds</h3>
              <p className="leading-relaxed mb-2">
                <strong>NO RETURN and NO REFUND Policy:</strong> Due to the perishable nature of our products, we maintain a strict no return and no refund policy. Exceptions apply only in cases of:
              </p>
              <ul className="space-y-1 ml-6 text-gray-400">
                <li>Wrong product delivered</li>
                <li>Damaged or spoiled products</li>
                <li>Missing items from your order</li>
              </ul>
              <p className="mt-2 text-sm text-gray-400">
                Please refer to our <span className="text-[#A855F7]">Refund Policy</span> for complete details.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">7. Product Quality and Food Safety</h3>
              <ul className="space-y-2 ml-6 text-gray-400">
                <li>All products are prepared following strict hygiene standards</li>
                <li>Products must be stored as per instructions</li>
                <li>Check expiry dates and consume within recommended time</li>
                <li>We are not liable for issues arising from improper storage</li>
                <li>Allergen information is provided; please check before ordering</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">8. Intellectual Property</h3>
              <p className="leading-relaxed">
                All content on this website, including text, images, logos, and designs, is the property of La Pâtisserie and protected by copyright laws. You may not reproduce, distribute, or use any content without our written permission.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">9. User Accounts</h3>
              <ul className="space-y-2 ml-6 text-gray-400">
                <li>You are responsible for all activity under your account</li>
                <li>Keep your password confidential</li>
                <li>Notify us immediately of any unauthorized use</li>
                <li>We reserve the right to suspend or terminate accounts</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">10. Limitation of Liability</h3>
              <p className="leading-relaxed">
                La Pâtisserie shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of our website or products. Our total liability shall not exceed the amount paid for the product in question.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">11. Indemnification</h3>
              <p className="leading-relaxed">
                You agree to indemnify and hold La Pâtisserie harmless from any claims, damages, or expenses arising from your violation of these terms or misuse of our services.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">12. Modifications to Terms</h3>
              <p className="leading-relaxed">
                We reserve the right to modify these Terms and Conditions at any time. Changes will be effective immediately upon posting. Continued use of our services constitutes acceptance of modified terms.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">13. Governing Law</h3>
              <p className="leading-relaxed">
                These Terms and Conditions are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Coimbatore, Tamil Nadu.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">14. Severability</h3>
              <p className="leading-relaxed">
                If any provision of these terms is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.
              </p>
            </div>

            <div className="border-t border-white/10 pt-6">
              <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">Contact Information</h3>
              <p className="leading-relaxed mb-3">
                For questions about these Terms and Conditions, please contact us:
              </p>
              <div className="space-y-2 text-gray-400">
                <p><strong className="text-white">La Pâtisserie</strong></p>
                <p>LIG 208 Gandhi Nagar, Peelamedu, Coimbatore</p>
                <p>Phone: <a href="tel:+917845712388" className="text-[#A855F7] hover:text-white">+91 7845712388</a></p>
                <p>Email: <a href="mailto:lapatisserielapatisserie@gmail.com" className="text-[#A855F7] hover:text-white">lapatisserielapatisserie@gmail.com</a></p>
              </div>
            </div>

            <div className="border border-white/10 p-4 text-center">
              <p className="text-sm text-gray-300">
                By using our website and services, you acknowledge that you have read and agree to these Terms and Conditions.
              </p>
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

export default TermsAndConditions;
