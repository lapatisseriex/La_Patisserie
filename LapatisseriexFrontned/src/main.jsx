// Note: Avoid StrictMode in development to prevent double effect runs that can
// cause duplicate API calls and polling. You can re-enable in production.
// import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './styles/network-status.css';
import App from './App.jsx';


createRoot(document.getElementById('root')).render(
  <App />
);





