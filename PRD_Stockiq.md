# Product Requirements Document (PRD)

## StockIQ AI — Real-Time Stock Analysis Platform

---

**Document Version:** 1.0
**Date:** June 15, 2026
**Status:** Draft
**Author:** Product Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Goals](#2-product-vision--goals)
3. [Target Users & Personas](#3-target-users--personas)
4. [Functional Requirements](#4-functional-requirements)
   - 4.1 [User Authentication & Verification](#41-user-authentication--verification)
   - 4.2 [Real-Time Stock Charting](#42-real-time-stock-charting)
   - 4.3 [Buy/Sell Simulation Engine](#43-buysell-simulation-engine)
   - 4.4 [AI-Powered Alert System](#44-ai-powered-alert-system)
   - 4.5 [Real-Time Financial News Hub](#45-real-time-financial-news-hub)
   - 4.6 [AI Analysis Engine](#46-ai-analysis-engine)
   - 4.7 [User Dashboard & Portfolio](#47-user-dashboard--portfolio)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [Technical Architecture](#6-technical-architecture)
7. [Data Requirements](#7-data-requirements)
8. [UI/UX Requirements](#8-uiux-requirements)
9. [Security & Compliance](#9-security--compliance)
10. [API Specifications](#10-api-specifications)
11. [Success Metrics & KPIs](#11-success-metrics--kpis)
12. [Roadmap & Milestones](#12-roadmap--milestones)
13. [Appendix](#13-appendix)

---

## 1. Executive Summary

StockVision AI is a comprehensive real-time stock analysis platform targeting both United States (US) and Indonesia (ID) stock markets. The platform integrates advanced AI-driven analytics, interactive charting, virtual trading simulation, real-time financial news aggregation, and intelligent alert systems to empower retail investors and traders with institutional-grade tools.

### Key Differentiators
- **AI-First Approach**: All analysis modules are powered by machine learning models
- **Dual Market Support**: Seamless coverage of US (NYSE, NASDAQ) and Indonesia (IDX) markets
- **Real-Time Everything**: Live data streaming for charts, news, and alerts
- **Risk-Aware Simulation**: Virtual trading with realistic market conditions
- **Mandatory Email Verification**: Secure account activation workflow

---

## 2. Product Vision & Goals

### Vision Statement
> "Democratize institutional-grade stock analysis and AI-powered trading intelligence for retail investors across US and Indonesia markets."

### Product Goals

| Goal ID | Goal Description | Priority | Success Metric |
|---------|------------------|----------|----------------|
| G1 | Provide real-time stock data visualization for US & ID markets | P0 | <500ms data latency |
| G2 | Enable AI-assisted buy/sell decision making | P0 | 75%+ prediction accuracy |
| G3 | Deliver real-time financial news with AI sentiment analysis | P0 | <2min news-to-platform time |
| G4 | Build intelligent alert system for risk management | P0 | 95%+ alert delivery rate |
| G5 | Create realistic virtual trading simulation | P1 | 10K+ monthly active simulators |
| G6 | Ensure secure, verified user accounts | P0 | 100% verification compliance |

### Business Objectives
- Acquire 50,000 registered users within 12 months of launch
- Achieve 15,000 Monthly Active Users (MAU) by Month 6
- Generate revenue through premium subscriptions (Freemium model)
- Establish partnerships with financial data providers

---

## 3. Target Users & Personas

### Primary Personas

#### Persona 1: "Budi — The Aspiring Indonesian Investor"
- **Demographics**: 28 years old, Jakarta, Software Engineer
- **Experience Level**: Beginner (1 year investing)
- **Goals**: Learn stock trading, understand market patterns, minimize losses
- **Pain Points**: Limited access to quality analysis tools, language barrier with US tools, fear of losing real money while learning
- **Usage Pattern**: Evenings and weekends, mobile-first
- **Key Features**: Simulation mode, Indonesian stock focus, Bahasa Indonesia UI, educational AI insights

#### Persona 2: "Sarah — The US Active Trader"
- **Demographics**: 35 years old, New York, Marketing Manager
- **Experience Level**: Intermediate (5 years trading)
- **Goals**: Identify short-term opportunities, manage risk, stay informed
- **Pain Points**: Information overload, need for quick pattern recognition, missed opportunities
- **Usage Pattern**: Pre-market, market hours, after-hours
- **Key Features**: Advanced charting, AI alerts, real-time news, multi-timeframe analysis

#### Persona 3: "David — The Data-Driven Analyst"
- **Demographics**: 42 years old, Singapore, Portfolio Manager
- **Experience Level**: Advanced (15 years in finance)
- **Goals**: Validate hypotheses, backtest strategies, monitor portfolio risk
- **Pain Points**: Need for accurate AI predictions, comprehensive backtesting, cross-market correlation
- **Usage Pattern**: Daily deep analysis sessions
- **Key Features**: AI prediction models, backtesting engine, correlation analysis, API access

### User Segmentation

| Segment | Description | Feature Access |
|---------|-------------|----------------|
| **Free** | Basic users | Delayed charts (15min), 5 stocks in watchlist, basic news, limited AI |
| **Pro** | $19.99/month | Real-time data, unlimited watchlist, full AI features, alerts |
| **Enterprise** | Custom pricing | API access, white-label, dedicated support, custom AI models |

---

## 4. Functional Requirements

---

### 4.1 User Authentication & Verification

#### 4.1.1 Registration Methods

| Requirement ID | Description | Priority | Acceptance Criteria |
|----------------|-------------|----------|---------------------|
| AUTH-001 | Email & Password Registration | P0 | User can register with email, password, and name. Password must meet security requirements. |
| AUTH-002 | Google OAuth 2.0 Registration | P0 | User can register/login using Google account. Profile data auto-populated. |
| AUTH-003 | Email Verification Flow | P0 | Verification email sent within 60 seconds. Link expires in 24 hours. |
| AUTH-004 | Pre-Verification Restriction | P0 | Unverified users cannot access any authenticated features. |
| AUTH-005 | Resend Verification | P0 | Users can request resend up to 3 times per day. Rate limited. |
| AUTH-006 | Verification Confirmation | P0 | Upon clicking link, account status changes to VERIFIED. User redirected to login. |

#### 4.1.2 Login & Session Management

| Requirement ID | Description | Priority | Acceptance Criteria |
|----------------|-------------|----------|---------------------|
| AUTH-007 | Login with Verified Account | P0 | Only VERIFIED accounts can login. Error message for unverified accounts. |
| AUTH-008 | JWT Token System | P0 | Access token (15min expiry), Refresh token (7 days, HTTP-only cookie). |
| AUTH-009 | Token Refresh | P0 | Silent refresh before expiry. Seamless user experience. |
| AUTH-010 | Logout | P0 | Invalidate tokens, clear cookies, terminate WebSocket connections. |
| AUTH-011 | Password Reset | P1 | Secure reset flow via email. Link expires in 1 hour. |
| AUTH-012 | Account Settings | P1 | Update profile, change password, manage notification preferences. |

#### 4.1.3 Email Verification Flow Diagram

```
[User Registration]
       │
       ▼
┌─────────────────┐
│ 1. Validate Input│
│    - Email format │
│    - Password strength
│    - Unique email │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. Create Account│
│    Status: UNVERIFIED
│    Store: email, hash, name
│    CreatedAt timestamp
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. Generate Token│
│    - UUID v4 + HMAC signature
│    - Expiry: 24 hours
│    - Store in DB with expiry
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4. Send Email   │
│    - SendGrid API
│    - HTML template
│    - Verification link
│    - Track delivery status
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 5. User Clicks  │
│    - Validate token
│    - Check expiry
│    - Check if already used
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 6. Verify      │
│    - Update status: VERIFIED
│    - Set verifiedAt timestamp
│    - Mark token as used
│    - Redirect to login
└─────────────────┘
```

---

### 4.2 Real-Time Stock Charting

#### 4.2.1 Supported Markets

| Market | Exchange | Coverage | Data Type |
|--------|----------|----------|-----------|
| US | NYSE | All listed stocks | Real-time (Pro) / Delayed 15min (Free) |
| US | NASDAQ | All listed stocks | Real-time (Pro) / Delayed 15min (Free) |
| Indonesia | IDX | All listed stocks | Real-time (Pro) / Delayed 15min (Free) |

#### 4.2.2 Chart Types

| Requirement ID | Chart Type | Priority | Description |
|----------------|------------|----------|-------------|
| CHART-001 | Candlestick | P0 | Standard OHLC candlestick with color coding (green up, red down) |
| CHART-002 | Line Chart | P0 | Simple closing price line chart |
| CHART-003 | Volume Bar | P0 | Volume histogram overlay |
| CHART-004 | Heikin-Ashi | P1 | Smoothed candlestick for trend identification |
| CHART-005 | Renko | P2 | Brick-based chart filtering noise |
| CHART-006 | Point & Figure | P2 | X-O column chart for pattern analysis |
| CHART-007 | Area Chart | P1 | Filled area under line for visual emphasis |

#### 4.2.3 Timeframes

| Requirement ID | Timeframe | Priority | Data Points |
|----------------|-----------|----------|-------------|
| TIME-001 | 1 Minute | P0 | Last 24 hours |
| TIME-002 | 5 Minutes | P0 | Last 5 days |
| TIME-003 | 15 Minutes | P0 | Last 15 days |
| TIME-004 | 1 Hour | P0 | Last 3 months |
| TIME-005 | 4 Hours | P0 | Last 6 months |
| TIME-006 | 1 Day | P0 | Last 5 years |
| TIME-007 | 1 Week | P1 | Last 10 years |
| TIME-008 | 1 Month | P1 | All available history |

#### 4.2.4 Technical Indicators

| Requirement ID | Indicator | Category | Priority |
|----------------|-----------|----------|----------|
| IND-001 | Simple Moving Average (SMA) | Trend | P0 |
| IND-002 | Exponential Moving Average (EMA) | Trend | P0 |
| IND-003 | Relative Strength Index (RSI) | Momentum | P0 |
| IND-004 | MACD (Moving Average Convergence Divergence) | Momentum | P0 |
| IND-005 | Bollinger Bands | Volatility | P0 |
| IND-006 | Volume Weighted Average Price (VWAP) | Volume | P0 |
| IND-007 | Average True Range (ATR) | Volatility | P1 |
| IND-008 | Stochastic Oscillator | Momentum | P1 |
| IND-009 | Fibonacci Retracement | Support/Resistance | P1 |
| IND-010 | Ichimoku Cloud | Trend | P2 |
| IND-011 | Parabolic SAR | Trend | P2 |
| IND-012 | On-Balance Volume (OBV) | Volume | P2 |

#### 4.2.5 Interactive Features

| Requirement ID | Feature | Priority | Description |
|----------------|---------|----------|-------------|
| INTER-001 | Crosshair Tool | P0 | Vertical/horizontal crosshair with price tooltip |
| INTER-002 | Zoom & Pan | P0 | Mouse wheel zoom, click-drag pan |
| INTER-003 | Drawing Tools | P0 | Trend lines, horizontal lines, rectangles |
| INTER-004 | Multi-Chart Sync | P1 | Synchronize multiple charts on same stock |
| INTER-005 | Chart Comparison | P1 | Overlay two stocks on same chart |
| INTER-006 | Screenshot/Export | P2 | Export chart as PNG/SVG |
| INTER-007 | Custom Colors | P2 | User-defined color schemes |

#### 4.2.6 Real-Time Data Flow

```
Data Provider (Yahoo Finance / IDX)
         │
         │ WebSocket / API Polling
         ▼
┌─────────────────┐
│ Data Ingestion   │
│ Service          │
│ - Normalize data │
│ - Validate       │
│ - Rate limit     │
└────────┬────────┘
         │
         │ Publish to Kafka
         ▼
┌─────────────────┐
│ Message Queue   │
│ (Kafka Topics)  │
│ - us-stock-data │
│ - id-stock-data │
└────────┬────────┘
         │
         │ Consume
         ▼
┌─────────────────┐
│ Real-Time       │
│ Processing      │
│ - Calculate     │
│   indicators    │
│ - Detect        │
│   patterns      │
└────────┬────────┘
         │
         │ WebSocket Broadcast
         ▼
┌─────────────────┐
│ Connected       │
│ Clients         │
│ (Socket.io)     │
└─────────────────┘
```

---

### 4.3 Buy/Sell Simulation Engine

#### 4.3.1 Virtual Portfolio

| Requirement ID | Feature | Priority | Description |
|----------------|---------|----------|-------------|
| SIM-001 | Starting Balance | P0 | $100,000 USD / Rp 1,000,000,000 IDR virtual currency |
| SIM-002 | Multi-Currency Support | P0 | Separate portfolios for USD and IDR markets |
| SIM-003 | Portfolio Overview | P0 | Total value, P&L, allocation pie chart, performance graph |
| SIM-004 | Transaction History | P0 | Complete log of all simulated trades with timestamps |
| SIM-005 | Performance Metrics | P1 | Sharpe ratio, max drawdown, win rate, avg return |

#### 4.3.2 Order Types

| Requirement ID | Order Type | Priority | Description |
|----------------|------------|----------|-------------|
| ORDER-001 | Market Order | P0 | Execute at current market price |
| ORDER-002 | Limit Order | P0 | Execute at specified price or better |
| ORDER-003 | Stop Loss | P0 | Trigger sell when price falls to specified level |
| ORDER-004 | Take Profit | P0 | Trigger sell when price reaches target |
| ORDER-005 | OCO (One-Cancels-Other) | P1 | Combined stop loss + take profit |
| ORDER-006 | Trailing Stop | P2 | Dynamic stop loss that follows price |

#### 4.3.3 Simulation Rules

| Requirement ID | Rule | Priority | Description |
|----------------|------|----------|-------------|
| RULE-001 | Transaction Fee | P0 | 0.1% per trade (simulated brokerage fee) |
| RULE-002 | Slippage | P0 | 0.05% slippage for market orders |
| RULE-003 | Position Limit | P0 | Maximum 20% of portfolio in single stock |
| RULE-004 | Day Trade Rule | P1 | Pattern day trader simulation for US accounts |
| RULE-005 | Market Hours | P1 | Orders only execute during market hours |
| RULE-006 | Settlement | P2 | T+2 settlement simulation |

#### 4.3.4 Backtesting

| Requirement ID | Feature | Priority | Description |
|----------------|---------|----------|-------------|
| BACK-001 | Strategy Builder | P1 | Visual rule builder for entry/exit conditions |
| BACK-002 | Historical Data | P1 | 5 years of historical data for backtesting |
| BACK-003 | Performance Report | P1 | Detailed backtest results with metrics |
| BACK-004 | Strategy Comparison | P2 | Compare multiple strategies side-by-side |
| BACK-005 | AI Strategy Suggestion | P2 | AI-recommended strategies based on stock behavior |

---

### 4.4 AI-Powered Alert System

#### 4.4.1 Alert Types

| Requirement ID | Alert Type | Category | Priority | Trigger |
|----------------|------------|----------|----------|---------|
| ALERT-001 | Price Target | Price | P0 | Stock reaches user-defined price |
| ALERT-002 | Percentage Change | Price | P0 | Stock moves ±X% in timeframe |
| ALERT-003 | Volume Spike | Volume | P0 | Volume exceeds 200% of average |
| ALERT-004 | Technical Break | Technical | P0 | Support/resistance level broken |
| ALERT-005 | AI Trend Reversal | AI | P0 | AI model detects reversal pattern |
| ALERT-006 | AI Risk Warning | AI | P0 | Portfolio drawdown exceeds threshold |
| ALERT-007 | News Sentiment | News | P0 | Negative sentiment spike detected |
| ALERT-008 | AI Price Prediction | AI | P1 | AI predicts >3% move in 24h |
| ALERT-009 | Correlation Alert | AI | P1 | Sector-wide unusual movement |
| ALERT-010 | Earnings Alert | Fundamental | P1 | Upcoming earnings announcement |

#### 4.4.2 Alert Configuration

| Requirement ID | Feature | Priority | Description |
|----------------|---------|----------|-------------|
| CONFIG-001 | Custom Thresholds | P0 | User-defined trigger values |
| CONFIG-002 | Time-Based Rules | P0 | Active hours, expiry dates for alerts |
| CONFIG-003 | Alert Templates | P1 | Pre-configured alert sets (conservative, aggressive) |
| CONFIG-004 | Alert Grouping | P1 | Group alerts by watchlist or sector |
| CONFIG-005 | Cooldown Period | P1 | Minimum time between repeated alerts |

#### 4.4.3 Notification Channels

| Requirement ID | Channel | Priority | Description |
|----------------|---------|----------|-------------|
| NOTIFY-001 | In-App | P0 | Real-time popup/toast notification |
| NOTIFY-002 | Email | P0 | HTML email with alert details |
| NOTIFY-003 | Push Notification | P1 | Mobile push (when mobile app available) |
| NOTIFY-004 | SMS | P2 | Text message for critical alerts (Pro users) |
| NOTIFY-005 | Webhook | P2 | Custom webhook for enterprise users |

#### 4.4.4 AI Risk Assessment Model

```
INPUT FEATURES:
├── Technical Layer
│   ├── RSI value and divergence
│   ├── MACD histogram and signal line
│   ├── Bollinger Band position (%B)
│   ├── Moving average alignment (golden/death cross)
│   └── Candlestick pattern detection
│
├── Volume Layer
│   ├── Relative volume (current vs 20-day avg)
│   ├── OBV trend direction
│   ├── Volume-price divergence
│   └── Block trade detection
│
├── Sentiment Layer
│   ├── News sentiment score (-1 to +1)
│   ├── Social media sentiment
│   ├── Analyst rating consensus
│   └── Insider trading signals
│
├── Market Context
│   ├── Sector performance relative to index
│   ├── Market beta coefficient
│   ├── VIX/volatility index level
│   └── Correlation with major indices
│
└── Fundamental Layer
    ├── P/E ratio vs sector average
    ├── Earnings surprise history
    ├── Revenue growth trend
    └── Debt-to-equity ratio

OUTPUT:
├── Risk Score: 0-100
├── Confidence Level: 0-100%
├── Signal: STRONG_BUY / BUY / HOLD / SELL / STRONG_SELL
├── Time Horizon: Short (1-5 days) / Medium (1-4 weeks) / Long (1-6 months)
└── Key Factors: Top 5 contributing factors
```

---

### 4.5 Real-Time Financial News Hub

#### 4.5.1 News Sources

| Requirement ID | Source | Region | Priority |
|----------------|--------|--------|----------|
| NEWS-001 | Bloomberg | Global | P0 |
| NEWS-002 | Reuters | Global | P0 |
| NEWS-003 | CNBC | US | P0 |
| NEWS-004 | Wall Street Journal | US | P0 |
| NEWS-005 | Financial Times | Global | P0 |
| NEWS-006 | MarketWatch | US | P1 |
| NEWS-007 | Investing.com | Global | P1 |
| NEWS-008 | Kontan | Indonesia | P0 |
| NEWS-009 | Bisnis Indonesia | Indonesia | P0 |
| NEWS-010 | IDX News | Indonesia | P0 |
| NEWS-011 | Twitter/X (Social) | Global | P1 |
| NEWS-012 | Reddit r/wallstreetbets | US | P2 |

#### 4.5.2 AI Processing Pipeline

| Requirement ID | Processing Step | Priority | Description |
|----------------|-----------------|----------|-------------|
| PROC-001 | Content Extraction | P0 | Extract title, body, publish time, source |
| PROC-002 | Deduplication | P0 | Content hash comparison to eliminate duplicates |
| PROC-003 | Entity Extraction | P0 | NLP extraction of stock tickers, companies, people |
| PROC-004 | Sentiment Analysis | P0 | Classify as positive/neutral/negative with confidence score |
| PROC-005 | Summarization | P0 | AI-generated 2-3 sentence summary |
| PROC-006 | Impact Scoring | P1 | AI-assessed market impact score (1-10) |
| PROC-007 | Topic Clustering | P1 | Group related news into topics |
| PROC-008 | Translation | P1 | Auto-translate ID news to EN and vice versa |

#### 4.5.3 News Features

| Requirement ID | Feature | Priority | Description |
|----------------|---------|----------|-------------|
| FEAT-001 | Real-Time Feed | P0 | Auto-refreshing news feed, updates every 30 seconds |
| FEAT-002 | Watchlist Filtering | P0 | Show only news related to user's watchlist stocks |
| FEAT-003 | Sentiment Overlay | P0 | Color-coded news cards (green/gray/red) |
| FEAT-004 | Stock Correlation | P0 | Auto-link news to relevant stock tickers |
| FEAT-005 | Trending Topics | P1 | Clustered trending news topics |
| FEAT-006 | Breaking News Alert | P1 | Priority push for major market-moving news |
| FEAT-007 | News Timeline | P1 | Chronological view of news for specific stock |
| FEAT-008 | AI Insight | P2 | AI-generated "What this means for investors" section |

---

### 4.6 AI Analysis Engine

#### 4.6.1 AI Components

##### A. Technical Analysis AI

| Requirement ID | Feature | Priority | Model/Method |
|----------------|---------|----------|--------------|
| AI-TA-001 | Pattern Recognition | P0 | CNN trained on 50+ chart patterns |
| AI-TA-002 | Support/Resistance Detection | P0 | Algorithmic + ML hybrid |
| AI-TA-003 | Trend Classification | P0 | LSTM sequence model |
| AI-TA-004 | Indicator Interpretation | P0 | Rule-based + neural network ensemble |
| AI-TA-005 | Candlestick Pattern Detection | P1 | Computer vision + traditional pattern matching |

##### B. Fundamental Analysis AI

| Requirement ID | Feature | Priority | Model/Method |
|----------------|---------|----------|--------------|
| AI-FA-001 | Earnings Prediction | P1 | Time-series forecasting (ARIMA + LSTM) |
| AI-FA-002 | Valuation Modeling | P2 | Automated DCF with AI-adjusted assumptions |
| AI-FA-003 | Financial Statement NLP | P2 | BERT-based analysis of 10-K/10-Q filings |
| AI-FA-004 | Peer Comparison | P2 | Clustering + ranking algorithm |

##### C. Sentiment Analysis AI

| Requirement ID | Feature | Priority | Model/Method |
|----------------|---------|----------|--------------|
| AI-SA-001 | News Sentiment | P0 | FinBERT fine-tuned on financial corpus |
| AI-SA-002 | Social Media Sentiment | P1 | RoBERTa for Twitter/Reddit analysis |
| AI-SA-003 | Analyst Consensus | P1 | Aggregation + trend analysis |
| AI-SA-004 | Earnings Call Sentiment | P2 | Speech-to-text + sentiment analysis |

##### D. Predictive Modeling

| Requirement ID | Feature | Priority | Model/Method |
|----------------|---------|----------|--------------|
| AI-PM-001 | Short-Term Price Prediction | P0 | LSTM/Transformer (1-5 days horizon) |
| AI-PM-002 | Medium-Term Prediction | P1 | Ensemble model (1-4 weeks) |
| AI-PM-003 | Volatility Forecasting | P1 | GARCH + LSTM hybrid |
| AI-PM-004 | Portfolio Optimization | P2 | Modern Portfolio Theory + reinforcement learning |
| AI-PM-005 | Risk Prediction | P0 | Gradient boosting (XGBoost/LightGBM) |

#### 4.6.2 AI Dashboard

| Requirement ID | Feature | Priority | Description |
|----------------|---------|----------|-------------|
| AI-DASH-001 | AI Signal Card | P0 | Current signal (BUY/HOLD/SELL) with confidence |
| AI-DASH-002 | Reasoning Panel | P0 | Explainable AI — top 5 factors influencing signal |
| AI-DASH-003 | Prediction Chart | P0 | AI price prediction overlay on actual price chart |
| AI-DASH-004 | Historical Accuracy | P1 | Track record of AI predictions for this stock |
| AI-DASH-005 | Similar Patterns | P1 | Historical chart patterns that match current setup |
| AI-DASH-006 | Risk Metrics | P0 | AI-calculated risk score and recommended position size |

#### 4.6.3 AI Training & Maintenance

| Requirement ID | Feature | Priority | Description |
|----------------|---------|----------|-------------|
| AI-TRAIN-001 | Daily Retraining | P0 | Incremental model updates with latest data |
| AI-TRAIN-002 | Backtesting Validation | P0 | Weekly backtest on 2-year holdout data |
| AI-TRAIN-003 | A/B Testing | P1 | Compare model versions with live traffic split |
| AI-TRAIN-004 | Performance Monitoring | P0 | Track prediction accuracy, drift detection |
| AI-TRAIN-005 | Human-in-the-Loop | P2 | Expert feedback integration for model improvement |

---

### 4.7 User Dashboard & Portfolio

#### 4.7.1 Main Dashboard

| Requirement ID | Widget | Priority | Description |
|----------------|--------|----------|-------------|
| DASH-001 | Market Overview | P0 | Major indices (S&P 500, NASDAQ, IHSG) with daily change |
| DASH-002 | Watchlist Summary | P0 | Top 5 watched stocks with sparkline and change % |
| DASH-003 | AI Market Sentiment | P0 | Overall market sentiment gauge (bullish/bearish) |
| DASH-004 | Recent Alerts | P0 | Last 5 triggered alerts |
| DASH-005 | Top Movers | P1 | Gainers and losers of the day |
| DASH-006 | News Ticker | P1 | Scrolling latest headlines |
| DASH-007 | Portfolio Snapshot | P0 | For simulation users — total value, P&L, allocation |

#### 4.7.2 Watchlist Management

| Requirement ID | Feature | Priority | Description |
|----------------|---------|----------|-------------|
| WATCH-001 | Create Watchlist | P0 | Multiple named watchlists per user |
| WATCH-002 | Add/Remove Stocks | P0 | Search and add stocks, remove with confirmation |
| WATCH-003 | Reorder | P1 | Drag-and-drop reordering |
| WATCH-004 | Import/Export | P2 | CSV import/export of watchlists |
| WATCH-005 | Share | P2 | Share watchlist via link |
| WATCH-006 | AI Suggestions | P2 | AI-recommended stocks based on watchlist patterns |

#### 4.7.3 User Profile & Settings

| Requirement ID | Feature | Priority | Description |
|----------------|---------|----------|-------------|
| PROF-001 | Profile Information | P0 | Name, email, avatar, timezone |
| PROF-002 | Notification Preferences | P0 | Enable/disable channels per alert type |
| PROF-003 | Display Preferences | P1 | Theme (light/dark), default chart type, language |
| PROF-004 | Subscription Management | P1 | View plan, upgrade/downgrade, billing history |
| PROF-005 | Data Export | P2 | Export all user data (GDPR compliance) |
| PROF-006 | Account Deletion | P2 | Self-service account deletion |

---

## 5. Non-Functional Requirements

### 5.1 Performance

| Requirement ID | Metric | Target | Priority |
|----------------|--------|--------|----------|
| PERF-001 | Page Load Time | <2 seconds (First Contentful Paint) | P0 |
| PERF-002 | Chart Render Time | <500ms for 1000 data points | P0 |
| PERF-003 | Real-Time Data Latency | <500ms from market to user screen | P0 |
| PERF-004 | API Response Time | <200ms for 95th percentile | P0 |
| PERF-005 | Simultaneous Users | Support 10,000 concurrent users | P0 |
| PERF-006 | WebSocket Message Rate | Handle 1,000 msg/sec per server | P0 |
| PERF-007 | Search Response | <100ms for stock search | P1 |

### 5.2 Availability & Reliability

| Requirement ID | Metric | Target | Priority |
|----------------|--------|--------|----------|
| AVAIL-001 | Uptime | 99.9% (excluding scheduled maintenance) | P0 |
| AVAIL-002 | Scheduled Maintenance | <4 hours/month, announced 48h prior | P0 |
| AVAIL-003 | Data Accuracy | 99.99% for price data | P0 |
| AVAIL-004 | Failover Time | <30 seconds automatic failover | P0 |
| AVAIL-005 | Backup Frequency | Real-time replication, daily snapshots | P0 |

### 5.3 Scalability

| Requirement ID | Metric | Target | Priority |
|----------------|--------|--------|----------|
| SCALE-001 | Horizontal Scaling | Auto-scale based on CPU/memory load | P0 |
| SCALE-002 | Database Scaling | Read replicas, sharding ready | P0 |
| SCALE-003 | Cache Scaling | Redis Cluster for distributed caching | P0 |
| SCALE-004 | User Growth | Support 100,000 users within 12 months | P1 |

### 5.4 Security

| Requirement ID | Requirement | Priority | Implementation |
|----------------|-------------|----------|----------------|
| SEC-001 | HTTPS Everywhere | P0 | TLS 1.3 for all communications |
| SEC-002 | Password Hashing | P0 | bcrypt with cost factor 12 |
| SEC-003 | JWT Security | P0 | RS256 signing, secure key rotation |
| SEC-004 | Rate Limiting | P0 | 100 requests/minute per IP, 1000 per user |
| SEC-005 | SQL Injection Prevention | P0 | Parameterized queries, ORM usage |
| SEC-006 | XSS Prevention | P0 | Content Security Policy, input sanitization |
| SEC-007 | CSRF Protection | P0 | Double-submit cookie pattern |
| SEC-008 | Data Encryption at Rest | P0 | AES-256 for sensitive data |
| SEC-009 | OAuth Security | P0 | PKCE flow for mobile, state parameter |
| SEC-010 | Audit Logging | P1 | Log all authentication and financial actions |

### 5.5 Compliance

| Requirement ID | Requirement | Priority |
|----------------|-------------|----------|
| COMP-001 | GDPR Compliance | P0 |
| COMP-002 | Indonesia PDP Law Compliance | P0 |
| COMP-003 | CCPA Compliance (for US users) | P1 |
| COMP-004 | SOC 2 Type II (future) | P2 |
| COMP-005 | Data Residency | P1 | ID user data stored in Indonesia region |

---

## 6. Technical Architecture

### 6.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │   Web    │  │  Mobile  │  │ Desktop  │  │  API     │          │
│  │ (Next.js)│  │(React    │  │(Electron)│  │ Consumers│          │
│  │          │  │ Native)  │  │          │  │          │          │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘          │
│       └─────────────┴─────────────┴─────────────┘                  │
│                         │                                           │
│                    ┌────┴────┐                                      │
│                    │  CDN    │  CloudFlare                          │
│                    │  WAF    │  DDoS Protection                     │
│                    └────┬────┘                                      │
└─────────────────────────┼───────────────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────────────┐
│                    API GATEWAY                                      │
│  ┌──────────────────────┴──────────────────────┐                   │
│  │  Kong / AWS API Gateway                      │                   │
│  │  • Rate Limiting  • Auth Validation          │                   │
│  │  • Request Routing  • Load Balancing         │                   │
│  │  • API Versioning  • Request Logging         │                   │
│  └──────────────────────┬──────────────────────┘                   │
└─────────────────────────┼───────────────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────────────┐
│              MICROSERVICES CLUSTER                                    │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │   Auth      │  │   Stock     │  │   Trade     │  │   News     │ │
│  │   Service   │  │   Service   │  │   Service   │  │   Service  │ │
│  │  (Node.js)  │  │  (Python)   │  │    (Go)     │  │  (Python)  │ │
│  │             │  │             │  │             │  │            │ │
│  │ • Register  │  │ • Real-time │  │ • Orders    │  │ • Aggregate│ │
│  │ • Login     │  │   data      │  │ • Portfolio │  │ • Process  │ │
│  │ • Verify    │  │ • Historical│  │ • History   │  │ • Deliver  │ │
│  │ • Token     │  │ • Search    │  │ • Backtest  │  │            │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │    AI       │  │   Alert     │  │  Portfolio  │  │  Notify    │ │
│  │   Service   │  │   Service   │  │   Service   │  │  Service   │ │
│  │  (Python)   │  │  (Node.js)  │  │   (Go)      │  │ (Node.js)  │ │
│  │             │  │             │  │             │  │            │ │
│  │ • Predict   │  │ • Evaluate│  │ • Track     │  │ • Email    │ │
│  │ • Analyze   │  │ • Trigger   │  │ • Calculate │  │ • Push     │ │
│  │ • Sentiment │  │ • Route     │  │ • Report    │  │ • SMS      │ │
│  │ • Pattern   │  │ • Log       │  │             │  │ • Webhook  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │   User      │  │   Billing   │  │   Admin     │                  │
│  │   Service   │  │   Service   │  │   Service   │                  │
│  │  (Node.js)  │  │  (Node.js)  │  │  (Node.js)  │                  │
│  └─────────────┘  └─────────────┘  └─────────────┘                  │
└─────────────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────────────┐
│                    MESSAGE QUEUE (Kafka)                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐    │
│  │stock-data  │  │news-feed   │  │alerts      │  │user-events │    │
│  │-us         │  │-raw        │  │-trigger   │  │-auth       │    │
│  │-id         │  │-processed  │  │-delivered │  │-activity   │    │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────────────┐
│                      DATA LAYER                                     │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐│
│  │ PostgreSQL  │  │   Redis     │  │  InfluxDB   │  │Elasticsearch││
│  │             │  │             │  │             │  │             ││
│  │ • Users     │  │ • Sessions  │  │ • Price     │  │ • News      ││
│  │ • Accounts  │  │ • Cache     │  │   time-series│  │   search    ││
│  │ • Orders    │  │ • Real-time │  │ • Indicators│  │ • Analytics ││
│  │ • Watchlists│  │   data      │  │ • Alerts    │  │             ││
│  │ • Settings  │  │ • Rate limit│  │   history   │  │             ││
│  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘│
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐                                  │
│  │    S3 /     │  │   MLflow    │                                  │
│  │  Cloud      │  │  (Model     │                                  │
│  │  Storage    │  │   Registry) │                                  │
│  │             │  │             │                                  │
│  │ • User      │  │ • Model     │                                  │
│  │   avatars   │  │   versions  │                                  │
│  │ • Chart     │  │ • Training  │                                  │
│  │   exports   │  │   artifacts │                                  │
│  │ • Backups   │  │ • Experiment│                                  │
│  │             │  │   tracking  │                                  │
│  └─────────────┘  └─────────────┘                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 Technology Stack

| Layer | Technology | Version | Justification |
|-------|-----------|---------|---------------|
| **Frontend** | Next.js | 14.x | SSR, App Router, React Server Components |
| | TypeScript | 5.x | Type safety, better DX |
| | Tailwind CSS | 3.x | Utility-first styling |
| | TradingView Charting | Latest | Industry-standard financial charts |
| | React Query | 5.x | Server state management |
| | Zustand | 4.x | Client state management |
| | Socket.io Client | 4.x | Real-time WebSocket |
| **Backend API** | Node.js | 20 LTS | Event-driven, large ecosystem |
| | Express.js / NestJS | Latest | REST API framework |
| | Python | 3.11+ | AI/ML services |
| | FastAPI | Latest | High-performance Python API |
| **Database** | PostgreSQL | 15+ | ACID compliance, complex queries |
| | InfluxDB | 2.x | Time-series data optimization |
| | Redis | 7.x | Caching, sessions, pub/sub |
| | Elasticsearch | 8.x | Full-text search for news |
| **Message Queue** | Apache Kafka | 3.x | High-throughput streaming |
| **AI/ML** | PyTorch | 2.x | Deep learning framework |
| | TensorFlow | 2.x | Alternative DL framework |
| | scikit-learn | Latest | Traditional ML algorithms |
| | Hugging Face Transformers | Latest | Pre-trained NLP models |
| | MLflow | Latest | Model lifecycle management |
| **Real-Time** | Socket.io | 4.x | Bidirectional event-based |
| | WebSocket | Native | Low-latency communication |
| **Auth** | Firebase Auth | Latest | Managed authentication |
| | Auth0 | Alternative | Enterprise-grade auth |
| **Email** | SendGrid | Latest | Email delivery service |
| | AWS SES | Alternative | AWS-native email |
| **Container** | Docker | Latest | Containerization |
| | Kubernetes | 1.28+ | Container orchestration |
| **Cloud** | AWS / GCP | - | Scalable cloud infrastructure |
| | Vercel | - | Frontend hosting |
| **Monitoring** | Prometheus | Latest | Metrics collection |
| | Grafana | Latest | Visualization |
| | Sentry | Latest | Error tracking |
| | ELK Stack | Latest | Log aggregation |

---

## 7. Data Requirements

### 7.1 Data Entities

#### User Entity
```
user {
  id: UUID (PK)
  email: String (unique, indexed)
  password_hash: String (nullable for OAuth)
  name: String
  avatar_url: String (nullable)
  auth_provider: Enum [EMAIL, GOOGLE]
  google_id: String (nullable, unique)
  status: Enum [UNVERIFIED, VERIFIED, SUSPENDED, DELETED]
  email_verified_at: Timestamp (nullable)
  verification_token: String (nullable)
  verification_token_expires_at: Timestamp (nullable)
  timezone: String (default: "Asia/Jakarta")
  language: Enum [EN, ID] (default: EN)
  theme: Enum [LIGHT, DARK, SYSTEM] (default: SYSTEM)
  subscription_tier: Enum [FREE, PRO, ENTERPRISE] (default: FREE)
  subscription_expires_at: Timestamp (nullable)
  created_at: Timestamp
  updated_at: Timestamp
  last_login_at: Timestamp (nullable)
}
```

#### Watchlist Entity
```
watchlist {
  id: UUID (PK)
  user_id: UUID (FK → user.id)
  name: String
  is_default: Boolean (default: false)
  created_at: Timestamp
  updated_at: Timestamp
}
```

#### WatchlistItem Entity
```
watchlist_item {
  id: UUID (PK)
  watchlist_id: UUID (FK → watchlist.id)
  symbol: String (e.g., "AAPL", "BBCA.JK")
  exchange: Enum [NYSE, NASDAQ, IDX]
  added_at: Timestamp
  order_index: Integer
}
```

#### StockPrice (Time-Series in InfluxDB)
```
stock_price {
  measurement: "stock_price"
  tags:
    - symbol: String
    - exchange: String
    - market: String [US, ID]
  fields:
    - open: Float
    - high: Float
    - low: Float
    - close: Float
    - volume: Integer
    - adjusted_close: Float
  timestamp: Timestamp (nanosecond precision)
}
```

#### SimulatedOrder Entity
```
simulated_order {
  id: UUID (PK)
  user_id: UUID (FK → user.id)
  symbol: String
  exchange: Enum [NYSE, NASDAQ, IDX]
  order_type: Enum [MARKET, LIMIT, STOP_LOSS, TAKE_PROFIT, OCO]
  side: Enum [BUY, SELL]
  quantity: Integer
  price: Decimal (nullable for market orders)
  stop_price: Decimal (nullable)
  status: Enum [PENDING, FILLED, CANCELLED, REJECTED, EXPIRED]
  filled_price: Decimal (nullable)
  filled_at: Timestamp (nullable)
  fee: Decimal
  slippage: Decimal
  created_at: Timestamp
  expires_at: Timestamp (nullable)
}
```

#### SimulatedPortfolio Entity
```
simulated_portfolio {
  id: UUID (PK)
  user_id: UUID (FK → user.id)
  currency: Enum [USD, IDR]
  cash_balance: Decimal
  total_value: Decimal
  total_invested: Decimal
  total_return: Decimal
  total_return_pct: Decimal
  created_at: Timestamp
  updated_at: Timestamp
}
```

#### PortfolioHolding Entity
```
portfolio_holding {
  id: UUID (PK)
  portfolio_id: UUID (FK → simulated_portfolio.id)
  symbol: String
  exchange: Enum [NYSE, NASDAQ, IDX]
  quantity: Integer
  average_cost: Decimal
  current_price: Decimal
  market_value: Decimal
  unrealized_pnl: Decimal
  unrealized_pnl_pct: Decimal
  updated_at: Timestamp
}
```

#### Alert Entity
```
alert {
  id: UUID (PK)
  user_id: UUID (FK → user.id)
  name: String
  symbol: String (nullable for portfolio alerts)
  alert_type: Enum [PRICE_TARGET, PERCENTAGE_CHANGE, VOLUME_SPIKE, 
                    TECHNICAL_BREAK, AI_TREND_REVERSAL, AI_RISK_WARNING,
                    NEWS_SENTIMENT, AI_PRICE_PREDICTION, CORRELATION_ALERT,
                    EARNINGS_ALERT]
  condition: JSONB (flexible condition structure)
  notification_channels: Array<Enum [IN_APP, EMAIL, PUSH, SMS, WEBHOOK]>
  is_active: Boolean (default: true)
  triggered_count: Integer (default: 0)
  last_triggered_at: Timestamp (nullable)
  cooldown_minutes: Integer (default: 60)
  expires_at: Timestamp (nullable)
  created_at: Timestamp
  updated_at: Timestamp
}
```

#### NewsArticle Entity
```
news_article {
  id: UUID (PK)
  source: String
  source_url: String
  title: String
  content: Text (nullable)
  summary: Text (nullable)
  published_at: Timestamp
  fetched_at: Timestamp
  sentiment_score: Float (-1 to 1)
  sentiment_confidence: Float (0 to 1)
  impact_score: Integer (1-10, nullable)
  related_symbols: Array<String>
  related_sectors: Array<String>
  category: Enum [EARNINGS, MERGER, REGULATION, MACRO, SECTOR, GENERAL]
  language: Enum [EN, ID]
  is_breaking: Boolean (default: false)
  content_hash: String (unique, for deduplication)
  created_at: Timestamp
}
```

#### AIAnalysis Entity
```
ai_analysis {
  id: UUID (PK)
  symbol: String
  exchange: Enum [NYSE, NASDAQ, IDX]
  signal: Enum [STRONG_BUY, BUY, HOLD, SELL, STRONG_SELL]
  confidence: Integer (0-100)
  risk_score: Integer (0-100)
  time_horizon: Enum [SHORT, MEDIUM, LONG]
  target_price: Decimal (nullable)
  stop_loss: Decimal (nullable)
  reasoning: JSONB (structured explanation)
  key_factors: JSONB (top contributing factors)
  model_version: String
  predicted_return_1d: Decimal (nullable)
  predicted_return_5d: Decimal (nullable)
  predicted_return_30d: Decimal (nullable)
  created_at: Timestamp
}
```

### 7.2 Data Retention Policy

| Data Type | Retention Period | Storage |
|-----------|-----------------|---------|
| User data | Until account deletion + 30 days | PostgreSQL |
| Stock prices (1m) | 30 days | InfluxDB |
| Stock prices (5m) | 90 days | InfluxDB |
| Stock prices (1h+) | 5 years | InfluxDB + S3 |
| News articles | 2 years | PostgreSQL + Elasticsearch |
| Simulation orders | 2 years | PostgreSQL |
| AI analysis | 1 year | PostgreSQL |
| Alert logs | 1 year | PostgreSQL |
| System logs | 90 days | ELK Stack |

---

## 8. UI/UX Requirements

### 8.1 Design Principles

| Principle | Description |
|-----------|-------------|
| **Clarity** | Financial data presented clearly with appropriate visual hierarchy |
| **Speed** | Sub-second interactions, instant feedback |
| **Consistency** | Unified design language across all features |
| **Accessibility** | WCAG 2.1 AA compliance minimum |
| **Responsiveness** | Fully functional on desktop, tablet, and mobile |
| **Dark Mode** | Native dark mode support for extended trading sessions |

### 8.2 Key Screens

#### 8.2.1 Authentication Screens

| Screen | Description | Key Elements |
|--------|-------------|--------------|
| Landing Page | Marketing page with preview | Hero section, feature highlights, market preview (delayed) |
| Registration | Email/Google signup | Form fields, OAuth button, T&C checkbox |
| Login | Account access | Email/password, Google OAuth, forgot password link |
| Verification Pending | Post-registration | Status message, resend button, email guidance |
| Verification Success | Post-click | Success animation, redirect to login |

#### 8.2.2 Dashboard Screens

| Screen | Description | Key Elements |
|--------|-------------|--------------|
| Main Dashboard | User home | Market overview, watchlist, alerts, news ticker |
| Stock Detail | Individual stock view | Chart (full screen), AI analysis, news, order panel |
| Watchlist Manager | CRUD operations | List view, add/remove, reorder, AI suggestions |
| Portfolio | Simulation view | Holdings table, P&L chart, allocation, history |
| News Hub | News browsing | Filterable feed, sentiment colors, trending topics |
| Alerts Center | Alert management | Active alerts, trigger history, create new |
| Settings | User preferences | Profile, notifications, display, subscription |

### 8.3 Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | <640px | Single column, bottom nav, stacked charts |
| Tablet | 640-1024px | Two columns, sidebar nav, split view |
| Desktop | >1024px | Full layout, multi-panel, side-by-side charts |

### 8.4 Color System

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| Primary | #2563EB | #3B82F6 | Buttons, links, active states |
| Success | #10B981 | #34D399 | Price up, buy signals, positive |
| Danger | #EF4444 | #F87171 | Price down, sell signals, negative |
| Warning | #F59E0B | #FBBF24 | Alerts, cautions |
| Background | #FFFFFF | #0F172A | Main background |
| Surface | #F8FAFC | #1E293B | Cards, panels |
| Text Primary | #1E293B | #F1F5F9 | Headings, primary text |
| Text Secondary | #64748B | #94A3B8 | Labels, secondary text |

---

## 9. Security & Compliance

### 9.1 Authentication Security

| Requirement | Implementation |
|-------------|----------------|
| Password Policy | Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char |
| Brute Force Protection | 5 failed attempts = 15-minute lockout |
| Session Management | JWT with 15-min access, 7-day refresh |
| Token Rotation | Refresh tokens rotated on each use |
| Logout | Immediate token invalidation |
| OAuth Security | PKCE for mobile, state parameter validation |

### 9.2 Data Protection

| Requirement | Implementation |
|-------------|----------------|
| Encryption at Rest | AES-256 for all databases |
| Encryption in Transit | TLS 1.3 minimum |
| PII Handling | Masked in logs, encrypted in DB |
| API Security | Rate limiting, input validation, parameterized queries |
| File Upload | Type validation, size limits, virus scanning |

### 9.3 Compliance Checklist

| Regulation | Requirement | Status |
|------------|-------------|--------|
| GDPR | Right to access, rectification, erasure, portability | Required |
| GDPR | Data Processing Agreement with providers | Required |
| Indonesia PDP | Consent management, data localization | Required |
| CCPA | Opt-out of data sale, disclosure requirements | Required |
| SOC 2 | Security, availability, confidentiality controls | Future |

---

## 10. API Specifications

### 10.1 Authentication Endpoints

```
POST /api/v1/auth/register
  Body: { email, password, name }
  Response: { user_id, message: "Verification email sent" }

POST /api/v1/auth/login
  Body: { email, password }
  Response: { access_token, refresh_token, user }

POST /api/v1/auth/google
  Body: { id_token }
  Response: { access_token, refresh_token, user }

GET /api/v1/auth/verify-email
  Query: { token }
  Response: { message: "Email verified successfully" }

POST /api/v1/auth/resend-verification
  Body: { email }
  Response: { message: "Verification email sent" }

POST /api/v1/auth/refresh
  Body: { refresh_token }
  Response: { access_token }

POST /api/v1/auth/logout
  Headers: { Authorization: Bearer <token> }
  Response: { message: "Logged out successfully" }
```

### 10.2 Stock Data Endpoints

```
GET /api/v1/stocks/search
  Query: { q: string, market?: "US" | "ID", limit?: number }
  Response: { stocks: [{ symbol, name, exchange, market, price, change_pct }] }

GET /api/v1/stocks/:symbol
  Headers: { Authorization: Bearer <token> }
  Response: { symbol, name, exchange, market, current_price, change, change_pct, 
              open, high, low, close, volume, market_cap, pe_ratio, 
              ai_analysis: { signal, confidence, risk_score } }

GET /api/v1/stocks/:symbol/history
  Query: { timeframe: "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w" | "1m",
           from: ISO8601, to: ISO8601 }
  Response: { data: [{ timestamp, open, high, low, close, volume }] }

GET /api/v1/stocks/:symbol/indicators
  Query: { indicators: "rsi,macd,bb", timeframe: string, period?: number }
  Response: { rsi: [...], macd: { macd_line: [...], signal_line: [...], histogram: [...] }, 
              bb: { upper: [...], middle: [...], lower: [...] } }
```

### 10.3 WebSocket Events

```
Connection: wss://api.stockvision.ai/socket.io

Client → Server:
  subscribe:stock { symbol, exchange }
  unsubscribe:stock { symbol }
  subscribe:portfolio { portfolio_id }
  subscribe:alerts { user_id }

Server → Client:
  stock:update { symbol, price, change, change_pct, volume, timestamp }
  stock:ohlc { symbol, timeframe, open, high, low, close, volume, timestamp }
  alert:triggered { alert_id, symbol, message, timestamp }
  news:breaking { article_id, title, summary, sentiment, related_symbols }
  portfolio:update { portfolio_id, total_value, total_return, holdings: [...] }
```

### 10.4 Simulation Endpoints

```
POST /api/v1/simulation/orders
  Body: { symbol, exchange, side, order_type, quantity, price?, stop_price? }
  Response: { order_id, status, filled_price?, fee, slippage, executed_at? }

GET /api/v1/simulation/portfolio
  Response: { portfolio_id, currency, cash_balance, total_value, total_return, 
              total_return_pct, holdings: [...], performance_metrics }

GET /api/v1/simulation/orders
  Query: { status?, symbol?, from?, to?, limit?, offset? }
  Response: { orders: [...], total, page, limit }

POST /api/v1/simulation/backtest
  Body: { strategy: {...}, symbol, from, to, initial_balance }
  Response: { backtest_id, results: { total_return, sharpe_ratio, max_drawdown, 
                                      trades: [...], equity_curve: [...] } }
```

### 10.5 Alert Endpoints

```
POST /api/v1/alerts
  Body: { name, symbol?, alert_type, condition, notification_channels, 
          cooldown_minutes?, expires_at? }
  Response: { alert_id, status: "created" }

GET /api/v1/alerts
  Query: { status?, symbol?, alert_type?, limit?, offset? }
  Response: { alerts: [...], total }

PATCH /api/v1/alerts/:id
  Body: { is_active?, condition?, notification_channels? }
  Response: { alert_id, updated_fields }

DELETE /api/v1/alerts/:id
  Response: { message: "Alert deleted" }

GET /api/v1/alerts/history
  Query: { alert_id?, from?, to?, limit?, offset? }
  Response: { history: [{ id, alert_id, triggered_at, data, notification_status }] }
```

### 10.6 News Endpoints

```
GET /api/v1/news
  Query: { q?, symbols?, sentiment?, category?, from?, to?, limit?, offset? }
  Response: { articles: [{ id, source, title, summary, sentiment_score, 
                          impact_score, published_at, related_symbols }], total }

GET /api/v1/news/:id
  Response: { id, source, source_url, title, content, summary, sentiment_score,
              sentiment_confidence, impact_score, related_symbols, published_at }

GET /api/v1/news/trending
  Query: { timeframe?: "1h" | "24h" | "7d", limit?: number }
  Response: { topics: [{ topic, article_count, avg_sentiment, top_article }] }
```

---

## 11. Success Metrics & KPIs

### 11.1 User Acquisition

| Metric | Target (Month 1) | Target (Month 6) | Target (Month 12) |
|--------|-------------------|-------------------|-------------------|
| Registered Users | 5,000 | 50,000 | 100,000 |
| Verified Users | 3,500 (70%) | 40,000 (80%) | 85,000 (85%) |
| MAU | 2,000 | 15,000 | 40,000 |
| DAU | 500 | 5,000 | 15,000 |
| Organic Traffic | 30% of total | 50% of total | 60% of total |

### 11.2 Engagement

| Metric | Target | Measurement |
|--------|--------|-------------|
| Avg Session Duration | >10 minutes | Analytics |
| Sessions per User per Week | >3 | Analytics |
| Watchlist Stocks per User | >5 | Database |
| Alerts Created per User | >2 | Database |
| Simulation Trades per Active User | >10/month | Database |
| News Articles Read per Session | >3 | Analytics |

### 11.3 AI Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Price Prediction Accuracy (1-day) | >65% | Backtesting |
| Price Prediction Accuracy (5-day) | >60% | Backtesting |
| Sentiment Analysis Accuracy | >80% | Labeled test set |
| Pattern Recognition Accuracy | >75% | Expert validation |
| Alert Relevance (user engagement) | >40% open rate | Email analytics |

### 11.4 Technical Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response Time (p95) | <200ms | APM |
| WebSocket Latency | <500ms | Monitoring |
| Uptime | 99.9% | Monitoring |
| Error Rate | <0.1% | Error tracking |
| Page Load Time (FCP) | <2s | Lighthouse |

### 11.5 Business Metrics

| Metric | Target (Month 6) | Target (Month 12) |
|--------|-------------------|-------------------|
| Free to Pro Conversion | 3% | 5% |
| Pro Subscribers | 1,200 | 4,250 |
| MRR (Monthly Recurring Revenue) | $24,000 | $85,000 |
| Churn Rate (Pro) | <10%/month | <5%/month |
| NPS Score | >30 | >50 |

---

## 12. Roadmap & Milestones

### Phase 1: Foundation (Weeks 1-8)

| Week | Milestone | Deliverables |
|------|-----------|-------------|
| 1-2 | Project Setup | Repo, CI/CD, dev environment, architecture finalization |
| 2-4 | Authentication | Registration, login, email verification, Google OAuth |
| 4-6 | Data Pipeline | Yahoo Finance integration, IDX data source, InfluxDB setup |
| 6-8 | Basic Charting | Candlestick + line charts, timeframes, basic indicators |

### Phase 2: Core Features (Weeks 9-16)

| Week | Milestone | Deliverables |
|------|-----------|-------------|
| 9-10 | Advanced Charting | All chart types, drawing tools, multi-chart sync |
| 10-12 | Simulation Engine | Virtual portfolio, order types, transaction history |
| 12-14 | Watchlist & Dashboard | Watchlist CRUD, main dashboard, portfolio overview |
| 14-16 | Alert System | Basic alerts (price, volume), email notifications |

### Phase 3: Intelligence (Weeks 17-24)

| Week | Milestone | Deliverables |
|------|-----------|-------------|
| 17-18 | News Aggregation | RSS/API integration, deduplication, basic display |
| 18-20 | AI Sentiment | NLP models, news sentiment scoring, sentiment overlay |
| 20-22 | AI Technical Analysis | Pattern recognition, indicator interpretation |
| 22-24 | AI Predictions | Price prediction models, risk scoring, AI dashboard |

### Phase 4: Polish & Scale (Weeks 25-32)

| Week | Milestone | Deliverables |
|------|-----------|-------------|
| 25-26 | Advanced Alerts | AI-powered alerts, all notification channels |
| 26-28 | Backtesting | Strategy builder, historical backtesting, performance reports |
| 28-30 | Mobile App | React Native app with core features |
| 30-32 | Performance | Load testing, optimization, monitoring, documentation |

### Phase 5: Launch & Iterate (Weeks 33+)

| Week | Milestone | Deliverables |
|------|-----------|-------------|
| 33-34 | Beta Launch | Closed beta with 1,000 users, feedback collection |
| 34-36 | Public Launch | Marketing launch, PR, influencer partnerships |
| 36+ | Continuous | Feature iterations, AI model improvements, user feedback |

---

## 13. Appendix

### 13.1 Glossary

| Term | Definition |
|------|-----------|
| **OHLC** | Open, High, Low, Close — price data points |
| **RSI** | Relative Strength Index — momentum oscillator |
| **MACD** | Moving Average Convergence Divergence — trend indicator |
| **VWAP** | Volume Weighted Average Price |
| **OCO** | One-Cancels-Other — combined order type |
| **P&L** | Profit and Loss |
| **MAU** | Monthly Active Users |
| **DAU** | Daily Active Users |
| **MRR** | Monthly Recurring Revenue |
| **NPS** | Net Promoter Score |

### 13.2 Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Data provider API changes | Medium | High | Multiple provider fallback, abstraction layer |
| AI model inaccuracy | Medium | High | Continuous training, human oversight, disclaimers |
| Regulatory changes | Low | High | Legal review, compliance monitoring |
| Scalability issues | Medium | Medium | Load testing, auto-scaling, caching |
| Security breach | Low | Critical | Security audits, penetration testing, encryption |
| User adoption low | Medium | High | Marketing strategy, freemium model, UX optimization |

### 13.3 Dependencies

| Dependency | Type | Criticality |
|-----------|------|-------------|
| Yahoo Finance API | Data Source | High |
| IDX Data Provider | Data Source | High |
| SendGrid / AWS SES | Email Service | High |
| Firebase Auth / Auth0 | Authentication | High |
| Google OAuth | Authentication | High |
| Cloud Infrastructure (AWS/GCP) | Hosting | High |
| TradingView Charting Library | UI Component | Medium |

### 13.4 Open Questions

1. What is the budget for third-party data providers (Yahoo Finance Pro, IEX Cloud)?
2. Will there be a mobile app in Phase 1, or is it deferred to Phase 4?
3. What is the expected user load at launch (concurrent users)?
4. Are there specific Indonesian regulatory requirements for financial platforms?
5. What is the timeline for SOC 2 compliance?
6. Should the platform support cryptocurrency tracking in addition to stocks?
7. What is the preferred payment gateway for subscription billing?

---

**Document End**

*This PRD is a living document. All stakeholders should review and provide feedback. Changes require approval from the Product Lead.*
