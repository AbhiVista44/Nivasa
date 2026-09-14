import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import authRoutes from './routes/authRoutes.js';
import societyRoutes from './routes/societyRoutes.js';
import flatRoutes from './routes/flatRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import visitorRoutes from './routes/visitorRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import facilityRoutes from './routes/facilityRoutes.js';
import noticeRoutes from './routes/noticeRoutes.js';
import vendorRoutes from './routes/vendorRoutes.js';
import auditRoutes from './routes/auditRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// Serve local fallback uploads statically
app.use('/uploads', express.static(path.resolve(__dirname, '../public/uploads')));

// Request logger for debugging & traceability
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/societies', societyRoutes);
app.use('/api/flats', flatRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/audit', auditRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'Nivasa Residential Platform API',
    timestamp: new Date().toISOString(),
    mongoConnected: mongoose.connection.readyState === 1,
    database: mongoose.connection.name || 'in-memory',
  });
});

// Database Connection with graceful fallback
const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nivasa';
  const maskedURI = mongoURI.replace(/:([^:@]+)@/, ':****@');
  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      dbName: process.env.DB_NAME || 'nivasa',
    });
    console.log(`✅ MongoDB Atlas connected successfully to database: "${mongoose.connection.name}" (${maskedURI})`);
  } catch (error) {
    console.warn('⚠️  MongoDB connection skipped/failed:', error.message);
    console.warn('⚠️  Running with in-memory resilient dataStore mode.');
  }
};

connectDB();

app.listen(PORT, () => {
  console.log(`🚀 Nivasa Backend API running on http://localhost:${PORT}`);
  console.log(`✨ Available Roles: Society Admin | Resident | Security | Vendor`);
});
