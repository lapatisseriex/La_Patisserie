import mongoose from 'mongoose';

// Database connection utility with retry logic
class DatabaseConnection {
  constructor() {
    this.isConnected = false;
    this.retryAttempts = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000; // 5 seconds
    this.circuitBreaker = {
      failures: 0,
      threshold: 5,
      timeout: 60000, // 1 minute
      state: 'CLOSED' // CLOSED, OPEN, HALF_OPEN
    };
    this.lastHealthCheck = null;
    this.healthCheckInterval = null;
  }

  async connect() {
    try {
      // Global mongoose settings for better stability
      mongoose.set('strictQuery', true);
      mongoose.set('bufferCommands', true);        // Enable buffering for better resilience
      mongoose.set('autoIndex', false);            // Don't build indexes on every connection
      mongoose.set('autoCreate', false);           // Don't auto-create collections

      const options = {
        maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 10),        // Increased pool for high traffic
        minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE || 2),         // Minimum connections
        maxIdleTimeMS: Number(process.env.MONGO_MAX_IDLE_MS || 300000),    // 5 minutes idle time
        waitQueueTimeoutMS: Number(process.env.MONGO_WAIT_QUEUE_MS || 30000), // 30s wait time
        serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_MS || 10000), // 10s selection timeout
        socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS || 60000), // 60s socket timeout
        heartbeatFrequencyMS: Number(process.env.MONGO_HEARTBEAT_MS || 10000), // 10s heartbeat
        connectTimeoutMS: Number(process.env.MONGO_CONNECT_TIMEOUT_MS || 10000), // 10s connection timeout
        maxConnecting: Number(process.env.MONGO_MAX_CONNECTING || 3),       // Allow 3 concurrent connections
        family: 4,
        retryWrites: true,
        w: 'majority',
        // Additional resilience options
        compressors: ['zlib'],
        zlibCompressionLevel: 6
      };

      await mongoose.connect(process.env.MONGODB_URI, options);
      
      this.isConnected = true;
      this.retryAttempts = 0;
      console.log('✅ MongoDB connected successfully');
      
      // Set up connection event listeners
      this.setupEventListeners();
      
      return true;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', {
        message: error.message,
        code: error.code,
        name: error.name,
        attempt: this.retryAttempts + 1,
        maxRetries: this.maxRetries
      });

      // Don't retry on certain unrecoverable errors
      if (error.name === 'MongoParseError' || 
          error.message.includes('Authentication failed') ||
          error.message.includes('bad auth') ||
          error.message.includes('ENOTFOUND')) {
        console.error('💥 Unrecoverable MongoDB error. Not retrying.');
        throw error;
      }
      
      if (this.retryAttempts < this.maxRetries) {
        this.retryAttempts++;
        
        // Exponential backoff with jitter
        const baseDelay = 2000;
        const exponentialDelay = baseDelay * Math.pow(2, this.retryAttempts - 1);
        const maxDelay = 30000;
        const delay = Math.min(exponentialDelay, maxDelay);
        const jitter = Math.random() * 1000; // Add up to 1 second of jitter
        const totalDelay = delay + jitter;
        
        console.log(`🔄 Retrying connection in ${Math.round(totalDelay / 1000)}s... (Attempt ${this.retryAttempts}/${this.maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, totalDelay));
        return this.connect();
      } else {
        console.error('💥 Max retry attempts reached. Exiting...');
        throw error;
      }
    }
  }

  setupEventListeners() {
    mongoose.connection.on('connected', () => {
      console.log('📡 MongoDB connected');
      this.isConnected = true;
      this.retryAttempts = 0; // Reset retry counter on successful connection
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', {
        message: err.message,
        code: err.code,
        name: err.name
      });
      this.isConnected = false;
      
      // Handle specific errors
      if (err.message.includes('ECONNRESET') || err.message.includes('connection closed')) {
        console.log('🔄 Connection was reset, will attempt to reconnect on next operation');
      }
    });

    mongoose.connection.on('disconnected', () => {
      console.log('📴 MongoDB disconnected');
      this.isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
      this.isConnected = true;
      this.retryAttempts = 0;
      this.circuitBreaker.failures = 0;
      this.circuitBreaker.state = 'CLOSED';
    });

    mongoose.connection.on('close', () => {
      console.log('🔒 MongoDB connection closed');
      this.isConnected = false;
    });

    // Monitor connection pool events
    mongoose.connection.on('connectionPoolCreated', () => {
      console.log('🏊 MongoDB connection pool created');
    });

    mongoose.connection.on('connectionPoolClosed', () => {
      console.log('🏊 MongoDB connection pool closed');
    });

    mongoose.connection.on('connectionCheckedOut', () => {
      console.log('🔗 Connection checked out from pool');
    });

    mongoose.connection.on('connectionCheckedIn', () => {
      console.log('↩️ Connection checked back into pool');
    });

    // Handle app termination
    process.on('SIGINT', this.gracefulShutdown.bind(this));
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
    process.on('SIGQUIT', this.gracefulShutdown.bind(this));
  }

  async gracefulShutdown() {
    console.log('🔄 Closing MongoDB connection...');
    try {
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed.');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during MongoDB disconnection:', error);
      process.exit(1);
    }
  }

  getConnectionStatus() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    return {
      state: states[mongoose.connection.readyState] || 'unknown',
      isConnected: mongoose.connection.readyState === 1,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      circuitBreaker: this.circuitBreaker
    };
  }

  // Circuit breaker methods
  recordFailure() {
    this.circuitBreaker.failures++;
    if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
      this.circuitBreaker.state = 'OPEN';
      console.warn(`🚨 Circuit breaker OPEN - too many failures (${this.circuitBreaker.failures})`);
      
      // Auto-recovery after timeout
      setTimeout(() => {
        this.circuitBreaker.state = 'HALF_OPEN';
        console.log('🔄 Circuit breaker HALF_OPEN - attempting recovery');
      }, this.circuitBreaker.timeout);
    }
  }

  isCircuitOpen() {
    return this.circuitBreaker.state === 'OPEN';
  }

  // Health check methods
  startHealthCheck() {
    this.stopHealthCheck(); // Clear any existing interval
    this.healthCheckInterval = setInterval(async () => {
      try {
        if (mongoose.connection.readyState === 1) {
          // Simple ping to check connection health
          await mongoose.connection.db.admin().ping();
          this.lastHealthCheck = new Date();
        }
      } catch (error) {
        console.error('Health check failed:', error.message);
        this.recordFailure();
      }
    }, 30000); // Check every 30 seconds
  }

  stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

export default new DatabaseConnection();