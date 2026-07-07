import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

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

// Middlewares
app.use(cors());
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
    app.listen(PORT, () => {
      console.log(`Express Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failure:', err);
    process.exit(1);
  });
