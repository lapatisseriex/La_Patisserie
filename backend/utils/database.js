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
      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4
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