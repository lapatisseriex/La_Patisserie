import React from 'react';
import './AnimatedButton.css';

const AnimatedButton = ({ 
  children, 
  onClick, 
  disabled = false, 
  className = "",
  variant = "checkout-variant",
  style = {},
  ...props 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`animated-btn ${variant} ${className}`}
      style={{ 
        ...style 
      }}
      {...props}
    >
      <div className="left"></div>
      <span className="btn-text" style={{ position: 'relative', zIndex: 10 }}>
        {children}
      </span>
      <div className="right"></div>
    </button>
  );
};

export default AnimatedButton;