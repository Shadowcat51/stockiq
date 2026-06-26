import { pool } from '../db';
import { getCurrentPrice } from './price.service';

// Constants from PRD
const TRANSACTION_FEE_RATE = 0.0015;  // 0.15% per trade
const SLIPPAGE_RATE = 0.0005;         // 0.05% for market orders
const MAX_POSITION_PCT = 0.20;        // Maximum 20% of portfolio in single stock

// Initial balances (from PRD)
export const INITIAL_USD_BALANCE = 100000.00;         // $100,000
export const INITIAL_IDR_BALANCE = 1000000000.00;     // Rp 1,000,000,000

// Monthly top-up amounts
export const MONTHLY_USD_TOPUP = 50000.00;            // $50,000
export const MONTHLY_IDR_TOPUP = 50000000.00;         // Rp 50,000,000

export interface OrderInput {
  symbol: string;
  exchange: 'NYSE' | 'NASDAQ' | 'IDX';
  side: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'TAKE_PROFIT';
  quantity: number;
  price?: number;       // for LIMIT orders
  stopPrice?: number;   // for STOP_LOSS / TAKE_PROFIT
  takeProfitPrice?: number;
  stopLossPrice?: number;
  leverage?: number;
  existingOrderId?: string;
}

export interface OrderResult {
  orderId: string;
  status: string;
  filledPrice?: number;
  fee: number;
  slippage: number;
  totalCost?: number;
  totalProceeds?: number;
  rejectReason?: string;
}

/**
 * Calculate transaction fee.
 */
export function calculateFee(amount: number): number {
  return Math.round(amount * TRANSACTION_FEE_RATE * 100) / 100;
}

/**
 * Calculate slippage for market orders.
 */
export function calculateSlippage(price: number): number {
  return Math.round(price * SLIPPAGE_RATE * 10000) / 10000;
}

/**
 * Determine the currency based on exchange.
 */
export function getCurrencyForExchange(exchange: string): 'USD' | 'IDR' {
  return exchange === 'IDX' ? 'IDR' : 'USD';
}

/**
 * Get the user's portfolio for the given exchange.
 */
async function getPortfolioForExchange(userId: string, exchange: string) {
  const currency = getCurrencyForExchange(exchange);
  const result = await pool.query(
    'SELECT * FROM simulated_portfolios WHERE user_id = $1 AND currency = $2',
    [userId, currency]
  );
  return result.rows[0] || null;
}

/**
 * Validate position limit: max 20% of total portfolio value in a single stock.
 */
async function validatePositionLimit(
  portfolioId: string,
  symbol: string,
  additionalValue: number,
  totalPortfolioValue: number
): Promise<{ valid: boolean; reason?: string }> {
  // Get current holding for this symbol
  const holdingResult = await pool.query(
    'SELECT quantity, average_cost FROM portfolio_holdings WHERE portfolio_id = $1 AND symbol = $2',
    [portfolioId, symbol]
  );

  const currentValue = holdingResult.rows.length > 0
    ? parseFloat(holdingResult.rows[0].quantity) * parseFloat(holdingResult.rows[0].average_cost)
    : 0;

  const newTotalValue = currentValue + additionalValue;
  const positionPct = totalPortfolioValue > 0 ? newTotalValue / totalPortfolioValue : 1;

  if (positionPct > MAX_POSITION_PCT) {
    return {
      valid: false,
      reason: `Position limit exceeded: ${(positionPct * 100).toFixed(1)}% > ${MAX_POSITION_PCT * 100}% max. Current: $${currentValue.toFixed(2)}, Attempted addition: $${additionalValue.toFixed(2)}`,
    };
  }

  return { valid: true };
}

/**
 * Execute a market order immediately.
 */
export async function executeMarketOrder(userId: string, input: OrderInput): Promise<OrderResult> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // 1. Get portfolio
    const currency = getCurrencyForExchange(input.exchange);
    const portfolioResult = await client.query(
      'SELECT * FROM simulated_portfolios WHERE user_id = $1 AND currency = $2 FOR UPDATE',
      [userId, currency]
    );

    if (portfolioResult.rows.length === 0) {
      throw new Error('Portfolio not found. Please initialize your portfolio first.');
    }

    const portfolio = portfolioResult.rows[0];

    // 2. Get current price
    const stockPrice = await getCurrentPrice(input.symbol, input.exchange);
    const marketPrice = stockPrice.price;

    // 3. Calculate slippage
    const slippage = calculateSlippage(marketPrice);
    const filledPrice = input.side === 'BUY'
      ? marketPrice + slippage   // BUY: price slightly higher
      : marketPrice - slippage;  // SELL: price slightly lower

    // 4. Calculate amounts
    const totalAmount = filledPrice * input.quantity;
    const fee = calculateFee(totalAmount);

    if (input.side === 'BUY') {
      // === BUY FLOW ===
      const leverage = input.leverage || 1;
      const cashRequiredForTrade = totalAmount / leverage;
      const totalDebit = cashRequiredForTrade + fee;
      const borrowedAmount = totalAmount - cashRequiredForTrade;

      const availableCash = Math.max(0, parseFloat(portfolio.cash_balance));

      if (availableCash < totalDebit) {
        // REJECT — insufficient balance
        const rejectReason = `Insufficient balance. Required: ${totalDebit.toFixed(2)} (Cash: ${cashRequiredForTrade.toFixed(2)} + Fee: ${fee.toFixed(2)}), Available: ${availableCash.toFixed(2)} (Leverage: ${leverage}x)`;
        let finalOrderId;
        if (input.existingOrderId) {
          await client.query(
            `UPDATE simulated_orders SET status = 'REJECTED', order_type = 'MARKET', price = $1, filled_price = $2, fee = $3, slippage = $4, reject_reason = $5, filled_at = NOW() WHERE id = $6`,
            [marketPrice, filledPrice, fee, slippage, rejectReason, input.existingOrderId]
          );
          finalOrderId = input.existingOrderId;
        } else {
          const orderResult = await client.query(
            `INSERT INTO simulated_orders 
             (user_id, portfolio_id, symbol, exchange, order_type, side, quantity, price, status, filled_price, fee, slippage, reject_reason, filled_at, leverage) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'REJECTED', $9, $10, $11, $12, NOW(), $13)
             RETURNING id`,
            [userId, portfolio.id, input.symbol, input.exchange, 'MARKET', 'BUY', input.quantity,
             marketPrice, filledPrice, fee, slippage, rejectReason, leverage]
          );
          finalOrderId = orderResult.rows[0].id;
        }

        await client.query('COMMIT');
        return {
          orderId: finalOrderId,
          status: 'REJECTED',
          fee,
          slippage,
          rejectReason,
        };
      }

      // Check position limit
      const totalPortfolioValue = parseFloat(portfolio.cash_balance) + parseFloat(portfolio.total_invested);
      const positionCheck = await validatePositionLimit(portfolio.id, input.symbol, totalAmount, totalPortfolioValue);
      
      if (!positionCheck.valid) {
        let finalOrderId;
        if (input.existingOrderId) {
          await client.query(
            `UPDATE simulated_orders SET status = 'REJECTED', order_type = 'MARKET', price = $1, filled_price = $2, fee = $3, slippage = $4, reject_reason = $5, filled_at = NOW() WHERE id = $6`,
            [marketPrice, filledPrice, fee, slippage, positionCheck.reason, input.existingOrderId]
          );
          finalOrderId = input.existingOrderId;
        } else {
          const orderResult = await client.query(
            `INSERT INTO simulated_orders 
             (user_id, portfolio_id, symbol, exchange, order_type, side, quantity, price, status, filled_price, fee, slippage, reject_reason, filled_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'REJECTED', $9, $10, $11, $12, NOW())
             RETURNING id`,
            [userId, portfolio.id, input.symbol, input.exchange, 'MARKET', 'BUY', input.quantity,
             marketPrice, filledPrice, fee, slippage, positionCheck.reason]
          );
          finalOrderId = orderResult.rows[0].id;
        }

        await client.query('COMMIT');
        return {
          orderId: finalOrderId,
          status: 'REJECTED',
          fee,
          slippage,
          rejectReason: positionCheck.reason,
        };
      }

      // Deduct cash balance
      await client.query(
        'UPDATE simulated_portfolios SET cash_balance = cash_balance - $1, total_invested = total_invested + $2, updated_at = NOW() WHERE id = $3',
        [totalDebit, cashRequiredForTrade, portfolio.id]
      );

      // Upsert holding
      const existingHolding = await client.query(
        'SELECT * FROM portfolio_holdings WHERE portfolio_id = $1 AND symbol = $2 FOR UPDATE',
        [portfolio.id, input.symbol]
      );

      if (existingHolding.rows.length > 0) {
        const h = existingHolding.rows[0];
        const newQuantity = parseFloat(h.quantity) + input.quantity;
        const newAverageCost = ((parseFloat(h.quantity) * parseFloat(h.average_cost)) + (input.quantity * filledPrice)) / newQuantity;
        const newBorrowed = parseFloat(h.borrowed_amount || '0') + borrowedAmount;
        
        await client.query(
          'UPDATE portfolio_holdings SET quantity = $1, average_cost = $2, borrowed_amount = $3, updated_at = NOW() WHERE id = $4',
          [newQuantity, newAverageCost, newBorrowed, h.id]
        );
      } else {
        await client.query(
          'INSERT INTO portfolio_holdings (portfolio_id, symbol, exchange, quantity, average_cost, borrowed_amount) VALUES ($1, $2, $3, $4, $5, $6)',
          [portfolio.id, input.symbol, input.exchange, input.quantity, filledPrice, borrowedAmount]
        );
      }

      let mainOrderId;
      if (input.existingOrderId) {
        await client.query(
          `UPDATE simulated_orders SET status = 'FILLED', order_type = 'MARKET', price = $1, filled_price = $2, fee = $3, slippage = $4, filled_at = NOW() WHERE id = $5`,
          [marketPrice, filledPrice, fee, slippage, input.existingOrderId]
        );
        mainOrderId = input.existingOrderId;
      } else {
        const orderResult = await client.query(
          `INSERT INTO simulated_orders 
           (user_id, portfolio_id, symbol, exchange, order_type, side, quantity, price, status, filled_price, fee, slippage, filled_at, leverage) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'FILLED', $9, $10, $11, NOW(), $12)
           RETURNING id`,
          [userId, portfolio.id, input.symbol, input.exchange, 'MARKET', 'BUY', input.quantity,
           marketPrice, filledPrice, fee, slippage, leverage]
        );
        mainOrderId = orderResult.rows[0].id;
      }

      // Spawn OCO Bracket Orders if TP/SL provided
      if (input.takeProfitPrice || input.stopLossPrice) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // GTC default 30 days

        let tpOrderId = null;
        let slOrderId = null;

        if (input.takeProfitPrice) {
          const tpResult = await client.query(
            `INSERT INTO simulated_orders 
             (user_id, portfolio_id, symbol, exchange, order_type, side, quantity, price, status, expires_at) 
             VALUES ($1, $2, $3, $4, 'LIMIT', 'SELL', $5, $6, 'PENDING', $7)
             RETURNING id`,
            [userId, portfolio.id, input.symbol, input.exchange, input.quantity, input.takeProfitPrice, expiresAt]
          );
          tpOrderId = tpResult.rows[0].id;
        }

        if (input.stopLossPrice) {
          const slResult = await client.query(
            `INSERT INTO simulated_orders 
             (user_id, portfolio_id, symbol, exchange, order_type, side, quantity, stop_price, status, expires_at) 
             VALUES ($1, $2, $3, $4, 'STOP', 'SELL', $5, $6, 'PENDING', $7)
             RETURNING id`,
            [userId, portfolio.id, input.symbol, input.exchange, input.quantity, input.stopLossPrice, expiresAt]
          );
          slOrderId = slResult.rows[0].id;
        }

        // Link them
        if (tpOrderId && slOrderId) {
          await client.query(`UPDATE simulated_orders SET linked_order_id = $1 WHERE id = $2`, [slOrderId, tpOrderId]);
          await client.query(`UPDATE simulated_orders SET linked_order_id = $1 WHERE id = $2`, [tpOrderId, slOrderId]);
        }
      }

      await client.query('COMMIT');

      return {
        orderId: mainOrderId,
        status: 'FILLED',
        filledPrice,
        fee,
        slippage,
        totalCost: totalDebit,
      };

    } else {
      // === SELL FLOW ===
      
      // Check if user has enough shares
      const holdingResult = await client.query(
        'SELECT * FROM portfolio_holdings WHERE portfolio_id = $1 AND symbol = $2 FOR UPDATE',
        [portfolio.id, input.symbol]
      );

      if (holdingResult.rows.length === 0 || parseFloat(holdingResult.rows[0].quantity) < input.quantity) {
        const available = holdingResult.rows.length > 0 ? parseFloat(holdingResult.rows[0].quantity) : 0;
        
        let finalOrderId;
        if (input.existingOrderId) {
          await client.query(
            `UPDATE simulated_orders SET status = 'REJECTED', order_type = 'MARKET', price = $1, filled_price = $2, fee = $3, slippage = $4, reject_reason = $5, filled_at = NOW() WHERE id = $6`,
            [marketPrice, filledPrice, fee, slippage, `Insufficient shares. Available: ${available}, Attempted: ${input.quantity}`, input.existingOrderId]
          );
          finalOrderId = input.existingOrderId;
        } else {
          const orderResult = await client.query(
            `INSERT INTO simulated_orders 
             (user_id, portfolio_id, symbol, exchange, order_type, side, quantity, price, status, filled_price, fee, slippage, reject_reason, filled_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'REJECTED', $9, $10, $11, $12, NOW())
             RETURNING id`,
            [userId, portfolio.id, input.symbol, input.exchange, 'MARKET', 'SELL', input.quantity,
             marketPrice, filledPrice, fee, slippage, `Insufficient shares. Available: ${available}, Attempted: ${input.quantity}`]
          );
          finalOrderId = orderResult.rows[0].id;
        }

        await client.query('COMMIT');
        return {
          orderId: finalOrderId,
          status: 'REJECTED',
          fee,
          slippage,
          rejectReason: `Insufficient shares. Available: ${available}, Attempted: ${input.quantity}`,
        };
      }

      const holding = holdingResult.rows[0];
      const totalSharesOwned = parseFloat(holding.quantity);
      const proportionSold = input.quantity / totalSharesOwned;

      const currentBorrowed = parseFloat(holding.borrowed_amount || '0');
      const currentFees = parseFloat(holding.accumulated_leverage_fee || '0');

      const borrowedToRepay = currentBorrowed * proportionSold;
      const feesToRepay = currentFees * proportionSold;

      // Ensure totalCredit doesn't go negative if borrowed + fees > amount.
      // Wait, user still has to pay it. If totalCredit < 0, their cash_balance decreases!
      const totalCredit = totalAmount - fee - borrowedToRepay - feesToRepay;
      const costBasis = parseFloat(holding.average_cost) * input.quantity;

      // Credit/Debit cash balance
      await client.query(
        'UPDATE simulated_portfolios SET cash_balance = cash_balance + $1, total_invested = total_invested - $2, updated_at = NOW() WHERE id = $3',
        [totalCredit, costBasis, portfolio.id]
      );

      // Update or remove holding
      const remainingQty = totalSharesOwned - input.quantity;
      if (remainingQty <= 0.000001) {
        await client.query('DELETE FROM portfolio_holdings WHERE id = $1', [holding.id]);
      } else {
        const remainingBorrowed = currentBorrowed - borrowedToRepay;
        const remainingFees = currentFees - feesToRepay;
        await client.query(
          'UPDATE portfolio_holdings SET quantity = $1, borrowed_amount = $2, accumulated_leverage_fee = $3, updated_at = NOW() WHERE id = $4',
          [remainingQty, remainingBorrowed, remainingFees, holding.id]
        );
      }

      // Record order
      let finalOrderId;
      if (input.existingOrderId) {
        await client.query(
          `UPDATE simulated_orders SET status = 'FILLED', order_type = 'MARKET', price = $1, filled_price = $2, fee = $3, slippage = $4, filled_at = NOW() WHERE id = $5`,
          [marketPrice, filledPrice, fee, slippage, input.existingOrderId]
        );
        finalOrderId = input.existingOrderId;
      } else {
        const orderResult = await client.query(
          `INSERT INTO simulated_orders 
           (user_id, portfolio_id, symbol, exchange, order_type, side, quantity, price, status, filled_price, fee, slippage, filled_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'FILLED', $9, $10, $11, NOW())
           RETURNING id`,
          [userId, portfolio.id, input.symbol, input.exchange, 'MARKET', 'SELL', input.quantity,
           marketPrice, filledPrice, fee, slippage]
        );
        finalOrderId = orderResult.rows[0].id;
      }

      await client.query('COMMIT');
      return {
        orderId: finalOrderId,
        status: 'FILLED',
        filledPrice,
        fee,
        slippage,
        totalProceeds: totalCredit,
      };
    }
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Place a pending order (LIMIT, STOP_LOSS, TAKE_PROFIT).
 * These are stored with status 'PENDING' and evaluated by the background job.
 */
export async function placePendingOrder(userId: string, input: OrderInput): Promise<OrderResult> {
  // Get portfolio
  const currency = getCurrencyForExchange(input.exchange);
  const portfolioResult = await pool.query(
    'SELECT * FROM simulated_portfolios WHERE user_id = $1 AND currency = $2',
    [userId, currency]
  );

  if (portfolioResult.rows.length === 0) {
    throw new Error('Portfolio not found. Please initialize your portfolio first.');
  }

  const portfolio = portfolioResult.rows[0];

  // Validate basic requirements
  if (input.orderType === 'LIMIT' && !input.price) {
    throw new Error('Price is required for LIMIT orders');
  }
  if ((input.orderType === 'STOP_LOSS' || input.orderType === 'TAKE_PROFIT') && !input.stopPrice) {
    throw new Error('Stop price is required for STOP_LOSS/TAKE_PROFIT orders');
  }

  // For SELL orders, verify user has enough shares
  if (input.side === 'SELL') {
    const holdingResult = await pool.query(
      'SELECT quantity FROM portfolio_holdings WHERE portfolio_id = $1 AND symbol = $2',
      [portfolio.id, input.symbol]
    );
    const available = holdingResult.rows.length > 0 ? parseFloat(holdingResult.rows[0].quantity) : 0;
    if (available < input.quantity) {
      throw new Error(`Insufficient shares. Available: ${available}, Attempted: ${input.quantity}`);
    }
  }

  // For BUY LIMIT orders, estimate and soft-check balance
  if (input.side === 'BUY' && input.orderType === 'LIMIT' && input.price) {
    const leverage = input.leverage || 1;
    const estimatedCost = input.price * input.quantity;
    const estimatedFee = calculateFee(estimatedCost);
    const estimatedCashRequired = (estimatedCost / leverage) + estimatedFee;
    
    const availableCash = Math.max(0, parseFloat(portfolio.cash_balance));
    
    if (availableCash < estimatedCashRequired) {
      throw new Error(`Insufficient balance for limit order. Required: ${estimatedCashRequired.toFixed(2)} (Cash: ${(estimatedCost / leverage).toFixed(2)} + Fee: ${estimatedFee.toFixed(2)}), Available: ${availableCash.toFixed(2)} (Leverage: ${leverage}x)`);
    }
  }

  // Set expiry (30 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const orderResult = await pool.query(
    `INSERT INTO simulated_orders 
     (user_id, portfolio_id, symbol, exchange, order_type, side, quantity, price, stop_price, take_profit_price, stop_loss_price, status, expires_at, leverage) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'PENDING', $12, $13)
     RETURNING id`,
    [userId, portfolio.id, input.symbol, input.exchange, input.orderType, input.side,
     input.quantity, input.price || null, input.stopPrice || null, input.takeProfitPrice || null, input.stopLossPrice || null, expiresAt, input.leverage || 1]
  );

  return {
    orderId: orderResult.rows[0].id,
    status: 'PENDING',
    fee: 0,
    slippage: 0,
  };
}

/**
 * Evaluate and potentially execute pending orders.
 * Called by the background job.
 */
export async function evaluatePendingOrders(): Promise<number> {
  let executedCount = 0;

  try {
    // Get all pending orders that haven't expired
    const pendingOrders = await pool.query(
      `SELECT o.*, p.user_id as portfolio_user_id, p.currency
       FROM simulated_orders o
       JOIN simulated_portfolios p ON o.portfolio_id = p.id
       WHERE o.status = 'PENDING' AND (o.expires_at IS NULL OR o.expires_at > NOW())`
    );

    // Expire old orders
    await pool.query(
      `UPDATE simulated_orders SET status = 'EXPIRED' WHERE status = 'PENDING' AND expires_at IS NOT NULL AND expires_at <= NOW()`
    );

    for (const order of pendingOrders.rows) {
      try {
        const currentPrice = await getCurrentPrice(order.symbol, order.exchange);
        let shouldExecute = false;

        switch (order.order_type) {
          case 'LIMIT':
            if (order.side === 'BUY') {
              shouldExecute = currentPrice.price <= parseFloat(order.price);
            } else {
              shouldExecute = currentPrice.price >= parseFloat(order.price);
            }
            break;

          case 'STOP':
            if (order.side === 'BUY') {
              shouldExecute = currentPrice.price >= parseFloat(order.stop_price);
            } else {
              shouldExecute = currentPrice.price <= parseFloat(order.stop_price);
            }
            break;

          case 'STOP_LIMIT':
            if (order.side === 'BUY') {
              if (currentPrice.price >= parseFloat(order.stop_price)) {
                // Triggered, becomes a LIMIT order
                await pool.query(
                  `UPDATE simulated_orders SET order_type = 'LIMIT', stop_price = NULL WHERE id = $1`,
                  [order.id]
                );
                console.log(`[OrderEngine] STOP_LIMIT triggered for ${order.symbol}, converted to LIMIT`);
                continue; // Evaluate as LIMIT on next tick
              }
            } else {
              if (currentPrice.price <= parseFloat(order.stop_price)) {
                // Triggered, becomes a LIMIT order
                await pool.query(
                  `UPDATE simulated_orders SET order_type = 'LIMIT', stop_price = NULL WHERE id = $1`,
                  [order.id]
                );
                console.log(`[OrderEngine] STOP_LIMIT triggered for ${order.symbol}, converted to LIMIT`);
                continue; // Evaluate as LIMIT on next tick
              }
            }
            break;
        }

        if (shouldExecute) {
          // Execute as market order, updating the original pending order
          const result = await executeMarketOrder(order.user_id, {
            symbol: order.symbol,
            exchange: order.exchange,
            side: order.side,
            orderType: 'MARKET',
            quantity: parseFloat(order.quantity),
            leverage: parseFloat(order.leverage) || 1,
            existingOrderId: order.id,
          });

          // If it has a linked order (OCO), cancel the linked one
          if (order.linked_order_id) {
            await pool.query(
              `UPDATE simulated_orders SET status = 'CANCELLED' WHERE id = $1 AND status = 'PENDING'`,
              [order.linked_order_id]
            );
            console.log(`[OrderEngine] Cancelled linked order ${order.linked_order_id} due to OCO execution`);
          }

          // If the executed order was a base order that has TP/SL, spawn them now
          if (order.take_profit_price || order.stop_loss_price) {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 30); // GTC

            let tpOrderId = null;
            let slOrderId = null;

            if (order.take_profit_price) {
              const tpResult = await pool.query(
                `INSERT INTO simulated_orders 
                 (user_id, portfolio_id, symbol, exchange, order_type, side, quantity, price, status, expires_at) 
                 VALUES ($1, $2, $3, $4, 'LIMIT', 'SELL', $5, $6, 'PENDING', $7)
                 RETURNING id`,
                [order.user_id, order.portfolio_id, order.symbol, order.exchange, order.quantity, order.take_profit_price, expiresAt]
              );
              tpOrderId = tpResult.rows[0].id;
            }

            if (order.stop_loss_price) {
              const slResult = await pool.query(
                `INSERT INTO simulated_orders 
                 (user_id, portfolio_id, symbol, exchange, order_type, side, quantity, stop_price, status, expires_at) 
                 VALUES ($1, $2, $3, $4, 'STOP', 'SELL', $5, $6, 'PENDING', $7)
                 RETURNING id`,
                [order.user_id, order.portfolio_id, order.symbol, order.exchange, order.quantity, order.stop_loss_price, expiresAt]
              );
              slOrderId = slResult.rows[0].id;
            }

            // Link them
            if (tpOrderId && slOrderId) {
              await pool.query(`UPDATE simulated_orders SET linked_order_id = $1 WHERE id = $2`, [slOrderId, tpOrderId]);
              await pool.query(`UPDATE simulated_orders SET linked_order_id = $1 WHERE id = $2`, [tpOrderId, slOrderId]);
            }
          }

          executedCount++;
          console.log(`[OrderEngine] Executed pending ${order.order_type} order ${order.id} for ${order.symbol}`);
        }
      } catch (err) {
        console.error(`[OrderEngine] Error evaluating order ${order.id}:`, (err as Error).message);
      }
    }
  } catch (error) {
    console.error('[OrderEngine] Error evaluating pending orders:', error);
  }

  return executedCount;
}
