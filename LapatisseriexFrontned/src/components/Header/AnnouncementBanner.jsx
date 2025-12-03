import React from 'react';
import './AnnouncementBanner.css';

const AnnouncementBanner = () => {
  // Professional announcement messages - typography focused
  const announcements = [
    { label: 'WELCOME', text: 'Authentic Tiramisu Specialists' },
    { label: 'AUTHENTIC', text: 'Crafted with Italian Tradition' },
    { label: 'SIGNATURE', text: 'A Taste of Italy' },
    { label: 'OFFER', text: 'Free Cash on Every Order' },
    { label: 'LOYALTY', text: 'Order 10 Times, Get Free Dessert' },
    { label: 'DISCOVER', text: 'Premium Tiramisu Collection' },
  ];

  return (
    <>
      {/* Professional Contact Information Bar */}
      <div className="contact-info-bar">
        <div className="contact-info-container">
          <a href="tel:+917845712388" className="contact-info-item">
            <span className="contact-label">CALL</span>
            <span className="contact-text">+91 7845712388</span>
          </a>
      
          <span className="contact-separator"></span>
          
          <a href="mailto:lapatisserielapatisserie@gmail.com" className="contact-info-item">
            <span className="contact-label">EMAIL</span>
            <span className="contact-text">lapatisserielapatisserie@gmail.com</span>
          </a>
          
          <span className="contact-separator hidden lg:inline"></span>
          
          <div className="contact-info-item hidden lg:flex">
            <span className="contact-label">VISIT</span>
            <span className="contact-text">LIG 208 Gandhi Maannagar, Peelamedu, Coimbatore</span>
          </div>
        </div>
      </div>

      {/* Professional Announcement Banner */}
      <div className="announcement-banner">
        <div className="announcement-track">
          {/* Repeat announcements twice for seamless infinite scroll */}
          {[...announcements, ...announcements].map((announcement, index) => (
            <div key={index} className="announcement-item">
              <span className="announcement-label">{announcement.label}</span>
              <span className="announcement-divider">•</span>
              <span className="announcement-text">{announcement.text}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default AnnouncementBanner;
