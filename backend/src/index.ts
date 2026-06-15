import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import { seedMongoDatabase } from './services/dbService';
import apiRoutes from './routes/api';
import { initSocket } from './services/socketService';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors({
  origin: (origin, callback) => {
    // Permit local development, Vercel deployments, and physical hardware boards without origin headers
    if (!origin) return callback(null, true);
    if (
      origin.startsWith('http://localhost') || 
      origin.startsWith('http://127.0.0.1') || 
      origin === 'https://new-web-s-cart.vercel.app' ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true
}));

// Express middleware for body parsing
app.use(express.json());

// Main App API routes endpoint mount
app.use('/api', apiRoutes);

// Simple health-check router endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date(),
    service: 'Smart Shopping Cart IoT Platform API',
  });
});

// Configure Port
const PORT = process.env.PORT || 5000;

// Initialize Database connection and start server
const startServer = async () => {
  // Attempt DB connection
  const dbConnected = await connectDB();
  
  if (dbConnected) {
    // Seed initial mock items if using Firebase Firestore
    await seedMongoDatabase();
  }

  // Bind Socket.IO
  initSocket(server);
  console.log('🔌 Socket.IO event system initialized.');

  // Bind Server to Port
  server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Server running on: http://localhost:${PORT}`);
    console.log(`🏥 Health check at:  http://localhost:${PORT}/health`);
    console.log(`💾 Mode:             ${dbConnected ? 'Firebase Firestore Live' : 'In-Memory Mock Fallback'}`);
    console.log(`======================================================\n`);
  });
};

startServer().catch((err) => {
  console.error('💥 Fatal error starting server:', err);
  process.exit(1);
});
