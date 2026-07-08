import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { runEncryptedBackup } from './utils/backup';

// Load environment variables
dotenv.config();

// Import Routes
import authRouter from './routes/auth';
import visitorRouter from './routes/visitors';
import adminRouter from './routes/admin';
import dashboardRouter from './routes/dashboard';
import emergencyRouter from './routes/emergency';
import notificationsRouter from './routes/notifications';

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/apartment-visitor-log';

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL
].filter(Boolean) as string[];

const connectOrigins = [
  "'self'",
  "http://localhost:5000",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
  process.env.BACKEND_URL
].filter(Boolean) as string[];

// Enterprise Security Headers (CSP, FrameGuard, HSTS, etc.)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://res.cloudinary.com"],
      connectSrc: connectOrigins
    }
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS Configuration with strict origins and credentials allowed
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Rate Limiting (limit each IP to 150 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Prevent NoSQL query injection
app.use(mongoSanitize());

app.use(morgan('dev'));
app.use(express.json());

// Routes Mounting
app.use('/api/auth', authRouter);
app.use('/api/visitors', visitorRouter);
app.use('/api/admin', adminRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/emergency', emergencyRouter);
app.use('/api/notifications', notificationsRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'UP', database: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED' });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: err.message || 'An internal server error occurred.' });
});

// Database Connection & Server Startup
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB localhost.');
    
    // Automatic Encrypted Database Backup Schedule (Once every 24 hours)
    setInterval(() => {
      console.log('[Scheduler] Running daily automatic encrypted database backup...');
      runEncryptedBackup()
        .then(file => console.log(`[Scheduler] Daily backup completed: ${file}`))
        .catch(err => console.error('[Scheduler] Daily backup failed:', err));
    }, 24 * 60 * 60 * 1000);

    app.listen(PORT, () => {
      console.log(`Express Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failure:', err);
    process.exit(1);
  });
