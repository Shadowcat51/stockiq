import { Router } from 'express';
import { pool } from '../db';
import { authenticate, AuthRequest } from '../middlewares/auth.middleware';
import { MONTHLY_USD_TOPUP, MONTHLY_IDR_TOPUP } from '../services/order-engine';

const router = Router();

const TOPUP_INTERVAL_DAYS = 30; // 30 days from registration or last topup

/**
 * POST /api/simulation/topup/check
 * Check if user is eligible for monthly top-up and claim it.
 */
router.post('/check', authenticate, async (req, res) => {
  try {
    const userId = (req as AuthRequest).user!.userId;

    // Check if user has portfolios
    const portfolioResult = await pool.query(
      'SELECT * FROM simulated_portfolios WHERE user_id = $1',
      [userId]
    );

    if (portfolioResult.rows.length === 0) {
      return res.status(400).json({ message: 'Portfolio not found. Please initialize first.' });
    }

    // Get the last top-up date
    const lastTopupResult = await pool.query(
      'SELECT topup_date FROM monthly_topups WHERE user_id = $1 ORDER BY topup_date DESC LIMIT 1',
      [userId]
    );

    if (lastTopupResult.rows.length === 0) {
      return res.status(400).json({ message: 'No initial topup found. Please reinitialize portfolio.' });
    }

    const lastTopupDate = new Date(lastTopupResult.rows[0].topup_date);
    const now = new Date();
    const daysSinceLastTopup = Math.floor((now.getTime() - lastTopupDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, TOPUP_INTERVAL_DAYS - daysSinceLastTopup);

    const nextTopupDate = new Date(lastTopupDate);
    nextTopupDate.setDate(nextTopupDate.getDate() + TOPUP_INTERVAL_DAYS);

    if (daysSinceLastTopup < TOPUP_INTERVAL_DAYS) {
      // Not eligible yet
      return res.status(200).json({
        eligible: false,
        lastTopupDate: lastTopupDate.toISOString(),
        nextTopupDate: nextTopupDate.toISOString(),
        daysRemaining,
        message: `Next top-up available in ${daysRemaining} day(s)`,
      });
    }

    // Eligible! Process top-up
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Add to USD portfolio
      await client.query(
        `UPDATE simulated_portfolios SET cash_balance = cash_balance + $1, updated_at = NOW() 
         WHERE user_id = $2 AND currency = 'USD'`,
        [MONTHLY_USD_TOPUP, userId]
      );

      // Add to IDR portfolio
      await client.query(
        `UPDATE simulated_portfolios SET cash_balance = cash_balance + $1, updated_at = NOW() 
         WHERE user_id = $2 AND currency = 'IDR'`,
        [MONTHLY_IDR_TOPUP, userId]
      );

      // Record top-up
      const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
      await client.query(
        `INSERT INTO monthly_topups (user_id, topup_date, usd_amount, idr_amount, is_initial)
         VALUES ($1, $2, $3, $4, false)
         ON CONFLICT (user_id, topup_date) DO NOTHING`,
        [userId, today, MONTHLY_USD_TOPUP, MONTHLY_IDR_TOPUP]
      );

      await client.query('COMMIT');

      // Calculate next topup date
      const newNextTopupDate = new Date(now);
      newNextTopupDate.setDate(newNextTopupDate.getDate() + TOPUP_INTERVAL_DAYS);

      return res.status(200).json({
        eligible: false, // Already claimed
        claimed: true,
        usdAmount: MONTHLY_USD_TOPUP,
        idrAmount: MONTHLY_IDR_TOPUP,
        lastTopupDate: now.toISOString(),
        nextTopupDate: newNextTopupDate.toISOString(),
        daysRemaining: TOPUP_INTERVAL_DAYS,
        message: `Monthly top-up claimed! +$${MONTHLY_USD_TOPUP.toLocaleString()} USD and +Rp ${MONTHLY_IDR_TOPUP.toLocaleString()} IDR`,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('[Topup] Check error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/simulation/topup/history
 * Get topup history for the user.
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    const userId = (req as AuthRequest).user!.userId;

    const result = await pool.query(
      `SELECT * FROM monthly_topups WHERE user_id = $1 ORDER BY topup_date DESC`,
      [userId]
    );

    return res.status(200).json({
      topups: result.rows.map(row => ({
        ...row,
        usd_amount: parseFloat(row.usd_amount),
        idr_amount: parseFloat(row.idr_amount),
      })),
      total: result.rows.length,
    });
  } catch (error: any) {
    console.error('[Topup] History error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
