import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import compression from 'compression';
import helmet from 'helmet';

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import productRoutes from './routes/productRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import hostelRoutes from './routes/hostelRoutes.js';
import imageReprocessRoutes from './routes/imageReprocessRoutes.js';
import bannerRoutes from './routes/bannerRoutes.js';
import timeSettingsRoutes from './routes/timeSettingsRoutes.js';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
const allowedOrigins = [
  'https://la-patisseriex.netlify.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://la-patisserie-cqyo.vercel.app',
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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Debug middleware for CORS
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - Origin: ${req.get('origin') || 'No origin'}`);
    next();
  });
}

// Use compression to reduce response size
app.use(compression());

// Use Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: false // Disable for development, enable in production
}));

// Only use detailed logging in development
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import cache and set up cleanup interval
import { cache } from './utils/cache.js';
// Clean expired cache entries every 15 minutes
setInterval(() => {
  const cleaned = cache.cleanExpired();
  if (cleaned > 0) {
    console.log(`Cache cleanup: removed ${cleaned} expired items`);
  }
}, 15 * 60 * 1000);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/hostels', hostelRoutes);
app.use('/api/image-reprocess', imageReprocessRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/time-settings', timeSettingsRoutes);

// Health check endpoint


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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
