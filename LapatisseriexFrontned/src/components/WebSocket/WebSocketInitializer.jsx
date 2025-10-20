import { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import webSocketService from '../../services/websocketService';

const WebSocketInitializer = () => {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const userId = user?._id || user?.uid || null;
    webSocketService.connect(userId);
  }, [user?._id, user?.uid, isAuthenticated]);

  useEffect(() => {
    return () => {
      webSocketService.disconnect();
    };
  }, []);

  return null;
};

export default WebSocketInitializer;
