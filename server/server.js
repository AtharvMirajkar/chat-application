import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection with better error handling
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatapp';
    
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', mongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')); // Hide credentials in logs
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('\n🔧 To fix this issue:');
    console.log('1. If using local MongoDB: Make sure MongoDB is installed and running');
    console.log('2. If using MongoDB Atlas: Set MONGODB_URI in your .env file');
    console.log('3. Example MongoDB Atlas URI: mongodb+srv://username:password@cluster.mongodb.net/chatapp');
    console.log('\n⚠️  Server will continue running but database features will not work');
  }
};

// Connect to MongoDB
connectDB();

// Routes
import authRoutes from './routes/auth.js';
app.use('/api/auth', authRoutes);

// Socket handling
import chatHandler from './sockets/chatHandler.js';
chatHandler(io);

// Health check endpoint
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ 
    status: 'Server running',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Chat App Server Running',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
  
  if (mongoose.connection.readyState !== 1) {
    console.log('\n💡 Database not connected. To enable full functionality:');
    console.log('   • Set up MongoDB Atlas: https://www.mongodb.com/atlas');
    console.log('   • Add MONGODB_URI to your .env file');
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await mongoose.connection.close();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});