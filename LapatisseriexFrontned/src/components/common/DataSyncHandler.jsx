import React, { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

/**
 * DataSyncHandler - Ensures user state stays synchronized with localStorage data
 * This component handles the synchronization between Redux user state and localStorage cached data
 */
const DataSyncHandler = () => {
  const { user, updateUser } = useAuth();

  useEffect(() => {
    const syncUserData = () => {
      try {
        // Get cached user data from localStorage
        const cachedUserString = localStorage.getItem('cachedUser');
        if (!cachedUserString) return;
        
        const cachedUser = JSON.parse(cachedUserString);
        
        // Check if current user state is missing data that exists in cache
        const needsSync = user && (
          // Location is null in state but exists in cache
          (!user.location && cachedUser.location) ||
          // Hostel is null in state but exists in cache
          (!user.hostel && cachedUser.hostel) ||
          // Location is a string in state but object in cache
          (typeof user.location === 'string' && typeof cachedUser.location === 'object') ||
          // Hostel is a string in state but object in cache
          (typeof user.hostel === 'string' && typeof cachedUser.hostel === 'object')
        );
        
        if (needsSync) {
          console.log('DataSyncHandler - Syncing user state with cached data');
          console.log('Current user state:', {
            uid: user?.uid,
            location: user?.location,
            hostel: user?.hostel
          });
          console.log('Cached user data:', {
            uid: cachedUser?.uid,
            location: cachedUser?.location,
            hostel: cachedUser?.hostel
          });
          
          // Update user state with cached data
          const syncedUserData = {
            ...user,
            ...cachedUser,
            // Ensure we keep the current user's identity fields
            uid: user.uid,
            email: user.email || cachedUser.email,
            name: user.name || cachedUser.name
          };
          
          console.log('DataSyncHandler - Updating user state with:', syncedUserData);
          updateUser && updateUser(syncedUserData);
        }
      } catch (error) {
        console.error('DataSyncHandler - Error syncing user data:', error);
      }
    };
    
    // Run sync immediately if user exists but has incomplete data
    if (user) {
      syncUserData();
    }
    
    // Set up periodic check for data consistency (every 5 seconds for the first minute after page load)
    let checksPerformed = 0;
    const maxChecks = 12; // 12 checks × 5 seconds = 1 minute
    
    const intervalId = setInterval(() => {
      checksPerformed++;
      
      if (checksPerformed >= maxChecks) {
        clearInterval(intervalId);
        return;
      }
      
      if (user) {
        syncUserData();
      }
    }, 5000);
    
    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
    
  }, [user?.uid, user?.location, user?.hostel, updateUser]);
  
  // This component doesn't render anything
  return null;
};

export default DataSyncHandler;