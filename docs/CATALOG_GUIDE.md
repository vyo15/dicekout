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

Contoh struktur link (short link resmi Shopee):

```json
{
  "marketplace": "shopee",
  "label": "Cek di Shopee",
  "url": "https://s.shopee.co.id/9fJO0rHK9y",
  "isPrimary": true,
  "status": "active"
}
```

Atau format wrapper resmi:

```json
{
  "marketplace": "shopee",
  "label": "Cek di Shopee",
  "url": "https://s.shopee.co.id/an_redir?origin_link=https%3A%2F%2Fshopee.co.id%2Fproduct%2F123%2F456&affiliate_id=ID_AFFILIATE_ANDA&sub_id=blog",
  "isPrimary": true,
  "status": "active"
}
```

### Aturan umum (semua marketplace)

- Affiliate URL production **hanya HTTPS**. `http://` ditolak oleh validator.
- Jangan hapus referral code, sub-ID, campaign, UTM, deep link, atau query parameter. Salin persis dari dashboard affiliate resmi, jangan diketik ulang.
- Jangan gunakan `javascript:`, `data:`, URL berisi username/password, atau redirect internal DicekOut (`/go/...`, `/out/...`) dari input pengguna.
- UI membuka link langsung dengan `noopener sponsored nofollow` dan tidak memakai `noreferrer`.
- Jangan menambahkan parameter seperti `affiliate_id` atau `sub_id` secara manual ke URL produk biasa — itu tidak membuatnya menjadi link affiliate asli, dan `validateCatalogData.js` akan menolaknya.

### Format Shopee yang diterima (audited, exact-host)

Host yang diterima **persis** (subdomain lain seperti `seller.shopee.co.id`, `help.shopee.co.id`, `affiliate.shopee.co.id` **ditolak**, meskipun sama-sama domain Shopee):

- `s.shopee.co.id` — short link, contoh: `https://s.shopee.co.id/9fJO0rHK9y`. Token wajib satu segmen alfanumerik (tanpa tanda hubung/spasi/segmen tambahan) — token yang terlihat diketik manual akan ditolak.
- `shope.ee` — short link legacy, format token sama.
- `s.shopee.co.id/an_redir` atau `shope.ee/an_redir` — wrapper resmi, wajib punya `origin_link` (HTTPS, menuju `shopee.co.id`/`www.shopee.co.id`) dan `affiliate_id`.
- `shopee.co.id` / `www.shopee.co.id` **tanpa** struktur wrapper di atas dianggap URL produk biasa dan **ditolak** sebagai affiliate link, walau URL-nya sendiri valid dan aman dibuka.

Marketplace selain Shopee (Tokopedia, TikTok Shop, Lazada, Blibli, Amazon) masih memakai pemeriksaan hostname umum sampai format affiliate resminya diaudit satu per satu — lihat `frontend/src/config/marketplaces.js`.

### Kode tidak menjamin komisi

Validator hanya membuktikan **format** URL sesuai pola resmi Shopee. Validator tidak dan tidak bisa membuktikan:

- link tersebut dibuat dari akun Shopee Affiliate milik Anda (bukan akun orang lain);
- token masih aktif;
- produk yang dituju eligible untuk komisi;
- transaksi pembeli akan diselesaikan dan tidak dibatalkan/diretur.

Sebelum produk nyata dipublikasikan, pastikan manual:

1. Akun Shopee Affiliate aktif dan data pembayaran disetujui.
2. `dicekout.id` sudah didaftarkan sebagai media promosi dan disetujui Shopee.
3. Link disalin langsung dari dashboard/fitur affiliate resmi, bukan ditambahkan manual.
4. Klik uji dari halaman DicekOut muncul di Laporan Performa Shopee Affiliate.

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

Hanya ID platform yang terdaftar (`tiktok`, `instagram`, `youtube`, dan `facebook`, termasuk alias yang dinormalisasi) yang dapat dipublikasikan. Host URL harus cocok dengan platform yang dipilih; misalnya item Instagram tidak boleh menunjuk ke YouTube. Gunakan satu item untuk setiap postingan nyata yang benar-benar membahas produk tersebut. Jangan memakai URL homepage platform, link contoh, postingan privat, atau postingan yang tidak terkait hanya untuk memunculkan tombol.

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

## Aturan gambar produk melalui Catalog Manager

Untuk produk baru atau saat mengganti gambar, gunakan upload pada Catalog Manager. Sistem menerima JPG/JPEG, PNG, dan WebP statis, lalu menyimpan satu file WebP hasil optimasi. Original kualitas tinggi tidak masuk source.

Standar hasil:

- dimensi maksimum 1200 × 1200 px;
- proporsi dipertahankan;
- tidak ada crop otomatis;
- gambar kecil tidak diperbesar;
- transparansi dipertahankan;
- EXIF, GPS, dan metadata lain dihapus;
- nama file memakai slug dan content hash;
- preview editor memakai file hasil konversi, bukan original.

Jangan menyalin original besar ke `frontend/public/images/products/` secara manual. Gambar lama hanya boleh dihapus setelah usage scan memastikan tidak dipakai produk atau draft lain.

## Workflow hard delete

Produk yang dihapus melalui Catalog Manager akan dihapus permanen dari `products.json`. Server secara otomatis:

1. memindai semua koleksi, bukan hanya `product.collectionSlugs`;
2. menghapus product ID dari seluruh `collection.productIds`;
3. menghapus draft dengan ID atau slug yang sama;
4. membersihkan temporary media eksklusif;
5. menghapus gambar source hanya bila tidak dipakai data lain;
6. membuat backup lokal;
7. memvalidasi katalog setelah perubahan;
8. menjalankan rollback otomatis bila hasil akhir tidak valid.

Tidak ada status retired/archive dan tidak ada file produk terhapus di source. Konsekuensinya, URL lama produk menjadi 404 setelah build/deploy. Halaman 404 harus tetap `noindex` dan menyediakan pencarian serta tautan kembali ke beranda.

## Backup lokal

Riwayat backup hanya untuk pemulihan operasional Catalog Manager. Backup berada di `.catalog-manager/backups/`, tidak boleh di-commit, tidak menjadi data publik, dan tidak boleh digunakan sebagai sumber katalog utama. Gunakan Git sebagai riwayat perubahan jangka panjang setelah perubahan selesai diperiksa.

## Checklist sebelum apply produk

- ID dan slug produk baru dibuat otomatis; ID/slug existing tidak diubah.
- Gambar hasil optimasi tampil benar di preview mobile, tablet, dan desktop.
- Alt text, sumber, izin, dan dimensi gambar benar.
- Produk demo/live dipilih dengan sengaja.
- Tepat satu affiliate link menjadi link utama ketika link tersedia.
- Link utama aktif dan seluruh URL attribution masih identik dengan input.
- Tanggal posting content reference benar.
- Relasi koleksi sesuai.
- Tidak ada klaim harga, stok, rating, diskon, promo, atau urgency palsu.
- Validasi panel lolos.
- Setelah apply, jalankan `npm run check` dan review Git diff.

## Hierarki CTA affiliate

CTA publik mengikuti satu sumber urutan yang sama: link aktif dengan `isPrimary: true` selalu ditempatkan pertama, lalu link aktif lain mengikuti urutan data. Urutan array manual tidak boleh mengalahkan link utama.

Label default aman:

- detail produk: `Lihat harga di [Marketplace]`;
- kartu katalog desktop: `Lihat di [Marketplace]`;
- sticky mobile: `Buka di [Marketplace]`;
- marketplace alternatif: `Lihat di [Marketplace]`.

Label custom tetap diperbolehkan, tetapi jangan membuat klaim diskon, harga termurah, stok terbatas, promo hari ini, atau urgency lain tanpa data realtime yang dapat dibuktikan. URL affiliate harus dipertahankan persis, termasuk referral code, sub-ID, campaign, UTM, dan query attribution.

Alur CTA publik:

1. kartu homepage, kategori, koleksi, dan produk terkait mengarahkan pengguna ke detail rekomendasi;
2. kartu katalog desktop boleh memiliki direct CTA marketplace disertai disclosure compact di area grid;
3. detail desktop menampilkan quick CTA, panel marketplace berhierarki, dan CTA penutup setelah informasi produk;
4. detail mobile memakai satu sticky CTA utama; marketplace alternatif dibuka melalui bottom sheet;
5. checkout dan pembayaran tetap dilakukan sepenuhnya di marketplace.


## Publish readiness wajib

Produk `published` dengan `demo: false` harus lolos gate meskipun website secara keseluruhan masih berada dalam mode demo. Catalog Manager memeriksa identitas unik terhadap source dan draft, konten rekomendasi, gambar dan alt text, kategori, link marketplace aman, kecocokan platform konten, tanggal review, disclosure, serta metadata gambar untuk mode live.

Label CTA yang mengandung klaim harga, diskon, promo, stok, atau urgensi yang belum diverifikasi akan memblokir produk nyata yang hendak dipublikasikan. Parameter attribution pada URL tidak diubah oleh validator atau renderer.
