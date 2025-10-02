import React from 'react';

const ProductDebugPanel = ({ productId }) => {
  // ProductDebugPanel is now replaced by ReduxStateDebugger
  // This component only works in admin routes where ProductProvider is available
  // For user-facing pages, use the Redux debugger (Ctrl+Shift+D) instead
  
  // Check if we're in an admin route by looking at the URL
  const isAdminRoute = window.location.pathname.startsWith('/admin');
  
  if (!isAdminRoute) {
    // Return null for non-admin routes to avoid ProductProvider dependency issues
    return null;
  }
  
  // For admin routes, we could implement admin-specific debug functionality here
  // For now, just return null since Redux debugger handles most debugging needs
  return null;
};

export default ProductDebugPanel;