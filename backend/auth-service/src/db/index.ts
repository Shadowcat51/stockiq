import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  user: process.env.PGUSER || 'stockiq_user',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'stockiq_db',
  password: process.env.PGPASSWORD || 'stockiq_password',
  port: parseInt(process.env.PGPORT || '5433', 10),
});

console.log(`DB Connecting to ${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || '5433'} as ${process.env.PGUSER || 'stockiq_user'}`);

export const query = (text: string, params?: any[]) => pool.query(text, params);
