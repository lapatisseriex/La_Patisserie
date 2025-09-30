import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import ScrollToTop from "./ScrollToTop.jsx";

// Layout
import Layout from './components/Layout/Layout';
import AdminLayout from './components/Layout/AdminLayout';

// Pages
import ProfilePage from './pages/Profile';
import ProductDisplayPage from './pages/ProductDisplayPage';
import Favorites from './pages/Favorites';

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
import AdminTimeSettings from './components/Admin/AdminTimeSettings';

// Cart and Payment Components
import Cart from './components/Cart/Cart';
import Payment from './components/Payment/Payment';

import Newsletter from './components/Newsletter/Newsletter';

// Auth Components
import AuthModal from './components/Auth/AuthModal/AuthModal';

// Context Providers
import { AuthProvider, useAuth } from './context/AuthContext/AuthContext';
import { LocationProvider } from './context/LocationContext/LocationContext';
import { HostelProvider } from './context/HostelContext/HostelContext';
import { FavoritesProvider } from './context/FavoritesContext/FavoritesContext';
import { CategoryProvider } from './context/CategoryContext/CategoryContext';
import { ProductProvider } from './context/ProductContext/ProductContext';
import { RecentlyViewedProvider } from './context/RecentlyViewedContext/RecentlyViewedContext';

import { ShopStatusProvider } from './context/ShopStatusContext';
import { SparkAnimationProvider } from './context/SparkAnimationContext/SparkAnimationContext';

// Redux Provider
import { Provider } from 'react-redux';
import store from './redux/store';

// Main Homepage that combines all sections
const HomePage = () => {
  const { user } = useAuth(); // Access user from context

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
  
  if (loading) {
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
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/" />;
  }
  
  return children;
};

function App() {
  return (
    <Provider store={store}>
      <ShopStatusProvider>
        <AuthProvider>
          <LocationProvider>
            <HostelProvider>
              <CategoryProvider>
                <ProductProvider>
                    <RecentlyViewedProvider>
                        <FavoritesProvider>
                          <SparkAnimationProvider>
                        <Router>
                          <ScrollToTop />
                          {/* Auth Modal - available on all pages */}
                          <AuthModal />
                          {/* Debug component for development only */}
                         
                        
                          <Routes>
                           
                            {/* Home with regular Layout */}
                            <Route path="/" element={<Layout />}>
                              <Route index element={<HomePage />} />
                              <Route path="contact" element={<Newsletter />} />
                              <Route path="products" element={<Products />} />
                              <Route path="product/:productId" element={
                                <ProductErrorBoundary>
                                  <ProductDisplayPage />
                                </ProductErrorBoundary>
                              } />
                              <Route path="cart" element={<Cart />} />
                              <Route path="favorites" element={<Favorites />} />
                              <Route path="payment" element={<Payment />} />
                            </Route>
              
              {/* Profile and Orders with regular Layout */}
              <Route path="/" element={<Layout />}>
                <Route path="profile" element={
                  <PrivateRoute>
                    {/* Use the dedicated ProfilePage component */}
                    <React.Suspense fallback={<div>Loading...</div>}>
                      <ProfilePage />
                    </React.Suspense>
                  </PrivateRoute>
                } />
                <Route path="orders" element={
                  <PrivateRoute>
                    <div>Orders Page</div>
                  </PrivateRoute>
                } />
              </Route>
              
              {/* Admin Routes with custom AdminLayout */}
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }>
                <Route element={<AdminDashboardLayout />}>
                  <Route index element={<Navigate to="dashboard" />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="locations" element={<AdminLocations />} />
                  <Route path="orders" element={<div>Admin Orders</div>} />
                  <Route path="products" element={<React.Suspense fallback={<div>Loading...</div>}><AdminProducts /></React.Suspense>} />
                  <Route path="categories" element={<React.Suspense fallback={<div>Loading...</div>}><AdminCategories /></React.Suspense>} />
                  <Route path="categories/:categoryId/products" element={<React.Suspense fallback={<div>Loading...</div>}><AdminProducts /></React.Suspense>} />
                  {/* Banners route removed: banners are managed statically in codebase */}
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
              </ProductProvider>
            </CategoryProvider>
          </HostelProvider>
        </LocationProvider>
      </AuthProvider>
    </ShopStatusProvider>
    </Provider>
  );
}

export default App;





