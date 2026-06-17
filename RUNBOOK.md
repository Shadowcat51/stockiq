# StockIQ Runbook

Panduan ini berisi langkah-langkah untuk menjalankan *project* StockIQ secara lokal (Development Mode) di mesin Windows Anda.

## Prasyarat Utama
Pastikan aplikasi berikut sudah terinstall di komputer Anda:
- **Node.js** (rekomendasi: v18 atau v20)
- **Docker Desktop** (harus berjalan/aktif saat ingin menjalankan aplikasi)

---

## 1. Menjalankan Layanan Infrastruktur (Database & Kafka)

Aplikasi StockIQ membutuhkan **PostgreSQL** dan **Kafka** yang berjalan melalui Docker.

1. Buka Terminal/PowerShell.
2. Arahkan ke folder utama *project* (`D:\Projek\stockiq`).
3. Jalankan perintah berikut untuk mengunduh dan menyalakan *containers*:
   ```bash
   docker-compose up -d
   ```
4. *Docker* akan menyalakan PostgreSQL di port `5433` (disesuaikan untuk menghindari konflik dengan PostgreSQL bawaan Windows) dan Kafka.

---

## 2. Menjalankan Backend (Auth Service)

Backend ini menangani autentikasi JWT dan OAuth Google.

1. Buka Terminal/PowerShell **baru** (Terminal ke-2).
2. Pindah ke direktori `auth-service`:
   ```bash
   cd D:\Projek\stockiq\backend\auth-service
   ```
3. Install semua dependensi (jika belum pernah):
   ```bash
   npm install
   ```
4. Pastikan file `.env` sudah ada dan dikonfigurasi (lihat di Walkthrough untuk detail pengisian akun SMTP Email & Google API).
5. Jalankan *backend*:
   ```bash
   npm run dev
   ```
6. Anda akan melihat log bahwa server berhasil berjalan di port `4001` dan terkoneksi ke Database & Kafka.

> **Peringatan (Troubleshooting Error):** 
> Jika Anda menjumpai pesan error `EADDRINUSE: address already in use :::4001`, artinya port tersebut sedang digunakan (biasanya oleh terminal Anda sebelumnya yang *crash* tapi prosesnya belum mati). 
> **Cara Mengatasinya di PowerShell Windows:**
> ```powershell
> $proc = Get-NetTCPConnection -LocalPort 4001 -State Listen -ErrorAction SilentlyContinue; if ($proc) { Stop-Process -Id $proc.OwningProcess -Force }
> ```
> Lalu jalankan ulang `npm run dev`.

---

## 3. Menjalankan Frontend (Next.js Web)

Web aplikasi ini berjalan di React / Next.js.

1. Buka Terminal/PowerShell **baru** (Terminal ke-3).
2. Pindah ke direktori `web`:
   ```bash
   cd D:\Projek\stockiq\web
   ```
3. Install dependensi (hanya perlu dilakukan sekali):
   ```bash
   npm install
   ```
4. Jalankan *frontend*:
   ```bash
   npm run dev
   ```
5. Buka Browser dan akses: **`http://localhost:3000`**

*(Catatan: Warning Next.js tentang "middleware to proxy" atau "multiple lockfiles" yang muncul di terminal adalah hal yang wajar dan aman diabaikan, namun sudah kami perbaiki untuk meminimalisir log warning).*

---

### Skenario Singkat Berhentikan Aplikasi

Jika Anda sudah selesai bekerja dan ingin mematikan semua layanan:
1. Tekan `Ctrl + C` di terminal *Backend* dan *Frontend* untuk mematikan *server* Node.js.
2. Di terminal utama, jalankan perintah ini untuk mematikan Docker containers agar tidak memakan RAM Anda:
   ```bash
   docker-compose down
   ```
