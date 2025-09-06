import React, { useContext, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import { AuthContext } from '../../App';
import Login from '../Auth/Login/Login';
import Signup from '../Auth/Signup/Signup';
import OTPVerify from '../Auth/OTPVerify/OTPVerify';

const Layout = () => {
  const { isAuthPanelOpen, toggleAuthPanel, authType } = useContext(AuthContext);
  
  // Reset body overflow when auth panel closes
  useEffect(() => {
    if (isAuthPanelOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    // Apply a class to handle header spacing
    document.body.classList.add('has-fixed-header');
    
    return () => {
      document.body.style.overflow = 'auto';
      // Cleanup class if component unmounts
      document.body.classList.remove('has-fixed-header');
    };
  }, [isAuthPanelOpen]);
  
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white pt-[180px] md:pt-[200px] pb-24"> {/* Added bottom padding (pb-24) for better spacing before footer */}
        <Outlet />
      </main>
      <Footer />
      
      {/* Auth Panel Overlay */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-50 ${
          isAuthPanelOpen ? 'bg-opacity-50 pointer-events-auto' : 'bg-opacity-0 pointer-events-none'
        }`}
        onClick={toggleAuthPanel}
      ></div>
      
      {/* Slide-in Auth Panel */}
      <div 
        className={`fixed top-0 right-0 h-full bg-white z-[51] w-full sm:max-w-md md:w-96 shadow-lg transform transition-transform duration-300 ease-in-out ${
          isAuthPanelOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={(e) => e.stopPropagation()} // Prevent clicks from closing the panel
      >
        <div className="p-4 max-h-screen overflow-y-auto">
          <button 
            onClick={toggleAuthPanel}
            className="absolute top-4 right-4 text-cakeBrown hover:text-cakePink bg-gray-100 p-2 rounded-full z-10 w-10 h-10 flex items-center justify-center"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="pt-12">
            {authType === 'login' && <Login />}
            {authType === 'signup' && <Signup />}
            {authType === 'otp' && <OTPVerify />}
          </div>
        </div>
      </div>
    </>
  );
};

export default Layout;
