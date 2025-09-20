import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import AOS from 'aos';
import 'aos/dist/aos.css';

// Initialize AOS with custom settings
AOS.init({
  duration: 800,
  easing: 'ease-in-out-cubic',
  once: true,
  offset: 50,
  delay: 100,
  mirror: false,
  anchorPlacement: 'top-bottom'
});


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);





