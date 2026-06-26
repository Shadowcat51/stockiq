import fs from 'fs';
import path from 'path';
import { pool } from './index';

async function runMigrations() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('[Trade-Service] Running migrations...');
    await pool.query(schemaSql);
    console.log('[Trade-Service] Migrations completed successfully.');
  } catch (error) {
    console.error('[Trade-Service] Error running migrations:', error);
  } finally {
    await pool.end();
  }
}

runMigrations();
