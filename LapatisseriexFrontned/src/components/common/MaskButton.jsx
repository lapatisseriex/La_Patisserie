import React from 'react';
import './MaskButton.css';

const MaskButton = ({ 
  children, 
  onClick, 
  disabled = false, 
  className = "",
  maskType = "nature", // "nature", "urban", or "custom"
  style = {},
  ...props 
}) => {
  const containerClass = maskType === "urban" ? "mask-button-container mask-urban" : "mask-button-container";
  
  return (
    <div className={`${containerClass} ${className}`} style={style}>
      <span className="mask-text">{children}</span>
      <button
        onClick={onClick}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    </div>
  );
};

export default MaskButton;