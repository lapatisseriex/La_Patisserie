import React from 'react';

const PrivacyPolicy = () => (
  <div className="container mx-auto py-12 px-4 md:px-8">
  <h1 className="text-3xl font-extrabold mb-8 text-center text-gray-800">Privacy Policy</h1>
  <p className="mb-8 text-lg leading-relaxed text-gray-700">At La Patisserie, we value your privacy and are committed to protecting your personal information. This policy explains how we collect, use, and safeguard your data when you use our website and services.</p>
  <h2 className="text-2xl font-semibold mt-10 mb-4 text-gray-900">Information We Collect</h2>
  <ul className="list-disc ml-8 mb-8 text-gray-700 space-y-2">
      <li>Personal details such as name, phone number, email, and delivery location when you create an account or place an order.</li>
      <li>Order history and preferences to personalize your experience.</li>
      <li>Payment information for processing transactions (we do not store your UPI or card details).</li>
      <li>Usage data such as pages visited, products viewed, and device/browser information.</li>
    </ul>
  <h2 className="text-2xl font-semibold mt-10 mb-4 text-gray-900">How We Use Your Information</h2>
  <ul className="list-disc ml-8 mb-8 text-gray-700 space-y-2">
      <li>To process orders and deliver products to your selected hostel or location.</li>
      <li>To provide personalized recommendations and offers (e.g., Best Sellers, Handpicked For You).</li>
      <li>To improve our website, services, and customer support.</li>
      <li>To communicate with you about your orders, offers, and updates.</li>
    </ul>
  <h2 className="text-2xl font-semibold mt-10 mb-4 text-gray-900">Data Security</h2>
  <p className="mb-8 text-gray-700">We use secure technologies and best practices to protect your data. Sensitive information is encrypted and never shared with third parties except as required to fulfill your order or by law.</p>
  <h2 className="text-2xl font-semibold mt-10 mb-4 text-gray-900">Your Choices</h2>
  <ul className="list-disc ml-8 mb-8 text-gray-700 space-y-2">
      <li>You can update your account information at any time from your profile page.</li>
      <li>You may request deletion of your account and data by contacting us.</li>
      <li>We do not sell your personal information to third parties.</li>
    </ul>
  <p className="mt-10 text-base text-gray-600">For questions or concerns about your privacy, please contact us via the Contact page.</p>
  </div>
);

export default PrivacyPolicy;
