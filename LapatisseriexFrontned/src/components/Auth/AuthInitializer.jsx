import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { initializeAuthListener, initializeAuth } from '../../redux/authSlice';

const AuthInitializer = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Initialize auth from localStorage first
    dispatch(initializeAuth());
    
    // Then set up Firebase auth listener
    dispatch(initializeAuthListener());
  }, [dispatch]);

  return null;
};

export default AuthInitializer;