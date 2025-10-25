import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import './BlobButton.css';

// Global variable to track if SVG filter is already added
let svgFilterAdded = false;

const BlobButton = ({ 
  children, 
  onClick, 
  disabled = false, 
  className = '', 
  style = {},
  type = 'button',
  ...props 
}) => {
  useEffect(() => {
    // Add SVG filter to document only once
    if (!svgFilterAdded) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svg.setAttribute('version', '1.1');
      svg.style.position = 'absolute';
      svg.style.width = '0';
      svg.style.height = '0';
      svg.style.pointerEvents = 'none';
      
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
      filter.setAttribute('id', 'goo');
      
      const blur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
      blur.setAttribute('in', 'SourceGraphic');
      blur.setAttribute('result', 'blur');
      blur.setAttribute('stdDeviation', '10');
      
      const colorMatrix = document.createElementNS('http://www.w3.org/2000/svg', 'feColorMatrix');
      colorMatrix.setAttribute('in', 'blur');
      colorMatrix.setAttribute('mode', 'matrix');
      colorMatrix.setAttribute('values', '1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 21 -7');
      colorMatrix.setAttribute('result', 'goo');
      
      const blend = document.createElementNS('http://www.w3.org/2000/svg', 'feBlend');
      blend.setAttribute('in2', 'goo');
      blend.setAttribute('in', 'SourceGraphic');
      blend.setAttribute('result', 'mix');
      
      filter.appendChild(blur);
      filter.appendChild(colorMatrix);
      filter.appendChild(blend);
      defs.appendChild(filter);
      svg.appendChild(defs);
      
      document.body.appendChild(svg);
      svgFilterAdded = true;
    }
  }, []);

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`blob-btn ${className}`}
      style={{
        ...style
      }}
      {...props}
    >
      {/* Before pseudo-element replacement */}
      <span
        className="blob-btn-before"
        style={{
          border: `2px solid ${disabled ? '#9ca3af' : '#733857'}`
        }}
      />

      {/* After pseudo-element replacement */}
      <span
        className="blob-btn-after"
        style={{
          left: '3px',
          top: '3px',
          width: 'calc(100% - 6px)',
          height: 'calc(100% - 6px)'
        }}
      />

      {/* Inner container */}
      <span className="blob-btn__inner">
        {/* Blobs container */}
        <span className="blob-btn__blobs">
          {/* Individual blobs */}
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="blob-btn__blob"
              style={{
                background: disabled ? '#9ca3af' : '#733857',
                transitionDelay: `${i * 0.08}s`,
                left: `${i * 30}%`
              }}
            />
          ))}
        </span>
      </span>

      {/* Button content */}
      <span style={{ position: 'relative', zIndex: 2 }}>
        {children}
      </span>
    </button>
  );
};

BlobButton.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object,
  type: PropTypes.string
};

export default BlobButton;