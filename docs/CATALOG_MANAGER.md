# DicekOut Local Catalog Manager

Catalog Manager adalah panel lokal untuk menambah, mengedit, memvalidasi, menduplikasi, menghapus, dan memulihkan produk DicekOut. Panel hanya bind ke `http://127.0.0.1:666` dan tidak menjadi bagian deployment website.

Source panel disimpan di Git agar tersedia di laptop dan PC kantor. Data runtime berada di `.catalog-manager/` dan tidak boleh di-commit:

```text
.catalog-manager/
├── drafts/        # draft lokal
├── temp/          # hasil optimasi gambar yang belum di-apply
├── backups/       # titik pemulihan apply/delete/rollback
├── transactions/  # staging operasi file
└── manager.lock   # lock proses lokal
```

## Instalasi pertama pada setiap komputer

Gunakan Node.js `20.19+` atau `22.12+` dan npm `10+`. Buka Git Bash di root project, pastikan Catalog Manager dan dev server tidak sedang berjalan, lalu jalankan:

```bash
npm install
npm run check
npm run management
```

Root memakai npm workspaces sehingga satu `npm install` memasang dependency website dan Catalog Manager, termasuk `sharp` untuk optimasi gambar lokal. Gunakan URL bertoken yang dicetak terminal. Jangan membuka URL lama dari riwayat browser karena session token berubah setiap kali manager dijalankan.

## Workflow produk

```text
Tambah atau edit produk
→ isi data
→ upload gambar
→ sistem konversi otomatis ke WebP
→ simpan draft lokal bila belum selesai
→ validasi
→ periksa preview mobile/tablet/desktop
→ terapkan ke source
→ review Git diff
→ jalankan npm run check
→ commit dan push manual
```

Catalog Manager tidak melakukan commit, push, deploy, atau perubahan Git otomatis.

### Draft lokal

Draft berada di `.catalog-manager/drafts/`, tidak masuk Git, dan dapat menyimpan referensi gambar temporary. ID dan slug produk baru selalu diperiksa terhadap produk source **dan seluruh draft lokal** agar draft baru tidak menimpa draft lain secara diam-diam. Server memverifikasi keberadaan file temporary, basename, path final, content hash, dan checksum sebelum draft ditulis. Saat draft dihapus, gambar temporary hanya ikut dibersihkan bila tidak digunakan draft lain.

### Duplikat produk

Duplikasi membuat ID dan slug baru yang unik terhadap produk source dan draft lokal, mengubah status menjadi `draft`, serta mengosongkan affiliate link dan content reference. Gambar dapat dipakai bersama dan akan dilindungi oleh usage scan.

### Produk demo dan live

- `demo: true` untuk data contoh.
- `demo: false` untuk produk nyata.
- Produk `published` pada mode live harus lolos seluruh production gate.
- Mengubah demo/live tidak boleh mengubah URL affiliate.

## Affiliate link

Setiap link memiliki marketplace, label, URL, status aktif/nonaktif, dan satu link utama. Catalog Manager:

- mempertahankan referral code, sub-ID, campaign, UTM, deep link, urutan query, dan parameter attribution;
- menolak protokol berbahaya dan credential tertanam;
- memvalidasi hostname terhadap marketplace registry;
- tidak membuat cloaking, redirect tersembunyi, atau URL baru;
- membuka pemeriksaan link di tab baru dengan `noopener sponsored nofollow`.

## Optimasi gambar otomatis

Input yang didukung:

```text
JPG/JPEG, PNG, atau WebP statis
maksimal 25 MB
maksimal 50 megapiksel
```

Pipeline server lokal:

```text
validasi isi file
→ auto-orient
→ konversi sRGB
→ resize tanpa crop dan tanpa upscale
→ WebP adaptif
→ hapus EXIF/GPS/metadata
→ content hash
→ preview hasil final
```

Profil optimasi turun bertahap dari maksimal 1200 px kualitas 84 sampai maksimal 800 px kualitas 74. Upload gambar valid tidak dibatalkan hanya karena hasil pertama masih besar; sistem memilih hasil terakhir yang tetap layak. Original tidak disimpan ke source. Satu upload hanya menghasilkan satu file:

```text
images/products/<slug>-<content-hash>.webp
```

Gambar yang sama dideduplikasi. Ketika gambar diganti atau produk dihapus, file lama hanya dihapus bila tidak dipakai produk atau draft lain. Asset logo, favicon, fallback, Open Graph umum, dan brand tidak disentuh.

## Hard delete produk

DicekOut tidak memakai status retired, archive, tombstone, atau `deletedProducts.json`. Produk benar-benar dihapus melalui workflow terkontrol:

1. Server membaca source terbaru dan menganalisis dampak.
2. Dialog menampilkan koleksi, draft, link, konten, dan status pemakaian gambar.
3. Pengguna mengetik nama produk persis dan mencentang konfirmasi.
4. Fingerprint memastikan source belum berubah sejak analisis.
5. Mutation lock mencegah apply/delete/rollback berjalan bersamaan.
6. Backup lokal dibuat.
7. Produk dihapus dari `products.json`.
8. ID produk dibersihkan dari seluruh `collections[].productIds`.
9. Draft dan temporary media terkait dibersihkan bila eksklusif.
10. Gambar source dihapus bila tidak dipakai data lain.
11. Katalog dibaca ulang dan divalidasi.
12. Jika gagal, rollback otomatis dijalankan.

Kategori tidak ikut dihapus karena kategori tidak menyimpan daftar product ID. URL publik lama akan menuju halaman 404 yang ramah setelah build/deploy; tidak ada redirect per produk yang menambah jejak data lama.

## Backup dan rollback

Backup disimpan lokal di `.catalog-manager/backups/` dan tidak ikut Git atau deployment. Backup dapat mencakup:

- `products.json`;
- `collections.json`;
- manifest operasi;
- media yang dihapus/diganti;
- draft dan temporary media terkait.

Lima backup delete terbaru dipertahankan. Riwayat backup dapat dibuka dari sidebar. Sebelum rollback, manager membuat backup kondisi saat ini sehingga pemulihan tetap dapat dibalik. Sebelum tombol **Pulihkan** diaktifkan, preflight memeriksa versi manifest, `products.json`, `collections.json`, validasi katalog, file media/draft/temp yang tercantum, serta ketersediaan gambar yang dibutuhkan. Backup tidak lengkap, rusak, atau versi yang belum didukung ditandai tidak dapat dipulihkan.

## Transaction-like write

JSON tidak memiliki transaksi database. Catalog Manager menggunakan:

```text
mutation lock
→ validasi kandidat di memory
→ backup
→ staging file
→ atomic replace multi-file
→ cleanup media/draft
→ validasi final
→ rollback otomatis bila gagal
```

Jika pemulihan otomatis juga gagal, file rollback/backup dipertahankan dan UI tidak mengklaim operasi berhasil.

## Workflow setelah apply atau delete

```bash
git status
git diff --check
git diff -- frontend/src/data/products.json
git diff -- frontend/src/data/collections.json
npm run check
npm run dev
```

Jika hasil benar:

```bash
git add frontend/src/data/products.json frontend/src/data/collections.json frontend/public/images/products
git commit -m "Update product catalog"
git push
```

Jangan `git add .catalog-manager`.

## Pindah komputer

Produk dan gambar yang sudah di-apply, commit, dan push ikut melalui `git pull`. Draft, temporary media, backup, session, dan lock tetap lokal. Selesaikan draft di perangkat yang sama atau apply sebagai `draft` sebelum berpindah, setelah memastikan data aman masuk repository.

## Batas keamanan

- bind hanya `127.0.0.1`;
- semua endpoint API memerlukan session token sementara;
- origin/host asing ditolak;
- destructive action memakai konfirmasi server-side;
- path file dibatasi ke allowlist dan traversal ditolak;
- tidak ada GitHub token, login online, command execution, commit, atau push otomatis;
- error response tidak menampilkan stack trace;
- affiliate URL produk lain tidak boleh berubah saat apply/delete/rollback.

## Pemulihan instalasi Windows

Jika instalasi berhenti dengan `ETIMEDOUT`, `EPERM`, package tidak ditemukan, atau binary Sharp belum terpasang, tutup manager dan terminal/dev server yang memakai folder project. Dari Git Bash:

```bash
cd /c/Users/vio15/Project/dicekout

rm -rf node_modules
rm -rf frontend/node_modules
rm -rf tools/catalog-manager/node_modules
rm -rf frontend/dist
rm -rf tools/catalog-manager/dist
npm cache verify
npm ci
npm run check
npm run management
```

Project menggunakan satu `package-lock.json` di root dan registry publik dari `.npmrc`. Jangan menambahkan lockfile workspace, proxy temporer, token, atau kredensial ke source.

## Authoring label CTA marketplace

Pada tab **Link & konten**, label tombol dapat dikosongkan untuk memakai label aman otomatis. Catalog Manager menyediakan preset sesuai marketplace:

- `Lihat harga di [Marketplace]`;
- `Lihat di [Marketplace]`;
- `Buka di [Marketplace]`;
- `Cek produk di [Marketplace]`.

Custom label tetap tersedia untuk kebutuhan nyata. Panel dan validator memberi warning jika label mengandung klaim promo, harga, stok, atau urgency yang belum dapat diverifikasi. Warning tidak mengubah URL dan tidak menghapus parameter attribution.

Ketika marketplace diganti, label preset lama dikosongkan agar default baru mengikuti marketplace yang dipilih. Label custom dipertahankan agar tidak terjadi kehilangan copy tanpa konfirmasi.

## Hardening source lokal

Catalog Manager memperlakukan browser sebagai klien yang tidak dipercaya penuh walaupun server hanya berjalan di `127.0.0.1`.

- Semua endpoint `/api/*`, termasuk endpoint baca, wajib membawa session lokal yang dicetak terminal.
- Nama draft, temporary media, final media, backup, dan file static diperiksa sebagai basename/path allowlist di server.
- Resolusi path menolak `..`, path absolut, separator tersembunyi, karakter kontrol, dan escape melalui symbolic link.
- Draft ID/slug dinormalisasi dengan helper slug canonical sebelum menjadi nama file.
- Temporary media yang dibatalkan, diganti, tidak lagi direferensikan, atau kedaluwarsa dibersihkan melalui repository.
- Save draft dan apply menolak temporary media yang hilang, checksum-nya berubah, atau path finalnya tidak cocok.
- Operation lock di browser dan server mencegah save/apply/delete/rollback bertumpuk; navigasi editor dinonaktifkan selama operasi berjalan.
- Analisis delete membawa request identity sehingga respons lama tidak dapat menimpa dialog produk lain.
- Jalankan `npm run check` sebelum commit; perintah ini juga menjalankan ESLint, test repository, dan test interaksi komponen Catalog Manager.
