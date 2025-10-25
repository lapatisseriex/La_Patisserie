import React from 'react';
import './FlipButton.css';

const FlipButton = ({ 
  frontText, 
  backText, 
  onClick, 
  selected = false,
  disabled = false,
  className = "",
  style = {},
  ...props 
}) => {
  return (
    <a
      href="#"
      className={`btn-flip ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''} ${className}`}
      data-front={frontText}
      data-back={backText}
      onClick={(e) => {
        e.preventDefault();
        if (!disabled && onClick) {
          onClick(e);
        }
      }}
      style={style}
      {...props}
    ></a>
  );
};

export default FlipButton;