import { evaluatePendingOrders } from '../services/order-engine';

const EVALUATION_INTERVAL_MS = 30000; // 30 seconds

let intervalId: NodeJS.Timeout | null = null;

/**
 * Start the pending orders evaluation job.
 * Runs every 30 seconds to check if any pending orders should be executed.
 */
export function startPendingOrdersJob(): void {
  if (intervalId) {
    console.log('[PendingOrdersJob] Already running');
    return;
  }

  console.log(`[PendingOrdersJob] Started (interval: ${EVALUATION_INTERVAL_MS / 1000}s)`);

  intervalId = setInterval(async () => {
    try {
      const executedCount = await evaluatePendingOrders();
      if (executedCount > 0) {
        console.log(`[PendingOrdersJob] Executed ${executedCount} pending order(s)`);
      }
    } catch (error) {
      console.error('[PendingOrdersJob] Error:', error);
    }
  }, EVALUATION_INTERVAL_MS);
}

/**
 * Stop the pending orders evaluation job.
 */
export function stopPendingOrdersJob(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[PendingOrdersJob] Stopped');
  }
}
