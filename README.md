# DicekOut

DicekOut adalah website katalog rekomendasi produk affiliate berbasis React/Vite. Pengunjung menemukan produk, membuka detail, lalu menuju marketplace melalui link affiliate asli. Website tidak menyediakan checkout atau pembayaran internal.

## Status source

- Brand: **DicekOut**
- Domain target: **dicekout.id**
- Katalog awal: **demo**
- Indexing: **nonaktif** sampai seluruh data contoh diganti
- Website publik: **statis**
- Catalog Manager: **lokal di `127.0.0.1`**
- Analytics/click tracker: **belum dipasang**

## Struktur utama

```text
frontend/                    website publik, data katalog, route, SEO, dan static build
tools/catalog-manager/       panel lokal authoring, media, backup, rollback, dan hard delete
scripts/                     validasi source dan clean archive
docs/                        arsitektur, kontrak katalog, operasi, QA, dan deployment
```

Detail module dan data flow: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Instalasi pertama

Gunakan Node.js `20.19+` atau `22.12+` dan npm `10+`. Dari root project:

```bash
npm install
```

Satu perintah tersebut memasang dependency frontend dan Catalog Manager melalui npm workspaces.

Menjalankan website:

```bash
npm run dev
```

Menjalankan panel lokal:

```bash
npm run management
```

## Quality gate

```bash
npm run check
```

Perintah tersebut menjalankan source hygiene, lint, unit/integration test, theme token validation, validasi katalog/deployment/static output, serta build frontend dan Catalog Manager.

User journey production:

```bash
npx playwright install chromium
npm run test:e2e
```

## Clean source ZIP

Jangan memasukkan `node_modules`, `dist`, `.catalog-manager`, coverage, hasil Playwright, cache, atau secret ke ZIP.

Setelah seluruh perubahan di-commit dan working tree bersih:

```bash
npm run validate:source
npm run package:source
```

Archive dibuat melalui `git archive`, memiliki satu root `dicekout/`, dan hanya membawa file tracked.

## Data yang harus diganti sebelum publikasi

1. Ganti produk contoh di `frontend/src/data/products.json`.
2. Masukkan gambar produk berizin ke `frontend/public/images/products/`.
3. Buat link melalui akun/program affiliate resmi; jangan menambahkan parameter affiliate sendiri.
4. Untuk Shopee, gunakan link HTTPS resmi dan pastikan klik tercatat pada Laporan Performa akun Anda.
5. Daftarkan `dicekout.id` sebagai media promosi bila diwajibkan program affiliate.
6. Sesuaikan kategori dan koleksi.
7. Ubah `catalogMode` menjadi `live` dan `allowIndexing` menjadi `true` hanya setelah seluruh data demo dihapus.
8. Tinjau disclosure dan privacy sebelum indexing diaktifkan.

Build menolak indexing ketika produk atau koleksi demo masih tersedia.

## Dokumentasi aktif

- [Arsitektur current-state](docs/ARCHITECTURE.md)
- [Kontrak dan authoring katalog](docs/CATALOG_GUIDE.md)
- [Operasional Catalog Manager](docs/CATALOG_MANAGER.md)
- [QA checklist](docs/QA_CHECKLIST.md)
- [Deployment GitHub Pages](docs/GITHUB_PAGES.md)
- [Histori implementasi](docs/history/README.md)
