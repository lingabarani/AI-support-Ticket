const mongoose = require('mongoose');

mongoose.set('bufferCommands', false);

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not configured');
  }

  await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DATABASE || undefined,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 10000,
  });

  return mongoose.connection;
};

const getDBStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return {
    state: states[mongoose.connection.readyState] || 'unknown',
    database: mongoose.connection.name || process.env.MONGODB_DATABASE || null,
    host: mongoose.connection.host || null,
  };
};

module.exports = { connectDB, getDBStatus };
