import React from 'react';
import './AnnouncementBanner.css';

const AnnouncementBanner = () => {
  // Advertisement messages for running banner
  const announcements = [
    { icon: '🍰', text: 'Welcome to La Patisserie - Authentic Tiramisu Specialists!' },
    { icon: '✨', text: 'The Authentic Tiramisu - Crafted with Italian Tradition!' },
    { icon: '🎁', text: 'Try Our Signature Tiramisu - A Taste of Italy!' },
    { icon: '💰', text: 'Free Cash on Every Order!' },
    { icon: '🎉', text: 'Order 10 Times, Get Free Tiramisu Dessert!' },
    { icon: '👋', text: 'Welcome! Discover Our Authentic Tiramisu Collection!' },
  ];

  return (
    <>
      {/* Fixed Contact Information Bar - Not Scrolling */}
      <div className="contact-info-bar">
        <div className="contact-info-container">
          <a href="tel:+917845712388" className="contact-info-item">
            <span className="contact-icon">📞</span>
            <span className="contact-text">+91 7845712388</span>
          </a>
      
          <span className="contact-separator hidden md:inline">|</span>
          <a href="mailto:lapatisserielapatisserie@gmail.com" className="contact-info-item">
            <span className="contact-icon">📧</span>
            <span className="contact-text">lapatisserielapatisserie@gmail.com</span>
          </a>
          <span className="contact-separator hidden lg:inline">|</span>
          <div className="contact-info-item hidden lg:flex">
            <span className="contact-icon">📍</span>
            <span className="contact-text">LIG 208 Gandhi Nagar, Peelamedu, Coimbatore</span>
          </div>
        </div>
      </div>

      {/* Running Announcement Banner */}
      <div className="announcement-banner">
        <div className="announcement-track">
          {/* Repeat announcements twice for seamless infinite scroll */}
          {[...announcements, ...announcements].map((announcement, index) => (
            <div key={index} className="announcement-item">
              <span className="announcement-icon">{announcement.icon}</span>
              <span className="announcement-text">{announcement.text}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default AnnouncementBanner;
