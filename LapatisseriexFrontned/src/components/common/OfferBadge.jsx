import React from 'react';

const baseStyle = {
  fontFamily: 'system-ui, -apple-system, sans-serif',
  color: '#733857',
  background: 'linear-gradient(90deg, rgba(255,255,255,0.95) 0%, #f4e6f1 40%, #dec4d7 100%)',
  clipPath: 'polygon(0 0, 100% 0, 95% 100%, 0% 100%)',
  boxShadow: '0 2px 4px rgba(115, 56, 87, 0.12)',
  maxWidth: '100%',
  whiteSpace: 'nowrap',
  overflow: 'hidden'
};

const OfferBadge = ({ label, className = '', style = {}, children }) => {
  const content = label || children;

  if (!content) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold uppercase tracking-tight ${className}`.trim()}
      style={{ ...baseStyle, ...style }}
    >
      {content}
    </span>
  );
};

export default OfferBadge;
