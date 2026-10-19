# 💸 ARCANA FINANCE

Pencatat keuangan bertema **Persona 5** — setiap kategori pengeluaran adalah sebuah **Arcana** dengan budget bulanannya sendiri. Dibangun dengan **HTML, CSS, JavaScript + Chart.js** (via CDN), **100% statis** sehingga langsung bisa di-host di **GitHub Pages**. Data tersimpan di **localStorage** dalam format Rupiah (IDR).

> Proyek fan-inspired. Tidak berafiliasi dengan ATLUS/SEGA.

## ✨ Fitur

- **Catat pemasukan & pengeluaran** — nominal, kategori Arcana, catatan, tanggal
- **8 kategori Arcana** — The Empress (makanan), The Chariot (transport), The Sun (hiburan), The Moon (langganan), The Magician (belajar), The Star (tabungan), The Tower (darurat), The Fool (lainnya)
- **Budget per kategori** — bisa diubah langsung, progress bar berubah jadi pola peringatan saat jebol
- **"THE TOWER HAS FALLEN!"** — animasi starburst saat sebuah kategori baru saja melewati budget
- **3 grafik interaktif (Chart.js)**:
  - Doughnut — komposisi pengeluaran per Arcana
  - Bar — pengeluaran harian 7 hari terakhir
  - Line — tren saldo kumulatif sepanjang bulan
- **Navigasi bulan** — lihat & kelola histori per bulan
- **Ringkasan** — total pemasukan, pengeluaran, dan saldo bulan berjalan

## 🚀 Cara menjalankan lokal

```bash
cd arcana-finance
python3 -m http.server 8000
# buka http://localhost:8000
```

> Grafik memakai Chart.js dari CDN, jadi butuh koneksi internet saat pertama dimuat.

## 🌐 Deploy ke GitHub Pages

1. Buat repo baru di GitHub (misal `arcana-finance`)
2. Push semua file ini ke branch `main`
3. Buka **Settings → Pages** → Source: **Deploy from a branch** → Branch: `main` / folder `/ (root)`
4. Tunggu ~1 menit, situs live di `https://<username>.github.io/arcana-finance/`

## 📁 Struktur

```
arcana-finance/
├── index.html      # markup utama
├── css/
│   └── style.css   # tema Phantom Thieves (merah/hitam, starburst, halftone)
├── js/
│   └── app.js      # state, budget, render, integrasi Chart.js (vanilla JS)
└── README.md
```

## 🗺️ Roadmap — versi PHP + MySQL

Struktur data sudah rapi (`txs`, `budgets`) sehingga mudah dipindah ke backend:

- [ ] **API PHP** (`api/transactions.php`, `api/budgets.php`) — ganti `localStorage` dengan `fetch()`
- [ ] **MySQL** — tabel `transactions` & `budgets`, sinkron antar-device + login
- [ ] Ekspor laporan bulanan (PDF/CSV)
- [ ] Target tabungan (The Star) dengan progress khusus
