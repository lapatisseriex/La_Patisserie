import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.userId = null;
    this.currentAuthId = null;
  }

  connect(userId) {
    const normalizedId = userId ? userId.toString() : null;

    if (normalizedId && this.userId !== normalizedId) {
      this.userId = normalizedId;

      if (this.socket && this.socket.connected) {
        if (this.currentAuthId && this.currentAuthId !== normalizedId) {
          this.socket.emit('logout');
        }
        this.socket.emit('authenticate', normalizedId);
        this.currentAuthId = normalizedId;
      }
    }

    if (this.socket) {
      if (!this.socket.connected) {
        this.socket.connect();
      }

      if (this.socket.connected && this.userId && this.currentAuthId !== this.userId) {
        this.socket.emit('authenticate', this.userId);
        this.currentAuthId = this.userId;
      }

      return this.socket;
    }

    const serverUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 5000, // Reduce timeout for faster connection attempts
      forceNew: false, // Reuse connections when possible
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000, // Start reconnecting quickly
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5
    });

    if (normalizedId && !this.userId) {
      this.userId = normalizedId;
    }

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.connected = true;

      if (this.userId) {
        this.socket.emit('authenticate', this.userId);
        this.currentAuthId = this.userId;
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      this.connected = false;
      this.currentAuthId = null;
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.connected = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      if (this.currentAuthId) {
        this.socket.emit('logout');
      }
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.userId = null;
      this.currentAuthId = null;
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

  onShopStatusUpdate(callback) {
    if (this.socket) {
      this.socket.on('shopStatusUpdate', callback);
    }
  }

  offShopStatusUpdate(callback) {
    if (this.socket) {
      this.socket.off('shopStatusUpdate', callback);
    }
  }

  onOrderStatusUpdated(callback) {
    if (this.socket) {
      this.socket.on('orderStatusUpdated', callback);
    }
  }

  offOrderStatusUpdated(callback) {
    if (this.socket) {
      this.socket.off('orderStatusUpdated', callback);
    }
  }

  onNewOrderPlaced(callback) {
    if (this.socket) {
      this.socket.on('newOrderPlaced', callback);
    }
  }

  offNewOrderPlaced(callback) {
    if (this.socket) {
      this.socket.off('newOrderPlaced', callback);
    }
  }

  onPaymentUpdated(callback) {
    if (this.socket) {
      this.socket.on('paymentUpdated', callback);
    }
  }

  offPaymentUpdated(callback) {
    if (this.socket) {
      this.socket.off('paymentUpdated', callback);
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
