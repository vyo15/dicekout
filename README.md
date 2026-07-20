# DicekOut

DicekOut adalah website katalog rekomendasi produk affiliate yang dibuat sebagai aplikasi statis React/Vite dan disiapkan untuk GitHub Pages.

## Status source

- Brand kerja: **DicekOut**
- Domain rencana: **dicekout.id**
- Mode katalog awal: **demo**
- Indexing mesin pencari: **nonaktif** sampai data contoh diganti
- Database/backend: **tidak digunakan pada MVP**
- Checkout/pembayaran internal: **tidak tersedia**

## Struktur utama

```text
frontend/
├── public/                  aset publik dan ilustrasi produk lokal
├── scripts/                 validasi katalog dan generator route statis
└── src/
    ├── components/          komponen layout, katalog, SEO, dan feedback
    ├── config/              konfigurasi URL/base path
    ├── data/                produk, kategori, koleksi, dan site config
    ├── pages/               halaman publik
    ├── styles/              style responsif
    └── utils/               selector katalog dan validasi URL runtime
```

## Instalasi pertama

Dari folder utama project, jalankan satu perintah:

```bash
npm install
```

Project memakai npm workspaces, sehingga perintah tersebut memasang dependency website dan Local Catalog Manager sekaligus tanpa script setup tambahan. Setelah selesai:

```bash
npm run dev
```

Panel lokal hanya dijalankan dengan:

```bash
npm run management
```

Build dan seluruh pemeriksaan unit/static:

```bash
npm run check
```

Setelah Chromium Playwright terpasang, jalankan user journey production:

```bash
npx playwright install chromium
npm run test:e2e
```

Hasil build berada di `frontend/dist/`. Artifact `playwright-report/` dan `test-results/` bersifat lokal dan tidak boleh masuk source.

## Data yang harus diganti sebelum publikasi

1. Ganti produk contoh di `frontend/src/data/products.json`.
2. Masukkan gambar produk berizin ke `frontend/public/images/products/`.
3. Buat link melalui akun/program affiliate resmi marketplace; jangan memakai URL produk biasa atau menambahkan parameter affiliate buatan sendiri.
4. Untuk Shopee, gunakan short link/wrapper resmi HTTPS dan pastikan klik tercatat pada Laporan Performa akun Anda.
5. Daftarkan `dicekout.id` sebagai media promosi pada program affiliate terkait bila diwajibkan.
6. Ubah koleksi dan kategori agar sesuai dengan produk nyata.
7. Ubah `catalogMode` menjadi `live` dan `allowIndexing` menjadi `true` pada `frontend/src/data/site.json` hanya setelah seluruh data demo dihapus.
8. Tinjau kembali disclosure dan privacy sebelum website diindeks.

Validator akan menolak build bila indexing diaktifkan sementara masih ada produk atau koleksi dengan `demo: true`.

Dokumentasi pengelolaan katalog: [`docs/CATALOG_GUIDE.md`](docs/CATALOG_GUIDE.md)  
Panduan GitHub Pages: [`docs/GITHUB_PAGES.md`](docs/GITHUB_PAGES.md)
