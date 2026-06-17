import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { createClient } from 'redis';
import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth';

dotenv.config();

const app = express();
const port = process.env.PORT || 4001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true, // Allow cookies
}));
app.use(express.json());
app.use(cookieParser());

// Initialize PostgreSQL connection pool
const pool = new Pool({
  user: process.env.PGUSER || 'stockiq_user',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'stockiq_db',
  password: process.env.PGPASSWORD || 'stockiq_password',
  port: parseInt(process.env.PGPORT || '5432', 10),
});

// Initialize Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

// Initialize Kafka client
const kafka = new Kafka({
  clientId: 'auth-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});
const producer = kafka.producer();

// Routes
app.use('/api/auth', authRoutes);

// Basic Health Check Endpoint
app.get('/health', async (req, res) => {
  try {
    // Check DB connection
    const dbResult = await pool.query('SELECT NOW()');
    
    // Check Redis connection
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    await redisClient.ping();

    res.status(200).json({
      status: 'OK',
      service: 'Auth Service',
      timestamp: new Date().toISOString(),
      database: 'Connected',
      redis: 'Connected'
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
});

// Start the server
app.listen(port, async () => {
  console.log(`Auth Service is running on port ${port}`);
  
  try {
    // Connect to Kafka on startup
    await producer.connect();
    console.log('Connected to Kafka successfully');
  } catch (error) {
    console.error('Failed to connect to Kafka:', error);
  }
});
