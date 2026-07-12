# Panduan Katalog DicekOut

## Produk

Data produk berada di:

```text
frontend/src/data/products.json
```

Field utama:

| Field | Fungsi |
|---|---|
| `id` | ID internal stabil. Jangan diubah setelah dipakai koleksi. |
| `slug` | URL publik produk. Jangan diubah tanpa redirect plan. |
| `name` | Nama produk yang terlihat pengunjung. |
| `summary` | Ringkasan singkat untuk kartu dan meta description. |
| `description` | Informasi lebih lengkap pada halaman detail. |
| `image` | Path relatif dari folder `frontend/public/`. |
| `imageAlt` | Deskripsi gambar untuk aksesibilitas. |
| `categorySlug` | Harus cocok dengan slug kategori. |
| `collectionSlugs` | Daftar koleksi terkait. |
| `recommendationReason` | Alasan produk direkomendasikan. |
| `pros` | Kelebihan yang benar-benar dapat dipertanggungjawabkan. |
| `considerations` | Kekurangan, batasan, atau perhatian. |
| `suitableFor` | Target penggunaan yang relevan. |
| `keywords` | Kata bantu pencarian internal. |
| `featured` | Tampil di bagian rekomendasi pilihan. |
| `newest` | Tampil di bagian konten terbaru. |
| `status` | `draft` atau `published`. |
| `demo` | Harus `false` untuk produk nyata. |
| `affiliateLinks` | Tautan marketplace produk. |

## Affiliate link

Contoh struktur link:

```json
{
  "marketplace": "Shopee",
  "label": "Cek di Shopee",
  "url": "https://contoh-marketplace.test/produk?affiliate_id=JANGAN_DIUBAH",
  "isPrimary": true,
  "status": "active"
}
```

Aturan:

- Gunakan URL lengkap dengan protokol `https://` atau `http://`.
- Jangan hapus referral code, sub-ID, campaign, UTM, deep link, atau query parameter.
- Jangan gunakan `javascript:`, `data:`, URL berisi username/password, atau redirect internal dari input pengguna.
- UI membuka link langsung dengan `noopener sponsored nofollow` dan tidak memakai `noreferrer`.
- Pastikan link benar-benar menuju produk yang dijelaskan.

## Relasi koleksi

Relasi harus sinkron dua arah:

- Produk mencantumkan slug koleksi dalam `collectionSlugs`.
- Koleksi mencantumkan ID produk dalam `productIds`.

Build akan gagal jika relasi tidak sinkron.

## Harga, stok, rating, dan promo

Jangan menambahkan informasi tersebut sebelum ada proses pembaruan yang dapat dipercaya. DicekOut versi MVP menggunakan CTA “cek di marketplace” sehingga data final tetap berasal dari marketplace.

## Mengaktifkan indexing

Pada `frontend/src/data/site.json`:

```json
{
  "catalogMode": "live",
  "allowIndexing": true
}
```

Sebelum mengaktifkan:

- seluruh produk publik harus memakai `demo: false`;
- seluruh koleksi publik harus memakai `demo: false`;
- gambar dan teks sudah final;
- affiliate URL sudah diuji;
- disclosure dan privacy sudah ditinjau;
- domain dan canonical sudah benar.
