import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';

const Layout = () => {
  // Apply header spacing class
  useEffect(() => {
    // Apply a class to handle header spacing
    document.body.classList.add('has-fixed-header');
    
    return () => {
      // Cleanup class if component unmounts
      document.body.classList.remove('has-fixed-header');
    };
  }, []);
  
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white pt-[180px] md:pt-[200px] pb-24">
        <Outlet />
      </main>
      <Footer />
    </>
  );
};

export default Layout;
