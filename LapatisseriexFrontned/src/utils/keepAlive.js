// Keep-Alive Service to Prevent Render Cold Starts
// This script pings your backend every 10 minutes to keep it warm

const BACKEND_URL = process.env.VITE_API_URL || 'https://your-backend.onrender.com';
const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes

let isActive = true;
let pingCount = 0;

const pingServer = async () => {
  if (!isActive) return;
  
  try {
    const startTime = Date.now();
    const response = await fetch(`${BACKEND_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(15000), // 15 second timeout
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      pingCount++;
      console.log(`✅ Keep-Alive Ping #${pingCount} successful (${responseTime}ms)`);
      
      // Log to analytics if needed
      if (window.gtag) {
        window.gtag('event', 'keep_alive_ping', {
          event_category: 'system',
          event_label: 'success',
          value: responseTime
        });
      }
    } else {
      console.warn(`⚠️ Keep-Alive Ping failed: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Keep-Alive Ping error:', error.message);
  }
};

// Start pinging when user is active
export const startKeepAlive = () => {
  isActive = true;
  
  // Initial ping
  pingServer();
  
  // Set up interval
  const intervalId = setInterval(pingServer, PING_INTERVAL);
  
  // Stop pinging when tab is hidden to save resources
  const handleVisibilityChange = () => {
    if (document.hidden) {
      isActive = false;
      console.log('🔕 Keep-Alive paused (tab hidden)');
    } else {
      isActive = true;
      console.log('🔔 Keep-Alive resumed (tab visible)');
      pingServer(); // Immediate ping on tab visible
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Cleanup function
  return () => {
    clearInterval(intervalId);
    isActive = false;
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
};

// Auto-start if in production
if (import.meta.env.PROD) {
  startKeepAlive();
  console.log('🚀 Keep-Alive service started');
}
