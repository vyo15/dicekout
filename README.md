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

## Menjalankan project

```bash
npm ci --prefix frontend
npm run dev
```

Build dan seluruh pemeriksaan:

```bash
npm run check
```

Hasil build berada di `frontend/dist/`.

## Data yang harus diganti sebelum publikasi

1. Ganti produk contoh di `frontend/src/data/products.json`.
2. Masukkan gambar produk berizin ke `frontend/public/images/products/`.
3. Isi link affiliate secara utuh tanpa menghapus referral code atau query parameter.
4. Ubah koleksi dan kategori agar sesuai dengan produk nyata.
5. Ubah `catalogMode` menjadi `live` dan `allowIndexing` menjadi `true` pada `frontend/src/data/site.json` hanya setelah seluruh data demo dihapus.
6. Tinjau kembali disclosure dan privacy sebelum website diindeks.

Validator akan menolak build bila indexing diaktifkan sementara masih ada produk atau koleksi dengan `demo: true`.

Dokumentasi pengelolaan katalog: [`docs/CATALOG_GUIDE.md`](docs/CATALOG_GUIDE.md)  
Panduan GitHub Pages: [`docs/GITHUB_PAGES.md`](docs/GITHUB_PAGES.md)
