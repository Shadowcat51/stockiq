-- Trade Service Schema
-- Virtual Portfolio (1 user = 2 portfolios: USD & IDR)

CREATE TABLE IF NOT EXISTS simulated_portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    currency VARCHAR(3) NOT NULL CHECK (currency IN ('USD', 'IDR')),
    cash_balance DECIMAL(20, 2) NOT NULL DEFAULT 0,
    total_invested DECIMAL(20, 2) NOT NULL DEFAULT 0,
    last_bankruptcy_reset TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, currency)
);

-- Portfolio Holdings (stocks owned by user)
CREATE TABLE IF NOT EXISTS portfolio_holdings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES simulated_portfolios(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    exchange VARCHAR(10) NOT NULL CHECK (exchange IN ('NYSE', 'NASDAQ', 'IDX')),
    quantity DECIMAL(20, 4) NOT NULL DEFAULT 0,
    average_cost DECIMAL(20, 4) NOT NULL DEFAULT 0,
    borrowed_amount DECIMAL(20, 4) DEFAULT 0,
    accumulated_leverage_fee DECIMAL(20, 4) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(portfolio_id, symbol)
);

-- Simulated Orders
CREATE TABLE IF NOT EXISTS simulated_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    portfolio_id UUID NOT NULL REFERENCES simulated_portfolios(id),
    symbol VARCHAR(20) NOT NULL,
    exchange VARCHAR(10) NOT NULL CHECK (exchange IN ('NYSE', 'NASDAQ', 'IDX')),
    order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT')),
    side VARCHAR(4) NOT NULL CHECK (side IN ('BUY', 'SELL')),
    quantity DECIMAL(20, 4) NOT NULL,
    price DECIMAL(20, 4),
    stop_price DECIMAL(20, 4),
    take_profit_price DECIMAL(20, 4),
    stop_loss_price DECIMAL(20, 4),
    leverage DECIMAL(10, 2) DEFAULT 1,
    linked_order_id UUID REFERENCES simulated_orders(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'FILLED', 'CANCELLED', 'REJECTED', 'EXPIRED')),
    filled_price DECIMAL(20, 4),
    filled_at TIMESTAMPTZ,
    fee DECIMAL(20, 4) DEFAULT 0,
    slippage DECIMAL(20, 4) DEFAULT 0,
    reject_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sim_portfolios_user_id ON simulated_portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_holdings_portfolio_id ON portfolio_holdings(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_holdings_symbol ON portfolio_holdings(symbol);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON simulated_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON simulated_orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_symbol ON simulated_orders(symbol);
CREATE INDEX IF NOT EXISTS idx_orders_portfolio_id ON simulated_orders(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_topups_user_id ON monthly_topups(user_id);
