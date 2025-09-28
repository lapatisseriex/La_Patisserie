import mongoose from 'mongoose';

// Database connection utility with retry logic
class DatabaseConnection {
  constructor() {
    this.isConnected = false;
    this.retryAttempts = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000; // 5 seconds
  }

  async connect() {
    try {
      // Global mongoose settings
      mongoose.set('strictQuery', true);
      mongoose.set('bufferCommands', false);

      const options = {
        maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 50),
        minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE || 5),
        maxIdleTimeMS: Number(process.env.MONGO_MAX_IDLE_MS || 30000),
        waitQueueTimeoutMS: Number(process.env.MONGO_WAIT_QUEUE_MS || 10000),
        serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_MS || 5000),
        socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS || 45000),
        heartbeatFrequencyMS: Number(process.env.MONGO_HEARTBEAT_MS || 10000),
        family: 4,
        retryWrites: true
      };

      await mongoose.connect(process.env.MONGODB_URI, options);
      
      this.isConnected = true;
      this.retryAttempts = 0;
      console.log('✅ MongoDB connected successfully');
      
      // Set up connection event listeners
      this.setupEventListeners();
      
      return true;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      
      if (this.retryAttempts < this.maxRetries) {
        this.retryAttempts++;
        console.log(`🔄 Retrying connection in ${this.retryDelay / 1000}s... (Attempt ${this.retryAttempts}/${this.maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
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
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
      this.isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('📴 MongoDB disconnected');
      this.isConnected = false;
    });

    // Handle app termination
    process.on('SIGINT', this.gracefulShutdown.bind(this));
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
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
      name: mongoose.connection.name
    };
  }
}

export default new DatabaseConnection();