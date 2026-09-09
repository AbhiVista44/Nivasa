import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes.js';
import societyRoutes from './routes/societyRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json());

// Request logger for debugging & traceability
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/societies', societyRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'Nivasa Residential Platform API',
    timestamp: new Date().toISOString(),
    mongoConnected: mongoose.connection.readyState === 1,
  });
});

// Database Connection with graceful fallback
const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nivasa';
  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log('✅ MongoDB connected successfully to:', mongoURI);
  } catch (error) {
    console.warn('⚠️  MongoDB connection skipped/failed. Running with in-memory resilient dataStore mode.');
  }
};

connectDB();

app.listen(PORT, () => {
  console.log(`🚀 Nivasa Backend API running on http://localhost:${PORT}`);
  console.log(`✨ Available Roles: Society Admin | Resident | Security | Vendor`);
});
