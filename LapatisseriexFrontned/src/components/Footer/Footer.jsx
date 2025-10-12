import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="relative bg-gradient-to-br from-[#040404] via-[#281c20] to-[#412434] pt-16 pb-6" id="contact">
      {/* Decorative Top Border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#733857] to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Top Section - Logo & Tagline */}
        <div className="text-center mb-12 pb-12 border-b border-[#733857]/20">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className="w-16 h-16 flex items-center justify-center">
              <img 
                src="/images/logo.png" 
                alt="La Pâtisserie" 
                className="w-full h-full object-contain brightness-0 invert opacity-90" 
              />
            </div>
            <h2 className="text-3xl md:text-4xl font-extralight tracking-[0.3em] text-white uppercase" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              La Pâtisserie
            </h2>
          </div>
          <p className="text-[#f5f5f5]/60 text-sm font-light tracking-[0.15em] max-w-2xl mx-auto" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            The Authentic Tiramisu
          </p>
        </div>

        {/* Main Content - Horizontal Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
          
          {/* Navigate */}
          <div className="text-center lg:text-left">
            <h3 className="text-[#733857] text-xs font-medium tracking-[0.25em] uppercase mb-6" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Navigate
            </h3>
            <nav className="space-y-3">
              <Link 
                to="/" 
                className="block text-white/70 hover:text-[#733857] text-sm font-light transition-all duration-300 hover:translate-x-1"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                Home
              </Link>
              <Link 
                to="/products" 
                className="block text-white/70 hover:text-[#733857] text-sm font-light transition-all duration-300 hover:translate-x-1"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                Products
              </Link>
            </nav>
          </div>

          {/* Account */}
          <div className="text-center lg:text-left">
            <h3 className="text-[#733857] text-xs font-medium tracking-[0.25em] uppercase mb-6" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Account
            </h3>
            <nav className="space-y-3">
              <Link 
                to="/profile" 
                className="block text-white/70 hover:text-[#733857] text-sm font-light transition-all duration-300 hover:translate-x-1"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                Account Info
              </Link>
              <Link 
                to="/orders" 
                className="block text-white/70 hover:text-[#733857] text-sm font-light transition-all duration-300 hover:translate-x-1"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                My Orders
              </Link>
              <Link 
                to="/privacy-policy" 
                className="block text-white/70 hover:text-[#733857] text-sm font-light transition-all duration-300 hover:translate-x-1"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                Privacy Policy
              </Link>
              <Link 
                to="/payment" 
                className="block text-white/70 hover:text-[#733857] text-sm font-light transition-all duration-300 hover:translate-x-1"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                Payment
              </Link>
              <Link 
                to="/our-services" 
                className="block text-white/70 hover:text-[#733857] text-sm font-light transition-all duration-300 hover:translate-x-1"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                Services
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="text-center lg:text-left">
            <h3 className="text-[#733857] text-xs font-medium tracking-[0.25em] uppercase mb-6" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Connect
            </h3>
            <div className="space-y-3">
              <a 
                href="tel:+917845712388" 
                className="flex items-center justify-center lg:justify-start space-x-3 text-white/70 hover:text-[#733857] text-sm font-light transition-colors duration-300 group"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                <div className="w-7 h-7 rounded border border-white/10 flex items-center justify-center group-hover:border-[#733857]/50 transition-colors duration-300">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <span>+91 7845712388</span>
              </a>
              
              <a 
                href="tel:+919362166816" 
                className="flex items-center justify-center lg:justify-start space-x-3 text-white/70 hover:text-[#733857] text-sm font-light transition-colors duration-300 group"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                <div className="w-7 h-7 rounded border border-white/10 flex items-center justify-center group-hover:border-[#733857]/50 transition-colors duration-300">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <span>+91 9362166816</span>
              </a>
              
              <a 
                href="mailto:lapatisserielapatisserie@gmail.com" 
                className="flex items-center justify-center lg:justify-start space-x-3 text-white/70 hover:text-[#733857] text-sm font-light transition-colors duration-300 group"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                <div className="w-7 h-7 rounded border border-white/10 flex items-center justify-center group-hover:border-[#733857]/50 transition-colors duration-300">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <span className="truncate">contact@lapatisserie.com</span>
              </a>
              
              <div className="flex items-start justify-center lg:justify-start space-x-3 text-white/70 text-sm font-light" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                <div className="w-7 h-7 rounded border border-white/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-left">
                  LIG 208 Gandhi Nagar<br />
                  Peelamedu, Coimbatore
                </span>
              </div>
            </div>
          </div>

          {/* Newsletter & Stores */}
          <div className="text-center lg:text-left">
            <h3 className="text-[#733857] text-xs font-medium tracking-[0.25em] uppercase mb-6" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Sign up for updates
            </h3>
            
            {/* Newsletter Form */}
            <div className="mb-8">
              <div className="flex flex-col gap-3 mb-6">
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Enter your email..."
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded text-white/70 text-sm font-light placeholder-white/40 focus:outline-none focus:border-[#733857]/50 transition-colors duration-300"
                    style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="w-4 h-4 text-[#733857]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                </div>
                <button 
                  className="w-full px-6 py-2.5 bg-transparent border border-[#733857] text-[#733857] text-sm font-medium tracking-[0.15em] uppercase rounded hover:bg-[#733857] hover:text-white transition-all duration-300"
                  style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                >
                  Sign Up
                </button>
              </div>
            </div>

            {/* Our Stores */}
            <div>
              <h4 className="text-white/60 text-xs font-medium tracking-[0.25em] uppercase mb-4" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                Our Stores
              </h4>
              <div className="text-white/50 text-xs leading-relaxed font-light" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                <p>Coimbatore</p>
              </div>
            </div>
          </div>
        </div>

        {/* Social Media - Centered */}
        <div className="flex items-center justify-center space-x-4 mb-10 pb-10 border-b border-[#733857]/20">
          <a 
            href="#" 
            className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-[#733857] hover:border-[#733857]/50 transition-all duration-300 hover:scale-110"
            aria-label="Facebook"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
            </svg>
          </a>
          <a 
            href="#" 
            className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-[#733857] hover:border-[#733857]/50 transition-all duration-300 hover:scale-110"
            aria-label="Instagram"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </a>
          <a 
            href="#" 
            className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-[#733857] hover:border-[#733857]/50 transition-all duration-300 hover:scale-110"
            aria-label="LinkedIn"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" />
            </svg>
          </a>
        </div>

        {/* Bottom Copyright */}
        <div className="text-center">
          <p className="text-white/40 text-xs font-light tracking-wider mb-2" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            © {new Date().getFullYear()} La Pâtisserie. All rights reserved.
          </p>
          <p className="text-white/30 text-xs font-light" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            Crafted with <span className="text-[#733857]">♥</span> for dessert lovers
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
          
        