import React from 'react';
import './StyleButton.css';

const StyleButton = ({ 
  children, 
  onClick, 
  disabled = false, 
  className = "",
  style = {},
  ...props 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn-style702 ${disabled ? 'disabled' : ''} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </button>
  );
};

export default StyleButton;