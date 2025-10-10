import React, { useState, lazy, Suspense } from 'react';
import { useSelector } from 'react-redux';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import ScrollToTop from "./ScrollToTop.jsx";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layout
import Layout from './components/Layout/Layout';
import AdminLayout from './components/Layout/AdminLayout';

// Pages
import ProfilePage from './pages/Profile';
import ProductDisplayPage from './pages/ProductDisplayPage';
import Favorites from './pages/Favorites';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import PrivacyPolicy from './pages/PrivacyPolicy';
import OurServices from './pages/OurServices';

// Error Boundary for Product Pages
import ProductErrorBoundary from './components/common/ProductErrorBoundary';

// Home Components
import Home from './components/Home/Home';
import Products from './components/Products/Products';

// Admin Components
import AdminDashboardLayout from './components/Admin/AdminDashboardLayout';
import AdminDashboard from './components/Admin/AdminDashboard';
import AdminUsers from './components/Admin/AdminUsers';
import AdminLocations from './components/Admin/AdminLocations';
import AdminProducts from './components/Admin/Products/AdminProducts';
import AdminCategories from './components/Admin/Categories/AdminCategories';
import AdminInventory from './components/Admin/Inventory/AdminInventory';
import AdminTimeSettings from './components/Admin/AdminTimeSettings';
import AdminOrders from './components/Admin/AdminOrders';
import AdminPayments from './components/Admin/AdminPayments';
import AdminAnalyticsDashboard from './pages/Admin/AdminAnalyticsDashboard';

// Cart and Payment Components
import Cart from './components/Cart/Cart';
import Payment from './components/Payment/Payment';

import Newsletter from './components/Newsletter/Newsletter';

// Auth Components
import NewAuthModal from './components/Auth/NewAuthModal/NewAuthModal';

// Common Components
import DataSyncHandler from './components/common/DataSyncHandler';

// Context Providers
import { useAuth } from './hooks/useAuth';
import { LocationProvider } from './context/LocationContext/LocationContext';
import { HostelProvider } from './context/HostelContext/HostelContext';
import { FavoritesProvider } from './context/FavoritesContext/FavoritesContext';
import { CategoryProvider } from './context/CategoryContext/CategoryContext';
import { ProductProvider } from './context/ProductContext/ProductContext'; // Only for admin routes
import { RecentlyViewedProvider } from './context/RecentlyViewedContext/RecentlyViewedContext';

import { ShopStatusProvider } from './context/ShopStatusContext';
import { SparkAnimationProvider } from './context/SparkAnimationContext/SparkAnimationContext';

// Redux Provider and Auth
import ReduxProvider from './redux/ReduxProvider';
import AuthInitializer from './components/Auth/AuthInitializer';

// Main Homepage that combines all sections
const HomePage = () => {
  const { user } = useAuth();

  return (
    <div className="homepage-container">
      <Home />
      {!user && <Newsletter />}
    </div>
  );
};
// Protected route for admin pages
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const hydrated = useSelector((state) => state?.auth?.hydrated ?? true);
  
  if (loading || !hydrated) {
    return <div>Loading...</div>;
  }
  
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" />;
  }
  
  return children;
};

// Protected route for authenticated users
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const hydrated = useSelector((state) => state?.auth?.hydrated ?? true);
  
  if (loading || !hydrated) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/" />;
  }
  
  return children;
};

function App() {
  return (
    <ReduxProvider>
      <AuthInitializer />
        <ShopStatusProvider>
          <LocationProvider>
            <HostelProvider>
              <CategoryProvider>
                <RecentlyViewedProvider>
                  <FavoritesProvider>
                    <SparkAnimationProvider>
                      <Router>
                        <ScrollToTop />
                        {/* Global toast notifications */}
                        <ToastContainer position="top-center" autoClose={2500} hideProgressBar theme="colored" />
                        {/* Data Sync Handler - ensures user state stays synchronized */}
                        <DataSyncHandler />
                        {/* Auth Modal - available on all pages */}
                        <NewAuthModal />
                        <Routes>
                          {/* Home with regular Layout */}
                          <Route path="/" element={<Layout />}>
                            <Route index element={<HomePage />} />
                            <Route path="contact" element={<Newsletter />} />
                            <Route path="products" element={<Products />} />
                            <Route path="privacy-policy" element={<PrivacyPolicy />} />
                            <Route path="our-services" element={<OurServices />} />
                            <Route path="product/:productId" element={
                              <ProductErrorBoundary>
                                <ProductDisplayPage />
                              </ProductErrorBoundary>
                            } />
                            <Route path="cart" element={<Cart />} />
                            <Route path="favorites" element={<Favorites />} />
                            <Route path="payment" element={<Payment />} />
                            {/* Demo Analytics Dashboard - Public Route */}
                            
                          </Route>
                          {/* Profile and Orders with regular Layout */}
                          <Route path="/" element={<Layout />}>
                            <Route path="profile" element={
                              <PrivateRoute>
                                <React.Suspense fallback={<div>Loading...</div>}>
                                  <ProfilePage />
                                </React.Suspense>
                              </PrivateRoute>
                            } />
                            <Route path="orders" element={
                              <PrivateRoute>
                                <Orders />
                              </PrivateRoute>
                            } />
                            <Route path="orders/:orderId" element={
                              <PrivateRoute>
                                <OrderDetail />
                              </PrivateRoute>
                            } />
                          </Route>
                          {/* Admin Routes with custom AdminLayout */}
                          <Route path="/admin" element={
                            <AdminRoute>
                              <ProductProvider>
                                <AdminLayout />
                              </ProductProvider>
                            </AdminRoute>
                          }>
                            <Route element={<AdminDashboardLayout />}>
                              <Route index element={<Navigate to="dashboard" />} />
                              <Route path="dashboard" element={<AdminDashboard />} />
                              <Route path="analytics" element={<AdminAnalyticsDashboard />} />
                              <Route path="users" element={<AdminUsers />} />
                              <Route path="locations" element={<AdminLocations />} />
                              <Route path="orders" element={<React.Suspense fallback={<div>Loading...</div>}><AdminOrders /></React.Suspense>} />
                              <Route path="payments" element={<React.Suspense fallback={<div>Loading...</div>}><AdminPayments /></React.Suspense>} />
                              <Route path="products" element={<React.Suspense fallback={<div>Loading...</div>}><AdminProducts /></React.Suspense>} />
                              <Route path="categories" element={<React.Suspense fallback={<div>Loading...</div>}><AdminCategories /></React.Suspense>} />
                              <Route path="categories/:categoryId/products" element={<React.Suspense fallback={<div>Loading...</div>}><AdminProducts /></React.Suspense>} />
              <Route path="inventory" element={<React.Suspense fallback={<div>Loading...</div>}><AdminInventory /></React.Suspense>} />
                              <Route path="time-settings" element={<React.Suspense fallback={<div>Loading...</div>}><AdminTimeSettings /></React.Suspense>} />
                            </Route>
                          </Route>
                          {/* Catch-all route for any undefined paths */}
                          <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                      </Router>
                    </SparkAnimationProvider>
                  </FavoritesProvider>
                </RecentlyViewedProvider>
              </CategoryProvider>
            </HostelProvider>
          </LocationProvider>
        </ShopStatusProvider>
    </ReduxProvider>
  );
}

export default App;





