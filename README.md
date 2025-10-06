# BrustOne

Landing page dan aplikasi dompet BrustCoin modern berbasis HTML, CSS, dan JavaScript.

## Fitur utama

- **Halaman login futuristik** dengan kartu glassmorphism, notifikasi toast modern, dan CTA terintegrasi.
- **Dashboard interaktif** berisi ringkasan saldo BrustCoin, konversi IDR ↔ BRC, grafik performa 30 hari, dan riwayat transaksi dinamis.
- **Halaman profil lengkap** untuk memperbarui data personal, preferensi keamanan, serta manajemen perangkat tersambung.
- **Integrasi Midtrans (demo)** dengan pemanggilan Snap API dan simulasi token sehingga mudah disambungkan ke backend produksi.
- **Manajemen state lokal** memakai `localStorage` agar data login, kurs, dan riwayat transaksi tetap tersimpan selama sesi browser.

## Cara menjalankan

Karena proyek ini berupa front-end statis, cukup buka file `index.html` melalui Live Server/serving statis favorit kamu:

```bash
# contoh dengan python
python -m http.server 8000
```

Lalu akses `http://localhost:8000` di browser.

## Konfigurasi Midtrans

1. Ganti `MIDTRANS_CLIENT_KEY` di atribut `data-client-key` pada `dashboard.html` dengan Client Key milikmu.
2. Sediakan endpoint backend untuk membuat Snap Transaction Token lalu ubah fungsi `requestSnapToken` di `js/app.js` agar memanggil endpoint tersebut.
3. Setelah token diterima, Midtrans Snap akan otomatis terbuka dan callback `onSuccess`, `onPending`, `onError`, serta `onClose` sudah ditangani untuk memperbarui riwayat transaksi.

## Struktur proyek

```
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── dashboard.js
│   └── profile.js
├── dashboard.html
├── index.html
└── profile.html
```

Selamat mengelola BrustCoin dengan BrustOne Wallet! 💎
