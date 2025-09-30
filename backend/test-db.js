import 'dotenv/config';
import dbConnection from './utils/database.js';

console.log('Testing MongoDB connection...');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'DEFINED' : 'UNDEFINED');

try {
  await dbConnection.connect();
  console.log('✅ Database connection test successful!');
  
  const status = dbConnection.getConnectionStatus();
  console.log('Connection status:', status);
  
  // Test graceful shutdown
  await dbConnection.gracefulShutdown();
} catch (error) {
  console.error('❌ Database connection test failed:', error);
  process.exit(1);
}