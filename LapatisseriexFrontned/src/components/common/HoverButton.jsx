import React from 'react';
import './HoverButton.css';

const HoverButton = ({ 
  text,
  children, 
  hoverText,
  onClick, 
  disabled = false, 
  variant = 'primary',
  size = 'medium',
  className = "",
  style = {},
  href = "#",
  ...props 
}) => {
  const handleClick = (e) => {
    if (href === "#") {
      e.preventDefault();
    }
    if (!disabled && onClick) {
      onClick(e);
    }
  };

  const displayText = text || children;
  const variantClass = variant && variant !== 'primary' ? variant : '';
  const sizeClass = size && size !== 'medium' ? size : '';

  return (
    <a
      href={href}
      onClick={handleClick}
      className={`click-btn btn-style900 ${variantClass} ${sizeClass} ${disabled ? 'disabled' : ''} ${className}`}
      data-hover={hoverText || displayText}
      style={style}
      {...props}
    >
      <span style={{ position: 'relative', zIndex: 1 }}>{displayText}</span>
    </a>
  );
};

export default HoverButton;