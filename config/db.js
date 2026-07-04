import "dotenv/config"
import mongoose from 'mongoose';
/**
 * Single Responsibility: Manages the initial handshake and 
 * connection monitoring lifecycle with the MongoDB Cluster.
 */
export async function connectDatabase() {
  const mongoUri = process.env.MONGO_URI;

  try {
    // Event listeners to monitor connection state transitions
    mongoose.connection.on('connected', () => console.log('MongoDB connection established successfully.'));
    mongoose.connection.on('error', (err) => console.error(`MongoDB connection runtime error: ${err}`));
    mongoose.connection.on('disconnected', () => console.log('MongoDB connection disconnected.'));

    await mongoose.connect(mongoUri);
  } catch (error) {
    console.error('Critical failure during initial database connection step:', error);
    process.exit(1);
  }
}