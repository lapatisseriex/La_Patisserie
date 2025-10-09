import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { initializeAuthListener, initializeAuth, getCurrentUser } from '../../redux/authSlice';

const AuthInitializer = () => {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated } = useSelector(state => state.auth);

  useEffect(() => {
    // Initialize auth from localStorage first
    dispatch(initializeAuth());
    
    // Then set up Firebase auth listener
    dispatch(initializeAuthListener());
  }, [dispatch]);

  // Refresh user data if we have authentication but incomplete location data
  useEffect(() => {
    if (isAuthenticated && token && user && 
        (!user.location || typeof user.location === 'string')) {
      console.log('AuthInitializer: Refreshing user data for complete location info');
      dispatch(getCurrentUser());
    }
  }, [dispatch, isAuthenticated, token, user?.location]);

  return null;
};

export default AuthInitializer;