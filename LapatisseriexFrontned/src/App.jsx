import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import ScrollToTop from "./ScrollToTop.jsx";

// Layout
import Layout from './components/Layout/Layout';
import AdminLayout from './components/Layout/AdminLayout';
import SwiggyLayout from './components/Layout/SwiggyLayout';

// Pages
import ProfilePage from './pages/Profile';
import FavoritesPage from './pages/Favorites';

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

// Cart and Payment Components
import Cart from './components/Cart/Cart';
import Payment from './components/Payment/Payment';

import Newsletter from './components/Newsletter/Newsletter';

// Auth Components
import AuthModal from './components/Auth/AuthModal/AuthModal';

// Context Providers
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext/AuthContext';
import { LocationProvider } from './context/LocationContext/LocationContext';
import { HostelProvider } from './context/HostelContext/HostelContext';
import { CategoryProvider } from './context/CategoryContext/CategoryContext';
import { ProductProvider } from './context/ProductContext/ProductContext';
import { FavoritesProvider } from './context/FavoritesContext/FavoritesContext';

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
    <AuthProvider>
      <LocationProvider>
        <HostelProvider>
          <CategoryProvider>
            <ProductProvider>
              <FavoritesProvider>
                <CartProvider>
                <Router>
                <ScrollToTop />
                  {/* Auth Modal - available on all pages */}
                  <AuthModal />
                
            <Routes>
             
              {/* Home with regular Layout */}
              <Route path="/" element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="contact" element={<Newsletter />} />
              </Route>

              {/* Product-focused routes with Swiggy-like Layout */}
              <Route path="/products" element={<SwiggyLayout><Products /></SwiggyLayout>} />
              <Route path="/favorites" element={<SwiggyLayout><FavoritesPage /></SwiggyLayout>} />
              <Route path="/cart" element={<SwiggyLayout><Cart /></SwiggyLayout>} />
              <Route path="/payment" element={<SwiggyLayout><Payment /></SwiggyLayout>} />
              
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
                </Route>
              </Route>
            </Routes>
          </Router>
                </CartProvider>
              </FavoritesProvider>
            </ProductProvider>
          </CategoryProvider>
        </HostelProvider>
      </LocationProvider>
    </AuthProvider>
  );
}

export default App;





