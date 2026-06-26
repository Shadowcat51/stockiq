import cron from 'node-cron';
import { pool } from '../db';

const DAILY_LEVERAGE_FEE_RATE = 0.0025; // 0.25% daily fee on borrowed amount

let cronJob: cron.ScheduledTask | null = null;

/**
 * Start the daily leverage fee cron job.
 * Runs daily at midnight to charge fees on margin loans.
 */
export function startDailyLeverageFeeJob(): void {
  if (cronJob) {
    console.log('[DailyLeverageFeeJob] Already running');
    return;
  }

  // Run every day at 00:00
  cronJob = cron.schedule('0 0 * * *', async () => {
    console.log('[DailyLeverageFeeJob] Running daily leverage fee charge...');
    
    try {
      const result = await pool.query(`
        UPDATE portfolio_holdings 
        SET accumulated_leverage_fee = accumulated_leverage_fee + (borrowed_amount * $1),
            updated_at = NOW()
        WHERE borrowed_amount > 0
      `, [DAILY_LEVERAGE_FEE_RATE]);

      if (result.rowCount && result.rowCount > 0) {
        console.log(`[DailyLeverageFeeJob] Applied leverage fee to ${result.rowCount} holdings`);
      } else {
        console.log(`[DailyLeverageFeeJob] No active margin loans found.`);
      }
    } catch (error) {
      console.error('[DailyLeverageFeeJob] Error:', error);
    }
  });

  cronJob.start();
  console.log('[DailyLeverageFeeJob] Started (runs daily at 00:00)');
}

/**
 * Stop the daily leverage fee cron job.
 */
export function stopDailyLeverageFeeJob(): void {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log('[DailyLeverageFeeJob] Stopped');
  }
}
