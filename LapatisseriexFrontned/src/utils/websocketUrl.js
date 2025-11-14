// Utility to derive the Socket.IO base URL consistently in all environments.
// Preference order:
// 1. VITE_WS_URL (explicit WebSocket base)
// 2. VITE_API_URL (Render API) stripped of trailing /api path
// Fallback: http://localhost:3000
// Ensures https -> wss protocol conversion for production.

export function getWebSocketBaseUrl() {
  const explicit = import.meta.env.VITE_WS_URL?.trim();
  const api = import.meta.env.VITE_API_URL?.trim();
  let base = explicit || api || 'http://localhost:3000';

  // Strip trailing /api and anything after it
  base = base.replace(/\/?api(?:\/.*)?$/, '');

  // Normalize protocol for secure contexts
  if (base.startsWith('https://')) {
    base = 'wss://' + base.substring('https://'.length);
  } else if (base.startsWith('http://')) {
    // Keep http -> ws (Socket.IO will handle) but we could force ws:// if desired
    base = 'http://' + base.substring('http://'.length); // no-op semantic clarity
  }

  // Remove trailing slash
  base = base.replace(/\/$/, '');

  return base;
}

export function getSocketOptions(overrides = {}) {
  return {
    path: '/socket.io/',
    transports: ['websocket'], // force websocket for production reliability
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1500,
    reconnectionDelayMax: 10000,
    randomizationFactor: 0.5,
    timeout: 15000,
    ...overrides
  };
}
