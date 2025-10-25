import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import compression from 'compression';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dbConnection from './utils/database.js';
import { 
  generalRateLimit, 
  authRateLimit, 
  cartRateLimit, 
  productRateLimit,
  connectionPoolMiddleware 
} from './middleware/rateLimitMiddleware.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import productRoutes from './routes/productRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import hostelRoutes from './routes/hostelRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import imageReprocessRoutes from './routes/imageReprocessRoutes.js';
import timeSettingsRoutes from './routes/timeSettingsRoutes.js';
import newCartRoutes from './routes/newCartRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import twilioRoutes from './routes/twilioRoutesNew.js';
import stockRoutes from './routes/stockRoutes.js';
import stockValidationRoutes from './routes/stockValidationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import newsletterRoutes from './routes/newsletterRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import ngoMediaRoutes from './routes/ngoMediaRoutes.js';
import sitemapRoutes from './routes/sitemapRoutes.js';
import { calculateShopStatus } from './utils/shopStatus.js';

// Initialize Express app
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
const allowedOrigins = [
  'https://la-patisseriex.netlify.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://la-patisserie-cqyo.vercel.app',
  'https://la-patisserie-nine.vercel.app',
  'https://thelapatisserie.vercel.app',
  // Fixed custom domain entries (removed trailing slash and added apex domain)
  'https://www.lapatisserie.shop',
  'https://lapatisserie.shop',
  'https://lapatisserie.shop',
  process.env.FRONTEND_URL
].filter(Boolean); // Remove any undefined values

// Regex patterns for dynamic domains
const allowedOriginPatterns = [
  /^https:\/\/.*\.netlify\.app$/,           // Any Netlify app
  /^https:\/\/.*\.vercel\.app$/,            // Any Vercel app
  /^https:\/\/la-patisserie.*\.vercel\.app$/, // Specific Vercel deployments
  /^https:\/\/la-patisseriex.*\.netlify\.app$/ // Specific Netlify deployments
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check exact matches first
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    // Check regex patterns
    const isAllowedByPattern = allowedOriginPatterns.some(pattern => pattern.test(origin));
    if (isAllowedByPattern) {
      return callback(null, true);
    }
    
    // Allow in development mode
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    console.log('CORS blocked origin:', origin);
    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));
// Tighten request body limits (configurable)
const REQ_LIMIT = process.env.REQUEST_LIMIT_MB ? `${process.env.REQUEST_LIMIT_MB}mb` : '10mb';
const UPLOAD_LIMIT = process.env.UPLOAD_LIMIT_MB ? `${process.env.UPLOAD_LIMIT_MB}mb` : '100mb'; // Higher limit for media uploads
app.use(express.json({ limit: UPLOAD_LIMIT })); // Use higher limit for all JSON (includes base64 uploads)
app.use(express.urlencoded({ extended: true, limit: UPLOAD_LIMIT }));

// Track API request rates
const requestCounts = new Map();
const RATE_REPORTING_INTERVAL = 15 * 60 * 1000; // 15 minutes

// Debug middleware for CORS and track request rates
app.use((req, res, next) => {
  // Track API endpoint usage
  const endpoint = `${req.method} ${req.path.split('?')[0]}`; // Remove query params for cleaner stats
  
  // Update request count
  requestCounts.set(endpoint, (requestCounts.get(endpoint) || 0) + 1);
  
  // Debug logs in development
  if (NODE_ENV === 'development') {
    console.log(`${req.method} ${req.path} - Origin: ${req.get('origin') || 'No origin'}`);
  }
  
  next();
});

// Log API request rates periodically
setInterval(() => {
  if (requestCounts.size > 0) {
    console.log('📊 API Request Rate Report (past 15 minutes):');
    const sortedEndpoints = [...requestCounts.entries()]
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
      .slice(0, 10); // Top 10 endpoints
      
    sortedEndpoints.forEach(([endpoint, count]) => {
      console.log(`  ${endpoint}: ${count} requests`);
    });
    
    console.log(`  Total endpoints tracked: ${requestCounts.size}`);
    // Reset counts for next interval
    requestCounts.clear();
  }
}, RATE_REPORTING_INTERVAL);

// Lightweight DB readiness gate only for API routes (mounted once)
const dbReadyGate = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database connection not ready. Please try again later.',
      status: 'SERVICE_UNAVAILABLE'
    });
  }
  next();
};

// Use compression to reduce response size
app.use(compression());

// Use Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: false // Disable for development, enable in production
}));

// Only use detailed logging in development
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));

// Function to start the server
const startServer = async () => {
  try {
    // Connect to MongoDB using the database utility
    await dbConnection.connect();

    // Import cache and set up cleanup interval
    const { cache } = await import('./utils/cache.js');
    // Clean expired cache entries every 15 minutes
    setInterval(() => {
      const cleaned = cache.cleanExpired();
      if (cleaned > 0) {
        console.log(`Cache cleanup: removed ${cleaned} expired items`);
      }
    }, 15 * 60 * 1000);

    // Schedule periodic cleanup for expired cart items (configurable)
    const scheduleCartExpiryCleanup = () => {
      const HOUR_MS = 60 * 60 * 1000;
      setInterval(async () => {
        try {
          const { default: NewCart } = await import('./models/newCartModel.js');
          // Prefer seconds env if explicitly provided; else hours; default 24 hours
          const secondsRaw = process.env.CART_ITEM_EXPIRY_SECONDS;
          const secondsEnv = secondsRaw !== undefined ? parseFloat(secondsRaw) : NaN;
          let cutoff;
          if (!isNaN(secondsEnv) && secondsEnv > 0) {
            cutoff = new Date(Date.now() - secondsEnv * 1000);
          } else {
            const hoursEnv = parseFloat(process.env.CART_ITEM_EXPIRY_HOURS || '24');
            const ms = (isNaN(hoursEnv) || hoursEnv <= 0 ? 24 : hoursEnv) * 60 * 60 * 1000;
            cutoff = new Date(Date.now() - ms);
          }
          // Remove expired items from all carts
          await NewCart.updateMany({}, { $pull: { items: { addedAt: { $lt: cutoff } } } });
          // Delete any carts that are now empty
          await NewCart.deleteMany({ $or: [ { items: { $exists: true, $size: 0 } }, { items: { $exists: false } } ] });
        } catch (e) {
          // Log once; skip noisy stacks
          console.warn('Cart expiry cleanup failed:', e?.message || e);
        }
      }, HOUR_MS);
    };
    scheduleCartExpiryCleanup();

    const scheduleCancelledOrderCleanup = () => {
      const MINUTE_MS = 60 * 1000;
      const retentionHoursRaw = parseFloat(process.env.CANCELLED_ORDER_RETENTION_HOURS || '24');
      const retentionHours = Number.isFinite(retentionHoursRaw) && retentionHoursRaw > 0 ? retentionHoursRaw : 24;
      const retentionMs = retentionHours * 60 * 60 * 1000;

      const intervalMinutesRaw = parseFloat(process.env.CANCELLED_ORDER_CLEANUP_INTERVAL_MINUTES || '60');
      const intervalMinutes = Number.isFinite(intervalMinutesRaw) && intervalMinutesRaw >= 15 ? intervalMinutesRaw : 60;
      const intervalMs = intervalMinutes * MINUTE_MS;

      const batchSizeRaw = parseInt(process.env.CANCELLED_ORDER_CLEANUP_BATCH_SIZE || '25', 10);
      const batchSize = Number.isInteger(batchSizeRaw) && batchSizeRaw > 0 ? batchSizeRaw : 25;

      const runCleanup = async () => {
        try {
          const [orderModule, emailModule, logoModule] = await Promise.all([
            import('./models/orderModel.js'),
            import('./utils/orderEmailService.js'),
            import('./utils/logoUtils.js')
          ]);

          const Order = orderModule.default;
          const { sendOrderStatusNotification } = emailModule;
          const { getLogoData } = logoModule;

          const cutoff = new Date(Date.now() - retentionMs);
          const staleOrders = await Order.find({
            orderStatus: 'cancelled',
            cancelledAt: { $type: 'date', $lte: cutoff }
          })
            .sort({ cancelledAt: 1 })
            .limit(batchSize)
            .populate('userId', 'name email phone')
            .lean();

          if (!staleOrders.length) {
            return;
          }

          const logoData = getLogoData();

          for (const order of staleOrders) {
            const userDetails = {
              ...(order.userDetails || {}),
              name: order.userDetails?.name || order.userId?.name || 'Guest',
              email: order.userDetails?.email || order.userId?.email || null,
              phone: order.userDetails?.phone || order.userId?.phone || null
            };

            const recipientEmail = userDetails.email;

            if (recipientEmail && typeof sendOrderStatusNotification === 'function') {
              try {
                await sendOrderStatusNotification(
                  {
                    ...order,
                    userDetails
                  },
                  'cleanup_cancelled',
                  recipientEmail,
                  logoData
                );
              } catch (emailError) {
                console.error(`Failed to send cleanup email for order ${order.orderNumber}:`, emailError.message);
              }
            } else {
              console.warn(`Skipping cleanup email for order ${order.orderNumber}: missing recipient email.`);
            }

            try {
              await Order.deleteOne({ _id: order._id });
              console.log(`🧹 Removed cancelled order ${order.orderNumber} after retention window`);
            } catch (deleteError) {
              console.error(`Failed to delete cancelled order ${order.orderNumber}:`, deleteError.message);
            }
          }
        } catch (cleanupError) {
          console.error('Cancelled order cleanup task failed:', cleanupError.message);
        }
      };

      setInterval(runCleanup, intervalMs);
      setTimeout(runCleanup, 5 * MINUTE_MS);
      console.log(`🗓️  Cancelled order cleanup scheduled (retention: ${retentionHours}h, every ${intervalMinutes}m, batch size: ${batchSize})`);
    };
    scheduleCancelledOrderCleanup();

  // Apply rate limiting and connection pool protection
  app.use(connectionPoolMiddleware);
  app.use('/api', generalRateLimit);

  // Serve static files from public directory
  app.use('/public', express.static('public'));
  
  // SEO Routes (sitemap.xml and robots.txt) - before public routes
  app.use('/', sitemapRoutes);
  
  // Public routes (no rate limiting needed for static assets)
  app.use('/api/public', publicRoutes);

  // Routes - only set up after DB connection is established
  // Apply the DB readiness gate to API routes
  app.use('/api', dbReadyGate);
    app.use('/api/auth', authRateLimit, authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/email', emailRoutes);
    app.use('/api/locations', locationRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/categories', categoryRoutes);
    app.use('/api/products', productRateLimit, productRoutes);
    app.use('/api/upload', uploadRoutes);
    app.use('/api/hostels', hostelRoutes);
    app.use('/api/image-reprocess', imageReprocessRoutes);
  // Banners are now static on the frontend; backend routes removed
    app.use('/api/time-settings', timeSettingsRoutes);
    app.use('/api/newcart', cartRateLimit, newCartRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/twilio', twilioRoutes);
    app.use('/api/stock', stockRoutes);
    app.use('/api/stock-validation', stockValidationRoutes);
    app.use('/api/analytics', analyticsRoutes);
    app.use('/api/contact', contactRoutes);
    app.use('/api/notifications', notificationRoutes);
    app.use('/api/newsletter', newsletterRoutes);
    app.use('/api/ngo-media', ngoMediaRoutes);

    // WebSocket setup
    const io = new Server(server, {
      cors: {
        origin: function (origin, callback) {
          // Allow requests with no origin (like mobile apps or curl requests)
          if (!origin) return callback(null, true);
          
          // Check exact matches first
          if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
          }
          
          // Check regex patterns
          const isAllowedByPattern = allowedOriginPatterns.some(pattern => pattern.test(origin));
          if (isAllowedByPattern) {
            return callback(null, true);
          }
          
          // Allow in development mode
          if (process.env.NODE_ENV === 'development') {
            return callback(null, true);
          }
          
          console.log('WebSocket CORS blocked origin:', origin);
          return callback(new Error('CORS not allowed'), false);
        },
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    // Store connected users
    const connectedUsers = new Map();

    io.on('connection', (socket) => {
      console.log('✅ WebSocket client connected:', socket.id);

      // Handle user authentication
      socket.on('authenticate', (userId) => {
        const normalizedId = userId ? userId.toString() : null;

        if (socket.userId && socket.userId !== normalizedId) {
          connectedUsers.delete(socket.userId);
        }

        if (normalizedId) {
          connectedUsers.set(normalizedId, socket.id);
          socket.userId = normalizedId;
          console.log(`✅ User ${normalizedId} authenticated with socket ${socket.id}`);
        } else {
          socket.userId = null;
        }
      });

      socket.on('logout', () => {
        if (socket.userId) {
          connectedUsers.delete(socket.userId);
          console.log(`🚪 User ${socket.userId} logged out from socket ${socket.id}`);
          socket.userId = null;
        }
      });

      socket.on('disconnect', () => {
        if (socket.userId) {
          connectedUsers.delete(socket.userId);
          console.log(`❌ User ${socket.userId} disconnected`);
          socket.userId = null;
        } else {
          console.log(`❌ Client ${socket.id} disconnected`);
        }
      });
    });

    // Make io available globally for use in other files
    global.io = io;
    global.connectedUsers = connectedUsers;
    
    console.log('✅ WebSocket server initialized and ready');

    // Periodically broadcast shop status so clients update without refresh
    let lastShopStatusSnapshot = null;
    const broadcastShopStatus = async () => {
      try {
        const status = await calculateShopStatus();
        const asKey = JSON.stringify({
          isOpen: status.isOpen,
          nextOpenTime: status.nextOpenTime,
          closingTime: status.closingTime
        });
        if (asKey !== lastShopStatusSnapshot) {
          lastShopStatusSnapshot = asKey;
          io.emit('shopStatusUpdate', status);
        }
      } catch (e) {
        // ignore ephemeral failures
      }
    };
    // Run every 5 seconds for near-real-time UX without excessive load
    setInterval(broadcastShopStatus, 5000);

    // Health check endpoint
    app.get('/health', (req, res) => {
      const dbStatus = dbConnection.getConnectionStatus();
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: dbStatus,
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          pid: process.pid
        }
      });
    });

    // Root route
    app.get('/', (req, res) => {
      res.send('La Patisserie API is running...');
    });

    // 404 handler - must come after all routes
    app.use((req, res, next) => {
      res.status(404).json({
        success: false,
        message: 'API endpoint not found'
      });
    });

    // Error handler
    app.use((err, req, res, next) => {
      console.error(err.stack);
      const statusCode = err.statusCode || 500;
      
      res.status(statusCode).json({
        success: false,
        message: err.message || 'Something went wrong!',
        error: NODE_ENV === 'development' ? {
          stack: err.stack,
          details: err.details || null
        } : undefined
      });
    });

    // Start server only after database connection is established
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check available at http://localhost:${PORT}/health`);
      console.log(`WebSocket server running on port ${PORT}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
