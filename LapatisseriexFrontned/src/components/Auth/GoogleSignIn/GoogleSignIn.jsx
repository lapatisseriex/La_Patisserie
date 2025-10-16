import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import '../auth.css';

const GoogleSignIn = () => {
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle, error, clearError, toggleAuthPanel, user, isAuthenticated } = useAuth();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    clearError();
    
    try {
      console.log('🔄 Starting Google sign in...');
      const success = await signInWithGoogle({});
      console.log('✅ Google sign in result:', success);
      
      if (success) {
        console.log('🎉 Google sign in successful, closing modal...');
        // Small delay to allow Redux state to update
        setTimeout(() => {
          toggleAuthPanel();
        }, 100);
      } else {
        console.log('❌ Google sign in failed');
      }
    } catch (err) {
      console.error('❌ Google sign in error:', err);
      
      // Handle specific error cases
      if (err.code === 'auth/cancelled-popup-request' || 
          err.code === 'auth/popup-closed-by-user' ||
          err.message.includes('cancelled') ||
          err.message.includes('closed')) {
        console.log('🚫 Google sign in cancelled by user');
        // Dispatch cancellation event
        window.dispatchEvent(new CustomEvent('auth:cancelled', { 
          detail: { provider: 'google', reason: 'user_cancelled' } 
        }));
        clearError(); // Don't show error for user cancellation
      } else if (err.code === 'auth/network-request-failed' || 
                 err.message.includes('network') || 
                 err.message.includes('fetch')) {
        console.log('🌐 Google sign in network error');
        window.dispatchEvent(new CustomEvent('network:error', { 
          detail: { message: 'Network connection issue', critical: false } 
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  // Also close modal if user becomes authenticated
  React.useEffect(() => {
    if (isAuthenticated && user) {
      console.log('🔐 User authenticated, closing modal via useEffect');
      toggleAuthPanel();
    }
  }, [isAuthenticated, user, toggleAuthPanel]);

  return (
    <div className="google-signin-container">
      <button 
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="google-signin-btn"
      >
        <div className="google-icon">
          <svg viewBox="0 0 24 24" className="w-5 h-5">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        </div>
        <span>
          {loading ? 'Signing in...' : 'Continue with Google'}
        </span>
      </button>
      
      {error && (
        <div className="error-message mt-2">
          {error}
        </div>
      )}
    </div>
  );
};

export default GoogleSignIn;