import React from 'react';
import SwiggyLikeHeader from '../Header/SwiggyLikeHeader';
import Footer from '../Footer/Footer';

const SwiggyLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <SwiggyLikeHeader />
      
      {/* Main Content with proper top padding to account for fixed header */}
      <main className="pt-24 md:pt-28">
        {children}
      </main>
      
      <Footer />
    </div>
  );
};

export default SwiggyLayout;