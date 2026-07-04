import mongoose from 'mongoose';

export function getHealthStatus(req, res) {
  // Check Mongoose connection state (1 = Connected)
  const isDbConnected = mongoose.connection.readyState === 1;

  const healthData = {
    status: isDbConnected ? "UP" : "DOWN",
    timestamp: new Date().toISOString(),
    services: {
      database: isDbConnected ? "CONNECTED" : "DISCONNECTED"
    }
  };

  // Return 200 OK if healthy, otherwise 503 Service Unavailable
  const statusCode = isDbConnected ? 200 : 503;
  return res.status(statusCode).json(healthData);
}