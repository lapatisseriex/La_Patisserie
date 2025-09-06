import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, createContext } from 'react';
import './App.css';

// Layout
import Layout from './components/Layout/Layout';

// Home Components
import Home from './components/Home/Home';
import Products from './components/Products/Products';
import ProductDetail from './components/Products/ProductDetail';

// Cart and Payment Components
import Cart from './components/Cart/Cart';
import Payment from './components/Payment/Payment';

import Newsletter from './components/Newsletter/Newsletter';

// Auth Components
import Login from './components/Auth/Login/Login';
import Signup from './components/Auth/Signup/Signup';
import OTPVerify from './components/Auth/OTPVerify/OTPVerify';

// Context Providers
import { CartProvider } from './context/CartContext';

// Create Auth context
export const AuthContext = createContext();

// Main Homepage that combines all sections
const HomePage = () => (
  <div className="homepage-container">
    <Home />
    <Products />
    <Newsletter />
  </div>
);

function App() {
  const [isAuthPanelOpen, setIsAuthPanelOpen] = useState(false);
  const [authType, setAuthType] = useState('login'); // login, signup, otp
  const [userLocation, setUserLocation] = useState('Your City');
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Just for UI display

  const toggleAuthPanel = () => {
    setIsAuthPanelOpen(!isAuthPanelOpen);
  };

  const changeAuthType = (type) => {
    setAuthType(type);
  };
  
  // Simple logout function for UI demonstration
  const logout = () => setIsLoggedIn(false);

  return (
    <AuthContext.Provider value={{ 
      isAuthPanelOpen, 
      toggleAuthPanel, 
      authType, 
      changeAuthType,
      isLoggedIn,
      logout, 
      userLocation, 
      setUserLocation 
    }}>
      <CartProvider>
        <Router>
          <Routes>
            {/* Main Layout Routes */}
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="products" element={<Products />} />
              <Route path="product/:id" element={<ProductDetail />} />
              <Route path="cart" element={<Cart />} />
              <Route path="payment" element={<Payment />} />
              <Route path="contact" element={<Newsletter />} />
            </Route>
          </Routes>
        </Router>
      </CartProvider>
    </AuthContext.Provider>
  );
}

export default App;
