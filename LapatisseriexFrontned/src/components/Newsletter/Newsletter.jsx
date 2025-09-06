import React, { useState } from 'react';

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      // In a real app, we would send this to a backend
      console.log('Subscribing email:', email);
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  return (
    <section className="bg-white py-16 relative overflow-hidden" id="newsletter">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-40 h-40 bg-cakePink-light/10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-56 h-56 bg-cakePink-light/10 rounded-full translate-x-1/4 translate-y-1/4"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-cakeBrown mb-4">
            Subscribe for Sweet Updates
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            Be the first to know about new flavors, seasonal specials, and exclusive offers
          </p>
          
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            {subscribed ? (
              <div className="w-full bg-cakePink-light text-white text-lg font-medium py-4 px-6 rounded-lg shadow-lg">
                Thank you for subscribing!
              </div>
            ) : (
              <>
                <input 
                  type="email" 
                  placeholder="Enter your email address" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-grow py-3 px-4 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cakePink/30 focus:border-cakePink shadow-md"
                  aria-label="Email address"
                />
                <button 
                  type="submit" 
                  className="bg-cakePink hover:bg-cakePink-dark text-white font-medium py-3 px-6 rounded-lg transition-colors shadow-md whitespace-nowrap"
                >
                  Subscribe
                </button>
              </>
            )}
          </form>
          
          <p className="text-gray-500 text-sm mt-4">
            We respect your privacy and will never share your information
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
