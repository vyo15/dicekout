# Deployment GitHub Pages

Project menyediakan workflow:

```text
.github/workflows/deploy-pages.yml
```

## 1. Buat repository

Nama repository yang disarankan:

```text
dicekout-id
```

Push seluruh source ke branch `main`, lalu buka:

```text
Settings → Pages → Build and deployment → Source → GitHub Actions
```

## 2. Deployment awal tanpa custom domain

Workflow memakai nilai default:

```text
VITE_BASE_PATH=/<nama-repository>/
VITE_SITE_URL=https://<username>.github.io/<nama-repository>
```

Route statis untuk produk, kategori, koleksi, disclosure, privacy, dan 404 akan dibuat saat build.

## 3. Menggunakan dicekout.id

Setelah domain dimiliki dan DNS sudah siap, buat repository variables:

```text
Settings → Secrets and variables → Actions → Variables
```

Tambahkan:

```text
VITE_BASE_PATH=/
VITE_SITE_URL=https://dicekout.id
```

Kemudian atur custom domain pada GitHub Pages. File `CNAME` sengaja tidak disertakan agar source tidak memaksa domain yang belum diverifikasi.

## 4. Quality gate

Sebelum deploy, workflow menjalankan:

```bash
npm run check
```

Perintah tersebut menjalankan:

- validasi source tree agar generated/local/secret tidak tracked;
- ESLint;
- validasi schema dan relasi katalog;
- validasi affiliate URL;
- guard data demo/indexing;
- Vite production build;
- generator static route;
- sitemap dan robots generator;
- validasi sinkronisasi `VITE_BASE_PATH` dengan path `VITE_SITE_URL`.

Setelah build, workflow memasang Chromium lalu menjalankan Playwright terhadap production preview. Deployment dibatalkan bila direct route, canonical filter, halaman 404, navigasi mobile, atau overflow utama gagal.

## 5. Direct link

Build menghasilkan file `index.html` pada setiap route yang diketahui, misalnya:

```text
dist/produk/index.html
dist/produk/lampu-meja-led-minimalis/index.html
dist/kategori/elektronik/index.html
```

Dengan demikian, link produk dapat dibuka langsung dari media sosial tanpa HashRouter.


## 6. Guard indexing dan konfigurasi URL

- Selama `allowIndexing` masih `false`, runtime dan static HTML selalu memakai `noindex,follow`; prop halaman tidak dapat membatalkan guard global ini.
- Untuk custom domain gunakan `VITE_BASE_PATH=/` dan URL origin tanpa path repository.
- Untuk domain `github.io`, path `VITE_SITE_URL` harus sama dengan `VITE_BASE_PATH`.
- Jangan mengaktifkan indexing sebelum domain, canonical, katalog live, disclosure, dan privacy selesai diverifikasi.

Build juga menjalankan `validate-static-output.mjs` untuk memastikan semua route statis, canonical, robots, sitemap, metadata sosial, 404, dan structured data telah tertulis konsisten sebelum artifact diunggah.
