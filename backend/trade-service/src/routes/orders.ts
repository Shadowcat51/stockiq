import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db';
import { authenticate, AuthRequest } from '../middlewares/auth.middleware';
import { executeMarketOrder, placePendingOrder, OrderInput } from '../services/order-engine';

const router = Router();

// Validation schemas
const placeOrderSchema = z.object({
  symbol: z.string().min(1).max(20).transform(s => s.toUpperCase()),
  exchange: z.enum(['NYSE', 'NASDAQ', 'IDX']),
  side: z.enum(['BUY', 'SELL']),
  orderType: z.enum(['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT']),
  quantity: z.number().positive(),
  price: z.number().positive().optional(),
  stopPrice: z.number().positive().optional(),
  takeProfitPrice: z.number().positive().optional(),
  stopLossPrice: z.number().positive().optional(),
  leverage: z.number().min(1).max(10).optional().default(1),
});

/**
 * POST /api/simulation/orders
 * Place a new order.
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = (req as AuthRequest).user!.userId;
    const input = placeOrderSchema.parse(req.body);

    // Validate order-type specific requirements
    if (input.orderType === 'LIMIT' && !input.price) {
      return res.status(400).json({ message: 'Price is required for LIMIT orders' });
    }
    if ((input.orderType === 'STOP' || input.orderType === 'STOP_LIMIT') && !input.stopPrice) {
      return res.status(400).json({ message: 'Stop price is required for STOP and STOP_LIMIT orders' });
    }
    if (input.orderType === 'STOP_LIMIT' && !input.price) {
      return res.status(400).json({ message: 'Limit price is required for STOP_LIMIT orders' });
    }

    let result;

    if (input.orderType === 'MARKET') {
      // Execute immediately
      result = await executeMarketOrder(userId, input as OrderInput);
    } else {
      // Place as pending
      result = await placePendingOrder(userId, input as OrderInput);
    }

    const statusCode = result.status === 'REJECTED' ? 400 : 201;
    return res.status(statusCode).json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input data', errors: (error as any).errors });
    }
    console.error('[Orders] Place error:', error);
    return res.status(500).json({ message: (error as Error).message || 'Internal server error' });
  }
});

/**
 * GET /api/simulation/orders
 * Get order history with filters.
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = (req as AuthRequest).user!.userId;
    const { status, symbol, from, to, limit = '50', offset = '0' } = req.query;

    let queryText = `
      SELECT o.*, p.currency 
      FROM simulated_orders o
      JOIN simulated_portfolios p ON o.portfolio_id = p.id
      WHERE o.user_id = $1
    `;
    const params: any[] = [userId];
    let paramIdx = 2;

    if (status && typeof status === 'string') {
      queryText += ` AND o.status = $${paramIdx}`;
      params.push(status.toUpperCase());
      paramIdx++;
    }

    if (symbol && typeof symbol === 'string') {
      queryText += ` AND o.symbol = $${paramIdx}`;
      params.push(symbol.toUpperCase());
      paramIdx++;
    }

    if (from && typeof from === 'string') {
      queryText += ` AND o.created_at >= $${paramIdx}`;
      params.push(from);
      paramIdx++;
    }

    if (to && typeof to === 'string') {
      queryText += ` AND o.created_at <= $${paramIdx}`;
      params.push(to);
      paramIdx++;
    }

    // Count total
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM (${queryText}) sub`,
      params
    );

    // Add ordering and pagination
    queryText += ` ORDER BY o.created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    params.push(parseInt(limit as string, 10), parseInt(offset as string, 10));

    const result = await pool.query(queryText, params);

    return res.status(200).json({
      orders: result.rows.map(order => ({
        ...order,
        price: order.price ? parseFloat(order.price) : null,
        stop_price: order.stop_price ? parseFloat(order.stop_price) : null,
        filled_price: order.filled_price ? parseFloat(order.filled_price) : null,
        fee: order.fee ? parseFloat(order.fee) : 0,
        slippage: order.slippage ? parseFloat(order.slippage) : 0,
      })),
      total: parseInt(countResult.rows[0].total, 10),
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    });
  } catch (error: any) {
    console.error('[Orders] List error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/simulation/orders/:id
 * Get a specific order detail.
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const userId = (req as AuthRequest).user!.userId;
    const { id } = req.params;

    const result = await pool.query(
      `SELECT o.*, p.currency 
       FROM simulated_orders o
       JOIN simulated_portfolios p ON o.portfolio_id = p.id
       WHERE o.id = $1 AND o.user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = result.rows[0];
    return res.status(200).json({
      ...order,
      price: order.price ? parseFloat(order.price) : null,
      stop_price: order.stop_price ? parseFloat(order.stop_price) : null,
      filled_price: order.filled_price ? parseFloat(order.filled_price) : null,
      fee: order.fee ? parseFloat(order.fee) : 0,
      slippage: order.slippage ? parseFloat(order.slippage) : 0,
    });
  } catch (error: any) {
    console.error('[Orders] Get detail error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * DELETE /api/simulation/orders/:id
 * Cancel a pending order.
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const userId = (req as AuthRequest).user!.userId;
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE simulated_orders SET status = 'CANCELLED' 
       WHERE id = $1 AND user_id = $2 AND status = 'PENDING'
       RETURNING id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pending order not found or already processed' });
    }

    return res.status(200).json({ message: 'Order cancelled successfully', orderId: id });
  } catch (error: any) {
    console.error('[Orders] Cancel error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
