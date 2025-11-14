import { io } from 'socket.io-client';
import { getWebSocketBaseUrl, getSocketOptions } from '../utils/websocketUrl.js';

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

  // Always derive WebSocket base from Render API (VITE_API_URL) and strip any trailing /api path.
  // This ensures we do NOT accidentally connect to the Vercel deployment which may not support persistent WS.
  const serverUrl = getWebSocketBaseUrl();
  console.log('[WebSocketService] Derived WebSocket base:', serverUrl);

    this.socket = io(serverUrl, getSocketOptions());

    // Heartbeat / latency monitor
    this.lastPong = Date.now();
    this.pingInterval = setInterval(() => {
      if (!this.socket || !this.socket.connected) return;
      const sentAt = Date.now();
      this.socket.emit('ping');
      // If we haven't received a pong in 2 intervals, force reconnect
      if (sentAt - this.lastPong > 60000) { // 60s no pong => reconnect
        console.warn('[WebSocketService] Pong timeout, forcing reconnect');
        this.socket.disconnect();
        this.socket.connect();
      }
    }, 30000); // every 30s

    this.socket.on('pong', () => {
      const now = Date.now();
      const latency = now - this.lastPong;
      this.lastPong = now;
      if (latency > 0 && latency < 120000) {
        console.log('[WebSocketService] pong latency(ms):', latency);
      }
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

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server. Reason:', reason);
      this.connected = false;
      this.currentAuthId = null;
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocketService] connection error:', error?.message || error);
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
      if (this.pingInterval) clearInterval(this.pingInterval);
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
