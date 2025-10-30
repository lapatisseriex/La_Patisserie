import React from 'react';
import { Outlet } from 'react-router-dom';
import Footer from '../Footer/Footer';
import OfflineAwareOutlet from '../common/OfflineAwareOutlet';

const FooterOnlyLayout = () => {
  return (
    <>
      <main data-no-padding="true" className="min-h-screen bg-white transition-all duration-300">
        <OfflineAwareOutlet />
      </main>
      <Footer />
    </>
  );
};

export default FooterOnlyLayout;