# StockIQ Web Application Development Checklist

Berdasarkan Product Requirements Document (PRD), berikut adalah checklist pembuatan web aplikasi StockIQ beserta status pengerjaannya saat ini.

## 1. Setup & Infrastruktur
- [x] Inisialisasi proyek Next.js dengan App Router
- [x] Setup TypeScript & Tailwind CSS
- [x] Setup Backend Services (Node.js / Python)
- [x] Setup Database (PostgreSQL, Redis, dll.)
- [x] Setup Message Queue (Kafka)

## 2. Landing Page (UI/UX)
- [x] Hero Section Component
- [x] Market Ticker Component (UI)
- [x] Features Section Component
- [x] Testimonials Section Component
- [x] Footer Component
- [x] Rakit komponen di halaman utama (`app/page.tsx`)

## 3. User Authentication & Verification (Fitur 4.1)
- [x] UI/UX Halaman Registrasi & Login
- [x] Fitur Pendaftaran Email & Password
- [x] Integrasi Google OAuth 2.0
- [x] Sistem Verifikasi Email
- [x] Manajemen Sesi (JWT Tokens)
- [x] Flow Lupa Password & Reset
- [-] Halaman Pengaturan Akun

## 4. Real-Time Stock Charting (Fitur 4.2)
- [x] Integrasi Data Provider (Market Data API)
- [x] Setup WebSocket untuk Data Real-Time
- [x] Pembuatan Chart Interaktif (TradingView / Lightweight Charts)
- [x] Fitur Pilihan Timeframe (1m, 5m, 1h, 1D, dll.)
- [x] Indikator Teknikal (SMA, EMA, RSI, MACD, dll.)
- [x] Drawing Tools untuk Analisa

## 5. Buy/Sell Simulation Engine (Fitur 4.3)
- [ ] Setup Virtual Portfolio (Saldo USD & IDR)
- [ ] Sistem Order (Market, Limit, Stop Loss, Take Profit)
- [ ] Halaman Portfolio Overview & Riwayat Transaksi
- [ ] Perhitungan Fee, Slippage, & Aturan Trading Virtual
- [ ] Fitur Backtesting & Strategy Builder

## 6. AI-Powered Alert System (Fitur 4.4)
- [ ] Pembuatan Engine Notifikasi Alert
- [ ] Fitur Konfigurasi Alert (Target Harga, Volume, Sinyal AI)
- [ ] Channel Notifikasi (In-App Popups, Email)
- [ ] Sistem Evaluasi Risiko Berbasis AI (Risk Assessment Model)

## 7. Real-Time Financial News Hub (Fitur 4.5)
- [ ] Pipeline Agregator Berita (Web Scraping / API Berita)
- [ ] Filter Berita Berdasarkan Watchlist
- [ ] Analisis Sentimen Berita dengan AI (NLP)
- [ ] UI Feed Berita Real-Time

## 8. AI Analysis Engine (Fitur 4.6)
- [ ] Pengembangan Model Technical Analysis AI (Pengenalan Pola)
- [ ] Pengembangan Model Fundamental Analysis AI (Prediksi Laba)
- [ ] Pengembangan Model Predictive (Short-term & Medium-term)
- [ ] UI Dashboard Rekomendasi & Sinyal AI (Buy/Hold/Sell)

## 9. User Dashboard & Portfolio (Fitur 4.7)
- [x] Halaman Dashboard Utama User
- [ ] Manajemen Watchlist Saham
- [x] Widget Market Overview & Top Movers
- [ ] Personalisasi Tema & Tampilan

---

### Kesimpulan (Apa yang sudah dilakukan):
Sejauh ini, proyek telah menyelesaikan **Tahap Inisialisasi Frontend**, pembuatan **Landing Page Statis**, dan **Setup Infrastruktur Backend Dasar**.

Komponen UI utama untuk Landing Page seperti `HeroSection`, `MarketTicker`, `FeaturesSection`, `TestimonialsSection`, dan `Footer` sudah dibuat menggunakan React/Next.js dan Tailwind CSS. 
Untuk Backend, konfigurasi `docker-compose` telah disiapkan yang mencakup PostgreSQL, Redis, Kafka, InfluxDB, dan Elasticsearch, beserta kontainerisasi untuk `auth-service` dan `stock-service`.

Seluruh fungsi inti seperti *Authentication*, *Charting Data Real-time*, *Simulasi Trading*, dan *Analisis AI* menjadi target pengerjaan berikutnya berdasarkan infrastruktur yang telah disiapkan.
