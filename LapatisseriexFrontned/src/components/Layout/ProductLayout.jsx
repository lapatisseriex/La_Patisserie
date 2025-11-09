import React from 'react';
import { Outlet } from 'react-router-dom';
import Footer from '../Footer/Footer';
import BottomNavigation from '../common/BottomNavigation';
import OfflineAwareOutlet from '../common/OfflineAwareOutlet';

const ProductLayout = () => {
  return (
    <>
      <main className="min-h-screen bg-white pb-16 md:pb-0">
        <OfflineAwareOutlet />
      </main>
      <Footer />
      <BottomNavigation />
    </>
  );
};

export default ProductLayout;