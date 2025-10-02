import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { initializeAuth, getCurrentUser, authExpired } from '../../redux/authSlice';

const AuthInitializer = ({ children }) => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const lastFirebaseUidRef = useRef(null);

  useEffect(() => {
    // Initialize auth state from localStorage only once
    dispatch(initializeAuth());
  }, [dispatch]);

  useEffect(() => {
    const auth = getAuth();
    
    // Set up Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const currentUid = firebaseUser?.uid || null;
      
      // Only process if the Firebase user actually changed
      if (lastFirebaseUidRef.current !== currentUid) {
        lastFirebaseUidRef.current = currentUid;
        
        if (firebaseUser) {
          try {
            // Only get current user if we don't have user data or the UID changed
            if (!user || user.uid !== firebaseUser.uid) {
              await dispatch(getCurrentUser()).unwrap();
            }
          } catch (error) {
            console.error('Error getting current user:', error);
            // If we can't get user data, clear auth state
            dispatch(authExpired());
          }
        } else {
          // Firebase user signed out, clear auth state
          if (isAuthenticated) {
            dispatch(authExpired());
          }
        }
      }
    });

    // Listen for auth expired events from apiService
    const handleAuthExpired = (event) => {
      console.log('Auth expired event received');
      dispatch(authExpired());
    };
    
    window.addEventListener('auth:expired', handleAuthExpired);

    // Cleanup function
    return () => {
      unsubscribe();
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, [dispatch, user, isAuthenticated]);

  // This component doesn't render anything, just initializes auth
  return children || null;
};

export default AuthInitializer;