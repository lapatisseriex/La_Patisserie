import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { getWebSocketBaseUrl, getSocketOptions } from '../utils/websocketUrl.js';

const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [newOrderReceived, setNewOrderReceived] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Get API URL from environment
    const apiUrl = getWebSocketBaseUrl();
    console.log('[useWebSocket] WS base:', apiUrl);

    socketRef.current = io(apiUrl, getSocketOptions({ autoConnect: true }));
    let heartbeatInterval = setInterval(() => {
      if (socketRef.current?.connected) socketRef.current.emit('ping');
    }, 30000);

    const socket = socketRef.current;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('WebSocket connected:', socket.id);
      setIsConnected(true);
      
      // Authenticate if user is admin (could be enhanced with actual admin check)
      const authToken = localStorage.getItem('authToken');
      if (authToken) {
        // For simplicity, we'll just connect without specific admin authentication
        // In production, you might want to verify admin status
        socket.emit('authenticate', 'admin');
      }
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    // Listen for new order events
    socket.on('newOrderPlaced', (data) => {
      console.log('🔔 New order received via WebSocket:', data);
      setNewOrderReceived(data);
      
      // Auto-clear the notification after a short delay
      setTimeout(() => {
        setNewOrderReceived(null);
      }, 10000); // Clear after 10 seconds
    });

    // Listen for shop status updates (already implemented in backend)
    socket.on('shopStatusUpdate', (status) => {
      console.log('Shop status update:', status);
      // This could be used to update shop status across the admin interface
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('connect_error');
        socket.off('newOrderPlaced');
        socket.off('shopStatusUpdate');
        socket.disconnect();
      }
      clearInterval(heartbeatInterval);
    };
  }, []);

  // Method to manually clear new order notification
  const clearNewOrderNotification = () => {
    setNewOrderReceived(null);
  };

  // Method to emit events (for future use)
  const emit = (event, data) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    }
  };

  return {
    isConnected,
    newOrderReceived,
    clearNewOrderNotification,
    emit,
    socket: socketRef.current
  };
};

export default useWebSocket;