import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.userId = null;
  }

  connect(userId) {
    if (this.socket) {
      this.disconnect();
    }

    const serverUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
    
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true
    });

    this.userId = userId;

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.connected = true;
      
      // Authenticate with the server
      if (userId) {
        this.socket.emit('authenticate', userId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.connected = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.userId = null;
    }
  }

  onOrderStatusUpdate(callback) {
    if (this.socket) {
      this.socket.on('orderStatusUpdate', callback);
    }
  }

  offOrderStatusUpdate(callback) {
    if (this.socket) {
      this.socket.off('orderStatusUpdate', callback);
    }
  }

  onNewNotification(callback) {
    if (this.socket) {
      this.socket.on('newNotification', callback);
    }
  }

  offNewNotification(callback) {
    if (this.socket) {
      this.socket.off('newNotification', callback);
    }
  }

  isConnected() {
    return this.connected && this.socket?.connected;
  }

  getSocket() {
    return this.socket;
  }
}

// Create a singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;