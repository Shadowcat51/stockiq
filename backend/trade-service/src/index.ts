import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { pool } from './db';
import portfolioRoutes from './routes/portfolio';
import orderRoutes from './routes/orders';
import { startPendingOrdersJob } from './jobs/pending-orders.job';
import { startMonthlyTopupJob } from './jobs/monthly-topup.job';
import { startDailyLeverageFeeJob } from './jobs/daily-leverage-fee.job';

dotenv.config();

const app = express();
const port = process.env.PORT || 4002;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/simulation/portfolio', portfolioRoutes);
app.use('/api/simulation/orders', orderRoutes);

// Health Check
app.get('/health', async (req, res) => {
  try {
    const dbResult = await pool.query('SELECT NOW()');
    
    res.status(200).json({
      status: 'OK',
      service: 'Trade Simulation Service',
      timestamp: new Date().toISOString(),
      database: 'Connected',
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'ERROR',
      message: error.message,
    });
  }
});

// Start server
app.listen(port, async () => {
  console.log(`Trade Simulation Service is running on port ${port}`);
  
  // Start background jobs
  startPendingOrdersJob();
  startMonthlyTopupJob();
  startDailyLeverageFeeJob();
});
