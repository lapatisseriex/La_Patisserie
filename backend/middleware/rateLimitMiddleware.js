import rateLimit from 'express-rate-limit';

// Create different rate limiters for different endpoints
export const generalRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per windowMs
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
  max: 10, // Limit each IP to 10 auth requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
});

// Cart operations rate limit
export const cartRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // Limit each IP to 50 cart operations per minute
  message: {
    success: false,
    message: 'Too many cart operations, please slow down.',
    retryAfter: '1 minute'
  },
});

// More generous for product browsing
export const productRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // Allow more product browsing
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