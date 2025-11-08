import rateLimit from 'express-rate-limit';

// Get environment-specific settings
const isDevelopment = process.env.NODE_ENV === 'development';

// Create different rate limiters for different endpoints
// Note: Removed custom keyGenerator to use default IP-based key generation
// which properly handles IPv6 addresses
export const generalRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: isDevelopment ? 500 : 100, // More lenient in development
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// More restrictive for auth endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 100 : 10, // More lenient in development
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
});

// Cart operations rate limit
export const cartRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: isDevelopment ? 300 : 100, // Increased limits for smooth cart interactions
  message: {
    success: false,
    message: 'Too many cart operations, please slow down.',
    retryAfter: '1 minute'
  },
  // Skip rate limiting for successful requests to allow rapid quantity changes
  skipSuccessfulRequests: false,
  // Use a sliding window for smoother experience
  standardHeaders: true,
  legacyHeaders: false,
});

// More generous for product browsing
export const productRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: isDevelopment ? 500 : 200, // Even more lenient in development
  message: {
    success: false,
    message: 'Too many product requests, please try again later.',
    retryAfter: '1 minute'
  },
});

// Connection pool protection - limit concurrent requests
class ConnectionPoolGuard {
  constructor(maxConcurrent = 20) {
    this.maxConcurrent = maxConcurrent;
    this.currentRequests = 0;
    this.queue = [];
  }

  async acquire() {
    return new Promise((resolve, reject) => {
      if (this.currentRequests < this.maxConcurrent) {
        this.currentRequests++;
        resolve();
      } else {
        // Queue the request
        this.queue.push({ resolve, reject, timestamp: Date.now() });
        
        // Timeout after 30 seconds
        setTimeout(() => {
          const index = this.queue.findIndex(item => item.resolve === resolve);
          if (index !== -1) {
            this.queue.splice(index, 1);
            reject(new Error('Request timeout - server overloaded'));
          }
        }, 30000);
      }
    });
  }

  release() {
    this.currentRequests--;
    
    // Process next request in queue
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      this.currentRequests++;
      next.resolve();
    }
  }
}

// Create global connection pool guard
const poolGuard = new ConnectionPoolGuard(15); // Allow max 15 concurrent DB operations

// Middleware to protect MongoDB connection pool
export const connectionPoolMiddleware = (req, res, next) => {
  // Skip for health checks and static assets
  if (req.path === '/health' || req.path.startsWith('/public')) {
    return next();
  }

  poolGuard.acquire()
    .then(() => {
      // Add cleanup on response finish
      res.on('finish', () => {
        poolGuard.release();
      });
      
      res.on('close', () => {
        poolGuard.release();
      });
      
      next();
    })
    .catch((error) => {
      res.status(503).json({
        success: false,
        message: 'Server overloaded. Please try again later.',
        error: error.message
      });
    });
};

export default {
  generalRateLimit,
  authRateLimit,
  cartRateLimit,
  productRateLimit,
  connectionPoolMiddleware
};