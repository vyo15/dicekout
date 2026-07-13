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
| `contentReferences` | Link opsional ke postingan asli di media sosial. |

## Affiliate link

Contoh struktur link:

```json
{
  "marketplace": "shopee",
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

## Workflow produk live (draft → publish)

DicekOut tetap memakai JSON pada MVP. Setiap produk baru harus dimulai sebagai `draft` dan `demo: false`, lalu hanya dipublikasikan setelah checklist berikut selesai:

1. Nama, slug, ringkasan, deskripsi, kategori, dan gambar sesuai dengan produk tujuan.
2. `imageAlt`, `imageSource`, `imageLicense`, `imageWidth`, dan `imageHeight` sudah diisi.
3. `recommendationReason`, `pros`, `considerations`, `suitableFor`, dan `notSuitableFor` berisi informasi nyata.
4. `reviewedAt` menunjukkan tanggal terakhir produk, konten, dan link diperiksa.
5. `affiliateLinks` memakai ID marketplace yang terdaftar dan mempertahankan seluruh parameter referral/campaign.
6. `contentReferences` hanya berisi konten publik yang benar-benar terkait.
7. Tidak ada harga, stok, diskon, rating, review, atau klaim pengalaman yang tidak diverifikasi.
8. Jalankan `npm run check` sebelum mengubah status menjadi `published`.

### Field tambahan produk

```json
{
  "aliases": ["nama yang biasa dipakai audiens"],
  "notSuitableFor": ["siapa yang sebaiknya memilih alternatif"],
  "reviewedAt": "2026-07-13",
  "imageSource": "Sumber gambar",
  "imageLicense": "Dasar izin penggunaan",
  "imageWidth": 1200,
  "imageHeight": 1200,
  "ogImage": "images/og/nama-produk.webp",
  "contentReferences": [
    {
      "platform": "instagram",
      "label": "Judul konten",
      "url": "https://...",
      "publishedAt": "2026-07-13"
    }
  ]
}
```

`marketplaceProductId` bersifat opsional dan hanya untuk referensi internal data. Jangan tampilkan ID teknis tersebut ke pengunjung.

### Link postingan media sosial

`contentReferences` tidak menyimpan atau meng-embed video. Link hanya dipakai untuk membuka postingan publik pada platform asal melalui popup compact di halaman detail produk.

Platform dengan logo SVG brand yang tersedia:

- `tiktok`
- `instagram`
- `youtube`
- `facebook`

Nilai platform lain tetap dapat digunakan dan akan memakai ikon link generik. Gunakan satu item untuk setiap postingan nyata yang benar-benar membahas produk tersebut. Jangan memakai URL homepage platform, link contoh, postingan privat, atau postingan yang tidak terkait hanya untuk memunculkan tombol.

Contoh beberapa platform untuk satu produk:

```json
"contentReferences": [
  {
    "platform": "tiktok",
    "label": "Video singkat penggunaan produk",
    "url": "https://www.tiktok.com/@akun/video/ID_POSTINGAN",
    "publishedAt": "2026-07-13"
  },
  {
    "platform": "facebook",
    "label": "Postingan Facebook produk",
    "url": "https://www.facebook.com/akun/posts/ID_POSTINGAN",
    "publishedAt": "2026-07-13"
  }
]
```

Perilaku UI:

- field kosong: trigger video tidak dirender dan tidak menyisakan ruang kosong;
- field berisi URL aman: tampil satu baris compact dengan thumbnail produk dan logo platform;
- saat diklik: desktop memakai modal tengah, mobile memakai bottom sheet;
- link dibuka langsung di tab baru dengan `rel="noopener"`;
- URL dengan protokol berbahaya atau credential tertanam ditolak oleh helper URL dan validator katalog.

## Marketplace registry

ID marketplace yang didukung tersimpan di `frontend/src/config/marketplaces.js`. Gunakan ID tersebut pada `affiliateLinks[].marketplace`, misalnya `shopee`, `tokopedia`, `lazada`, `tiktok-shop`, `blibli`, `amazon`, atau `other`.

Gunakan `other` hanya setelah domain tujuan diperiksa manual. Validator tidak mengubah URL, query string, sub-ID, UTM, atau parameter attribution.
