import cron from 'node-cron';
import { pool } from '../db';
import { MONTHLY_USD_TOPUP, MONTHLY_IDR_TOPUP } from '../services/order-engine';

const TOPUP_INTERVAL_DAYS = 30;

let cronJob: cron.ScheduledTask | null = null;

/**
 * Start the monthly top-up cron job.
 * Runs daily at midnight to process eligible top-ups.
 */
export function startMonthlyTopupJob(): void {
  if (cronJob) {
    console.log('[MonthlyTopupJob] Already running');
    return;
  }

  // Run every day at 00:00
  cronJob = cron.schedule('0 0 * * *', async () => {
    console.log('[MonthlyTopupJob] Running daily topup check...');
    
    try {
      // Find users eligible for topup:
      // - Last topup was >= 30 days ago
      // - Have active portfolios
      const eligibleUsers = await pool.query(`
        SELECT DISTINCT sp.user_id
        FROM simulated_portfolios sp
        WHERE sp.user_id NOT IN (
          SELECT user_id FROM monthly_topups 
          WHERE topup_date > CURRENT_DATE - INTERVAL '${TOPUP_INTERVAL_DAYS} days'
        )
      `);

      let processedCount = 0;

      for (const row of eligibleUsers.rows) {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');

          // Add to USD portfolio
          await client.query(
            `UPDATE simulated_portfolios SET cash_balance = cash_balance + $1, updated_at = NOW() 
             WHERE user_id = $2 AND currency = 'USD'`,
            [MONTHLY_USD_TOPUP, row.user_id]
          );

          // Add to IDR portfolio
          await client.query(
            `UPDATE simulated_portfolios SET cash_balance = cash_balance + $1, updated_at = NOW() 
             WHERE user_id = $2 AND currency = 'IDR'`,
            [MONTHLY_IDR_TOPUP, row.user_id]
          );

          // Record topup
          const today = new Date().toISOString().split('T')[0];
          await client.query(
            `INSERT INTO monthly_topups (user_id, topup_date, usd_amount, idr_amount, is_initial)
             VALUES ($1, $2, $3, $4, false)
             ON CONFLICT (user_id, topup_date) DO NOTHING`,
            [row.user_id, today, MONTHLY_USD_TOPUP, MONTHLY_IDR_TOPUP]
          );

          await client.query('COMMIT');
          processedCount++;
        } catch (error) {
          await client.query('ROLLBACK');
          console.error(`[MonthlyTopupJob] Error processing user ${row.user_id}:`, error);
        } finally {
          client.release();
        }
      }

      if (processedCount > 0) {
        console.log(`[MonthlyTopupJob] Processed ${processedCount} user top-up(s)`);
      }
    } catch (error) {
      console.error('[MonthlyTopupJob] Error:', error);
    }
  });

  cronJob.start();
  console.log('[MonthlyTopupJob] Started (runs daily at 00:00)');
}

/**
 * Stop the monthly top-up cron job.
 */
export function stopMonthlyTopupJob(): void {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log('[MonthlyTopupJob] Stopped');
  }
}
