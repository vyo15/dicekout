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

- ESLint;
- validasi schema dan relasi katalog;
- validasi affiliate URL;
- guard data demo/indexing;
- Vite production build;
- generator static route;
- sitemap dan robots generator.

## 5. Direct link

Build menghasilkan file `index.html` pada setiap route yang diketahui, misalnya:

```text
dist/produk/index.html
dist/produk/lampu-meja-led-minimalis/index.html
dist/kategori/elektronik/index.html
```

Dengan demikian, link produk dapat dibuka langsung dari media sosial tanpa HashRouter.
