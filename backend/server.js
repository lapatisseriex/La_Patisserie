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
app.use(express.json({ limit: REQ_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: REQ_LIMIT }));

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

  // Apply rate limiting and connection pool protection
  app.use(connectionPoolMiddleware);
  app.use('/api', generalRateLimit);

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

    // WebSocket setup
    const io = new Server(server, {
      cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    // Store connected users
    const connectedUsers = new Map();

    io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      // Handle user authentication
      socket.on('authenticate', (userId) => {
        if (userId) {
          connectedUsers.set(userId, socket.id);
          socket.userId = userId;
          console.log(`User ${userId} authenticated with socket ${socket.id}`);
        }
      });

      socket.on('disconnect', () => {
        if (socket.userId) {
          connectedUsers.delete(socket.userId);
          console.log(`User ${socket.userId} disconnected`);
        }
      });
    });

    // Make io available globally for use in other files
    global.io = io;
    global.connectedUsers = connectedUsers;

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
