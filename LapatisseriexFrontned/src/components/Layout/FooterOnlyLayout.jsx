import React from 'react';
import { Outlet } from 'react-router-dom';
import Footer from '../Footer/Footer';

const FooterOnlyLayout = () => {
  return (
    <>
      <main className="min-h-screen bg-white transition-all duration-300">
        <Outlet />
      </main>
      <Footer />
    </>
  );
};

export default FooterOnlyLayout;