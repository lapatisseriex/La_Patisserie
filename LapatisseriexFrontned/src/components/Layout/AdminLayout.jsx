import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';

const AdminLayout = () => {
  // Apply header spacing class with reduced padding since we hide location and category bars
  useEffect(() => {
    // Apply a class to handle header spacing
    document.body.classList.add('has-fixed-header', 'admin-layout');
    
    return () => {
      // Cleanup classes if component unmounts
      document.body.classList.remove('has-fixed-header', 'admin-layout');
    };
  }, []);
  
  return (
    <>
      {/* Pass isAdminView prop to hide location and category sections */}
      <Header isAdminView={true} />
      <main className="min-h-screen bg-white pt-[100px] md:pt-[120px] pb-24">
        <Outlet />
      </main>
      <Footer />
    </>
  );
};

export default AdminLayout;





