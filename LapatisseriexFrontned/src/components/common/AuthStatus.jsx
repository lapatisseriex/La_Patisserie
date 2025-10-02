import React from 'react';
import { useAuth } from '../../context/AuthContext/AuthContextRedux';

/**
 * Simple auth status indicator that can be added to any component
 * Shows current auth state in a non-intrusive way
 */
const AuthStatus = ({ showDetails = false, className = '' }) => {
  const { user, isAuthenticated, loading, error } = useAuth();

  const getStatusColor = () => {
    if (loading) return '#f59e0b';
    if (error) return '#ef4444';
    if (isAuthenticated) return '#10b981';
    return '#6b7280';
  };

  const getStatusText = () => {
    if (loading) return 'Loading...';
    if (error) return 'Error';
    if (isAuthenticated) return 'Authenticated';
    return 'Not Authenticated';
  };

  if (!showDetails) {
    return (
      <div 
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 8px',
          borderRadius: '4px',
          backgroundColor: getStatusColor() + '20',
          border: `1px solid ${getStatusColor()}`,
          fontSize: '12px',
          fontWeight: '500'
        }}
      >
        <div 
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: getStatusColor()
          }}
        />
        <span style={{ color: getStatusColor() }}>
          {getStatusText()}
        </span>
      </div>
    );
  }

  return (
    <div 
      className={className}
      style={{
        padding: '12px',
        borderRadius: '8px',
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
        fontSize: '14px'
      }}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        marginBottom: '8px'
      }}>
        <div 
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: getStatusColor()
          }}
        />
        <strong>{getStatusText()}</strong>
      </div>
      
      {isAuthenticated && user && (
        <div style={{ color: '#6b7280', fontSize: '12px' }}>
          <div>👤 {user.name || 'User'}</div>
          <div>📞 {user.phone}</div>
          {user.role === 'admin' && <div>👑 Admin</div>}
        </div>
      )}
      
      {error && (
        <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
};

// HOC to add auth status to any component
export const withAuthStatus = (WrappedComponent, options = {}) => {
  return function ComponentWithAuthStatus(props) {
    return (
      <div>
        {options.showAuthStatus !== false && (
          <AuthStatus 
            showDetails={options.showDetails} 
            className={options.authStatusClassName}
          />
        )}
        <WrappedComponent {...props} />
      </div>
    );
  };
};

export default AuthStatus;