import React from 'react';
import { Link } from 'react-router-dom';

const ShippingPolicy = () => {
  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 pb-8 border-b border-gray-200">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-wide mb-4" style={{ color: '#281c20' }}>
            Shipping & Delivery Policy
          </h1>
          <p className="text-sm text-gray-500 tracking-wide">Last Updated: October 15, 2025</p>
        </div>

        {/* Content */}
        <div className="space-y-10 text-gray-700">
          
          <div>
            <p className="leading-relaxed text-base sm:text-lg">
              At La Pâtisserie, we are committed to delivering the finest quality desserts, especially our authentic Tiramisu, fresh and on time. We understand that our products are time-sensitive and require special care during delivery.
            </p>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-light mb-6 pb-3 border-b border-gray-200" style={{ color: '#281c20' }}>Delivery Areas</h3>
            <p className="text-base leading-relaxed mb-4">
              We currently deliver to the following locations in Coimbatore:
            </p>
            <ul className="space-y-4 text-base leading-relaxed">
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>City Center and surrounding areas</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>Selected hostels and residential complexes</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>Commercial establishments (on request)</span>
              </li>
            </ul>
            <div className="mt-6 p-4 bg-gray-50 border-l-4" style={{ borderColor: '#733857' }}>
              <p className="text-sm text-gray-600">
                <strong>Note:</strong> Delivery locations are verified during checkout. If your location is not listed, please contact us to check availability.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-light mb-6 pb-3 border-b border-gray-200" style={{ color: '#281c20' }}>Delivery Timeframes</h3>
            <ul className="space-y-4 text-base leading-relaxed">
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span><strong>Standard Delivery:</strong> Orders are typically delivered within 2-4 hours of order placement during business hours</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span><strong>Pre-Order Delivery:</strong> For pre-orders, delivery will be made at your selected date and time slot (subject to availability)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span><strong>Business Hours:</strong> Monday to Sunday: 6:00 PM - 9:00 PM</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-light mb-6 pb-3 border-b border-gray-200" style={{ color: '#281c20' }}>Delivery Charges</h3>
            <p className="text-base leading-relaxed mb-4">Delivery charges vary based on your location and order value:</p>
            <ul className="space-y-4 text-base leading-relaxed">
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>Free delivery on orders above ₹500 (within city limits)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>Standard delivery charges: ₹40-₹80 based on distance</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>Express delivery available at additional cost</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-light mb-6 pb-3 border-b border-gray-200" style={{ color: '#281c20' }}>Order Tracking</h3>
            <p className="text-base leading-relaxed mb-4">You can track your order status in real-time through:</p>
            <ul className="space-y-4 text-base leading-relaxed">
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>Your account dashboard under "My Orders"</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>Order confirmation email with tracking link</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>SMS notifications at each delivery milestone</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>WhatsApp updates (if opted in)</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-light mb-6 pb-3 border-b border-gray-200" style={{ color: '#281c20' }}>Special Handling</h3>
            <p className="text-base leading-relaxed mb-4"><strong>Refrigerated Products:</strong> Our desserts, especially Tiramisu, are refrigerated items and require special care:</p>
            <ul className="space-y-4 text-base leading-relaxed">
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>Products are packed in insulated containers with ice packs</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>Must be refrigerated immediately upon receipt</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>Best consumed within recommended timeframe</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>Please be available to receive the delivery</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-light mb-6 pb-3 border-b border-gray-200" style={{ color: '#281c20' }}>Failed Delivery Attempts</h3>
            <p className="text-base leading-relaxed mb-4">In case of failed delivery attempts:</p>
            <ul className="space-y-4 text-base leading-relaxed">
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>Our delivery partner will attempt to contact you via phone</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>A second delivery attempt may be made (charges may apply)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>If delivery cannot be completed, order may be cancelled and refund processed</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>Due to the perishable nature of our products, we cannot hold orders for extended periods</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-light mb-6 pb-3 border-b border-gray-200" style={{ color: '#281c20' }}>Delivery Support</h3>
            <p className="text-base leading-relaxed mb-4">For any delivery-related queries or concerns, please reach out to us:</p>
            <ul className="space-y-4 text-base leading-relaxed">
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>
                  <strong>Phone:</strong>{' '}
                  <a href="tel:+917845712388" className="hover:underline" style={{ color: '#281c20' }}>
                    +91 7845712388
                  </a>
                  {' '}or{' '}
                  <a href="tel:+919362166816" className="hover:underline" style={{ color: '#281c20' }}>
                    +91 9362166816
                  </a>
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#733857' }}>•</span>
                <span>
                  <strong>Email:</strong>{' '}
                  <a href="mailto:lapatisserielapatisserie@gmail.com" className="hover:underline" style={{ color: '#281c20' }}>
                    lapatisserielapatisserie@gmail.com
                  </a>
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-8 p-4 border-l-4" style={{ borderColor: '#733857', backgroundColor: '#F9FAFB' }}>
            <p className="text-sm leading-relaxed">
              <strong>Note:</strong> La Pâtisserie reserves the right to modify this shipping policy at any time. 
              Changes will be effective immediately upon posting on our website. Continued use of our service 
              after any changes constitutes acceptance of the new policy.
            </p>
          </div>

          </div>
        </div>


      </div>

  );
};

export default ShippingPolicy;
