import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import BottomNavigation from '../common/BottomNavigation';
import NGOSidePanel from '../Payment/NGOSidePanel';
import { useNGOPanel } from '../../hooks/useNGOPanel';
import OfflineAwareOutlet from '../common/OfflineAwareOutlet';

const Layout = () => {
  const { showNGOPanel, closePanel } = useNGOPanel();

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
      <main className="min-h-screen bg-white pt-[75px] md:pt-[80px] pb-16 md:pb-0 transition-all duration-300">
        <OfflineAwareOutlet />
      </main>
      <Footer />
      <BottomNavigation />
      
      {/* NGO Side Panel - Available on all pages using Layout */}
      <NGOSidePanel isOpen={showNGOPanel} onClose={closePanel} />
    </>
  );
};

export default Layout;





