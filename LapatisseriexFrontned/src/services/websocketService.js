import { io } from 'socket.io-client';
import { getWebSocketBaseUrl, getSocketOptions } from '../utils/websocketUrl.js';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.userId = null;
    this.currentAuthId = null;
    this.isInitializing = false;
  }

  connect(userId) {
    const normalizedId = userId ? userId.toString() : null;

    // Update userId if changed
    if (normalizedId && this.userId !== normalizedId) {
      this.userId = normalizedId;

      // If already connected with different user, re-authenticate
      if (this.socket && this.socket.connected) {
        if (this.currentAuthId && this.currentAuthId !== normalizedId) {
          console.log('🔄 User changed, logging out old user:', this.currentAuthId);
          this.socket.emit('logout');
        }
        console.log('🔐 Re-authenticating with new user:', normalizedId);
        this.socket.emit('authenticate', normalizedId);
        this.currentAuthId = normalizedId;
      }
    }

    // If socket exists and is connected, just return it (idempotent)
    if (this.socket && this.socket.connected) {
      // Ensure authentication is in sync
      if (this.userId && this.currentAuthId !== this.userId) {
        console.log('🔐 Re-authenticating user:', this.userId);
        this.socket.emit('authenticate', this.userId);
        this.currentAuthId = this.userId;
      }
      return this.socket;
    }

    // If socket exists but disconnected, try to reconnect
    if (this.socket && !this.socket.connected) {
      console.log('🔌 Reconnecting existing socket...');
      this.socket.connect();
      return this.socket;
    }

    // Prevent multiple simultaneous initializations
    if (this.isInitializing) {
      console.log('⏳ Socket initialization already in progress...');
      return this.socket;
    }

    // Create new socket connection
    this.isInitializing = true;
    const serverUrl = getWebSocketBaseUrl();
    console.log('[WebSocketService] Creating new socket connection to:', serverUrl);

    this.socket = io(serverUrl, getSocketOptions());

    if (normalizedId && !this.userId) {
      this.userId = normalizedId;
    }

    // Connection event handlers
    this.socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server, socket ID:', this.socket.id);
      this.connected = true;
      this.isInitializing = false;

      // Authenticate immediately on connection
      if (this.userId) {
        console.log('🔐 Authenticating user:', this.userId);
        this.socket.emit('authenticate', this.userId);
        this.currentAuthId = this.userId;
      } else {
        console.log('⚠️ No userId available for authentication');
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from WebSocket. Reason:', reason);
      this.connected = false;
      this.currentAuthId = null;
      
      // Don't reset userId on disconnect - we'll need it for reconnection
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        console.log('🔄 Server disconnected, attempting reconnection...');
        this.socket.connect();
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconnected after', attemptNumber, 'attempts');
      
      // Re-authenticate on reconnection
      if (this.userId) {
        console.log('🔐 Re-authenticating user after reconnection:', this.userId);
        this.socket.emit('authenticate', this.userId);
        this.currentAuthId = this.userId;
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error?.message || error);
      this.connected = false;
      this.isInitializing = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting WebSocket...');
      
      if (this.currentAuthId) {
        console.log('👋 Logging out user:', this.currentAuthId);
        this.socket.emit('logout');
      }
      
      this.socket.disconnect();
      this.socket.removeAllListeners();
      this.socket = null;
      this.connected = false;
      this.userId = null;
      this.currentAuthId = null;
      this.isInitializing = false;
    }
  }
  
  getSocket() {
    return this.socket;
  }
  
  isConnected() {
    return this.socket && this.socket.connected;
  }

  onOrderStatusUpdate(callback) {
    if (this.socket) {
      console.log('🎧 Subscribing to orderStatusUpdate events');
      this.socket.on('orderStatusUpdate', callback);
    } else {
      console.warn('⚠️ Cannot subscribe to orderStatusUpdate - socket not initialized');
    }
  }

  offOrderStatusUpdate(callback) {
    if (this.socket) {
      console.log('🔇 Unsubscribing from orderStatusUpdate events');
      this.socket.off('orderStatusUpdate', callback);
    }
  }

  onNewNotification(callback) {
    if (this.socket) {
      console.log('🎧 Subscribing to newNotification events');
      this.socket.on('newNotification', callback);
    } else {
      console.warn('⚠️ Cannot subscribe to newNotification - socket not initialized');
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
  
  getStatus() {
    return {
      connected: this.connected,
      socketConnected: this.socket?.connected || false,
      socketId: this.socket?.id || null,
      userId: this.userId,
      currentAuthId: this.currentAuthId,
      isInitializing: this.isInitializing
    };
  }
  
  // Debug method to log connection status
  logStatus() {
    const status = this.getStatus();
    console.log('📊 WebSocket Status:', status);
    return status;
  }
}

// Create a singleton instance
const webSocketService = new WebSocketService();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  window.webSocketService = webSocketService;
}

export default webSocketService;
