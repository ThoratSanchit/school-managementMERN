import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import dotenv from 'dotenv';
import User from './models/User.js';

// Ensure core models are registered before any populate calls
import './models/School.js';
import './models/Subject.js';
import './models/Class.js';
import './models/Teacher.js';

// Route files
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import teacherRoutes from './routes/teachers.js';
import classRoutes from './routes/classes.js';
import attendanceRoutes from './routes/attendance.js';
import examRoutes from './routes/exams.js';
import gradeRoutes from './routes/grades.js';
import feeRoutes from './routes/fees.js';
import libraryRoutes from './routes/library.js';
import schoolRoutes from './routes/schools.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS), // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files
app.use('/uploads', express.static('public/uploads'));

// Database connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  console.log('✅ Connected to MongoDB');
  // Seed default super admin if not present
  (async () => {
    try {
      const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
      const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
      const superAdminFirstName = process.env.SUPER_ADMIN_FIRST_NAME || 'Super';
      const superAdminLastName = process.env.SUPER_ADMIN_LAST_NAME || 'Admin';

      if (!superAdminEmail || !superAdminPassword) {
        console.warn('⚠️ SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not set. Skipping super admin seeding.');
        return;
      }

      const existing = await User.findOne({ role: 'super_admin', email: superAdminEmail });
      if (!existing) {
        await User.create({
          firstName: superAdminFirstName,
          lastName: superAdminLastName,
          email: superAdminEmail,
          password: superAdminPassword,
          role: 'super_admin',
          isActive: true
        });
        console.log(`🛠️ Seeded Super Admin account: ${superAdminEmail}`);
      } else {
        console.log('✅ Super Admin account already exists');
      }
    } catch (seedErr) {
      console.error('❌ Error seeding Super Admin:', seedErr);
    }
  })();
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'School Management System API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/library', libraryRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  console.log(`📚 School Management System API ready at http://localhost:${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`❌ Unhandled Rejection: ${err.message}`);
  process.exit(1);
});

export default app;
