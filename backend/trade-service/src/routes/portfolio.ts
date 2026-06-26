import { Router } from 'express';
import { pool } from '../db';
import { authenticate, AuthRequest } from '../middlewares/auth.middleware';
import { getCurrentPrice, getMultiplePrices } from '../services/price.service';
import { INITIAL_USD_BALANCE, INITIAL_IDR_BALANCE } from '../services/order-engine';

const router = Router();

/**
 * POST /api/simulation/portfolio/init
 * Initialize virtual portfolios for a user (USD + IDR).
 * Called when user first visits the simulation page.
 */
router.post('/init', authenticate, async (req, res) => {
  try {
    const userId = (req as AuthRequest).user!.userId;

    // Check if portfolios already exist
    const existing = await pool.query(
      'SELECT * FROM simulated_portfolios WHERE user_id = $1 ORDER BY currency',
      [userId]
    );

    if (existing.rows.length > 0) {
      return res.status(200).json({
        message: 'Portfolio already initialized',
        portfolios: existing.rows,
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create USD portfolio
      const usdResult = await client.query(
        `INSERT INTO simulated_portfolios (user_id, currency, cash_balance) 
         VALUES ($1, 'USD', $2) RETURNING *`,
        [userId, INITIAL_USD_BALANCE]
      );

      // Create IDR portfolio
      const idrResult = await client.query(
        `INSERT INTO simulated_portfolios (user_id, currency, cash_balance) 
         VALUES ($1, 'IDR', $2) RETURNING *`,
        [userId, INITIAL_IDR_BALANCE]
      );

      // Record initial top-up
      await client.query(
        `INSERT INTO monthly_topups (user_id, topup_date, usd_amount, idr_amount, is_initial)
         VALUES ($1, CURRENT_DATE, $2, $3, true)`,
        [userId, INITIAL_USD_BALANCE, INITIAL_IDR_BALANCE]
      );

      await client.query('COMMIT');

      return res.status(201).json({
        message: 'Portfolio initialized successfully',
        portfolios: [usdResult.rows[0], idrResult.rows[0]],
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('[Portfolio] Init error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/simulation/portfolio
 * Get portfolio overview (both currencies).
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = (req as AuthRequest).user!.userId;

    // Get portfolios
    const portfolioResult = await pool.query(
      'SELECT * FROM simulated_portfolios WHERE user_id = $1 ORDER BY currency',
      [userId]
    );

    if (portfolioResult.rows.length === 0) {
      return res.status(404).json({ message: 'Portfolio not found. Please initialize first.' });
    }

    // Get holdings for each portfolio
    const portfolios = await Promise.all(
      portfolioResult.rows.map(async (portfolio) => {
        const holdingsResult = await pool.query(
          'SELECT * FROM portfolio_holdings WHERE portfolio_id = $1 ORDER BY symbol',
          [portfolio.id]
        );

        // Enrich holdings with current prices
        const holdings = await Promise.all(
          holdingsResult.rows.map(async (holding) => {
            const priceData = await getCurrentPrice(holding.symbol, holding.exchange);
            const currentPrice = priceData.price;
            const qty = parseFloat(holding.quantity);
            const marketValue = currentPrice * qty;
            const costBasis = parseFloat(holding.average_cost) * qty;
            const unrealizedPnl = marketValue - costBasis;
            const unrealizedPnlPct = costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : 0;

            return {
              ...holding,
              quantity: qty,
              currentPrice,
              marketValue: Math.round(marketValue * 100) / 100,
              costBasis: Math.round(costBasis * 100) / 100,
              unrealizedPnl: Math.round(unrealizedPnl * 100) / 100,
              unrealizedPnlPct: Math.round(unrealizedPnlPct * 100) / 100,
            };
          })
        );

        // Calculate totals
        const totalMarketValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
        const totalUnrealizedPnl = holdings.reduce((sum, h) => sum + h.unrealizedPnl, 0);
        const cashBalance = parseFloat(portfolio.cash_balance);
        const totalValue = cashBalance + totalMarketValue;

        // Calculate total return
        const initialBalance = portfolio.currency === 'USD' ? INITIAL_USD_BALANCE : INITIAL_IDR_BALANCE;
        const totalReturn = totalValue - initialBalance;
        const totalReturnPct = initialBalance > 0 ? (totalReturn / initialBalance) * 100 : 0;
        
        // Bankruptcy Logic
        let isBankrupt = false;
        let bankruptcyTime = portfolio.last_bankruptcy_reset;
        const bankruptcyThreshold = portfolio.currency === 'USD' ? 1.0 : 10000.0;
        
        if (totalValue <= bankruptcyThreshold) {
          isBankrupt = true;
          if (!bankruptcyTime) {
            const now = new Date();
            await pool.query('UPDATE simulated_portfolios SET last_bankruptcy_reset = $1 WHERE id = $2', [now, portfolio.id]);
            bankruptcyTime = now;
          }
        } else {
          if (bankruptcyTime) {
            await pool.query('UPDATE simulated_portfolios SET last_bankruptcy_reset = NULL WHERE id = $1', [portfolio.id]);
            bankruptcyTime = null;
          }
        }

        return {
          id: portfolio.id,
          currency: portfolio.currency,
          cashBalance: Math.round(cashBalance * 100) / 100,
          totalInvested: Math.round(parseFloat(portfolio.total_invested) * 100) / 100,
          totalMarketValue: Math.round(totalMarketValue * 100) / 100,
          totalValue: Math.round(totalValue * 100) / 100,
          totalReturn: Math.round(totalReturn * 100) / 100,
          totalReturnPct: Math.round(totalReturnPct * 100) / 100,
          totalUnrealizedPnl: Math.round(totalUnrealizedPnl * 100) / 100,
          holdingsCount: holdings.length,
          holdings,
          isBankrupt,
          bankruptcyTime,
          createdAt: portfolio.created_at,
          updatedAt: portfolio.updated_at,
        };
      })
    );

    return res.status(200).json({ portfolios });
  } catch (error: any) {
    console.error('[Portfolio] Get error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /api/simulation/portfolio/reset
 * Claim bankruptcy reset if 3 days have passed
 */
router.post('/reset', authenticate, async (req, res) => {
  try {
    const userId = (req as AuthRequest).user!.userId;
    const { currency } = req.body;
    
    if (currency !== 'USD' && currency !== 'IDR') {
      return res.status(400).json({ message: 'Invalid currency' });
    }
    
    const portfolioResult = await pool.query(
      'SELECT * FROM simulated_portfolios WHERE user_id = $1 AND currency = $2',
      [userId, currency]
    );
    
    if (portfolioResult.rows.length === 0) return res.status(404).json({ message: 'Portfolio not found' });
    const portfolio = portfolioResult.rows[0];
    
    if (!portfolio.last_bankruptcy_reset) {
      return res.status(400).json({ message: 'Portfolio is not bankrupt' });
    }
    
    const bankruptcyTime = new Date(portfolio.last_bankruptcy_reset);
    const now = new Date();
    const diffDays = (now.getTime() - bankruptcyTime.getTime()) / (1000 * 3600 * 24);
    
    if (diffDays < 3) {
      return res.status(400).json({ message: 'Must wait 3 days after bankruptcy to reset' });
    }
    
    // Perform reset
    const initialBalance = currency === 'USD' ? INITIAL_USD_BALANCE : INITIAL_IDR_BALANCE;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE simulated_portfolios SET cash_balance = $1, total_invested = 0, last_bankruptcy_reset = NULL WHERE id = $2', [initialBalance, portfolio.id]);
      await client.query('DELETE FROM portfolio_holdings WHERE portfolio_id = $1', [portfolio.id]);
      await client.query('UPDATE simulated_orders SET status = \'CANCELLED\' WHERE portfolio_id = $1 AND status = \'PENDING\'', [portfolio.id]);
      await client.query('COMMIT');
      return res.status(200).json({ message: 'Portfolio reset successfully' });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[Portfolio] Reset error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
