import React from 'react';
import './CubeButton.css';

const CubeButton = ({ 
  children, 
  onClick, 
  disabled = false, 
  className = "",
  variant = "", // "save-variant", "cancel-variant", or ""
  style = {},
  ...props 
}) => {
  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        if (!disabled && onClick) {
          onClick(e);
        }
      }}
      className={`cube-button ${variant} ${disabled ? 'disabled' : ''} ${className}`}
      style={style}
      {...props}
    >
      <span>{children}</span>
      <span>{children}</span>
      <span>{children}</span>
      <span>{children}</span>
    </a>
  );
};

export default CubeButton;