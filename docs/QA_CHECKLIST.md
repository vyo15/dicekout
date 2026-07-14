# QA Checklist DicekOut

## Otomatis

- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Validasi katalog berhasil
- [ ] Tidak ada affiliate URL berbahaya
- [ ] Semua relasi kategori/koleksi valid
- [ ] Route statis berhasil dibuat
- [ ] `robots.txt` sesuai mode katalog
- [ ] `sitemap.xml` sesuai indexing

## Manual desktop/tablet/mobile

- [ ] Navigasi desktop tetap tampil di atas 920px
- [ ] Hamburger tablet tampil pada 641–920px dan dapat digunakan dengan keyboard
- [ ] Bottom navigation tampil pada 320–640px dan tidak menutupi CTA/footer
- [ ] Active state Beranda, Produk, Koleksi, dan Lainnya sesuai route
- [ ] Tombol Cari membuka `/produk`, menggulir, dan memfokuskan input katalog
- [ ] Bottom sheet Lainnya dapat ditutup melalui tombol, backdrop, dan Escape
- [ ] Fokus keyboard tetap berada di bottom sheet dan kembali ke tombol pemicu setelah ditutup
- [ ] Daftar kategori mobile mengikuti data katalog aktual
- [ ] Safe area bawah iPhone tidak menutupi navigasi atau konten
- [ ] Drawer filter produk tampil di atas bottom navigation
- [ ] Focus state terlihat
- [ ] Search, kategori, dan sorting bekerja
- [ ] Empty state tampil saat hasil tidak ada
- [ ] Detail produk menampilkan fallback bila gambar gagal
- [ ] Produk draft tidak tampil
- [ ] Link affiliate membuka tab baru dan mempertahankan query parameter
- [ ] Tidak ada harga, stok, rating, diskon, atau promo palsu
- [ ] Disclosure tampil dekat CTA marketplace
- [ ] Halaman 404 tidak redirect diam-diam ke beranda
- [ ] Layout diuji pada lebar 320, 360, 375, 390, 430, 640, 768, 1024, dan desktop
- [ ] Perubahan orientasi dan perpindahan breakpoint tidak meninggalkan scroll lock
- [ ] Teks panjang tidak keluar dari card
- [ ] Kontras tema terang dan gelap memadai
- [ ] `prefers-reduced-motion` dihormati

## Sebelum indexing aktif

- [ ] Semua `demo` sudah `false`
- [ ] `catalogMode` sudah `live`
- [ ] `allowIndexing` sudah `true`
- [ ] Domain dan canonical benar
- [ ] Open Graph image dapat diakses publik
- [ ] Disclosure dan privacy sudah ditinjau

## Tema light dan dark

- [ ] Toggle tema bekerja dari header dan menu mobile.
- [ ] Pilihan tema tetap tersimpan setelah reload.
- [ ] Kunjungan pertama mengikuti system theme.
- [ ] Tidak ada flash putih mencolok saat membuka dark mode.
- [ ] Header, hero, kartu, filter, bottom sheet, footer, dan bottom navigation konsisten.
- [ ] Focus ring terlihat jelas di kedua tema.
- [ ] Teks utama, muted text, border, CTA, dan state aktif memiliki kontras yang cukup.
- [ ] Logo tetap terbaca tanpa kotak putih mencolok.
- [ ] `meta[name="theme-color"]` mengikuti tema aktif.


## Monochrome light mode

- [ ] Homepage uses only black, white, and neutral grays in light mode.
- [ ] Product, category, collection, filter, and detail states do not reintroduce colored accents in light mode.
- [ ] Primary CTAs are black with white text and preserve accessible focus states.
- [ ] Dark mode remains unchanged and readable after switching themes.


## Restrained accent QA

- [ ] Light theme remains predominantly black, white, and neutral gray.
- [ ] Yellow appears only on search submit, marketplace CTA, and mobile search action.
- [ ] Product cards do not show a featured/Pilihan badge.
- [ ] Demo and newest status labels remain readable and factual.
- [ ] Yellow action text meets contrast requirements in light and dark themes.

## Production catalog gate

- [ ] `catalogMode` tetap `demo` sampai seluruh placeholder diganti.
- [ ] Produk live tidak memakai ilustrasi SVG demo.
- [ ] Setiap produk live memiliki minimal satu affiliate link aktif.
- [ ] Host affiliate URL sesuai marketplace registry.
- [ ] Tidak ada affiliate URL identik pada produk berbeda.
- [ ] Referral code, sub-ID, campaign, UTM, dan query parameter tetap utuh.
- [ ] `reviewedAt`, sumber gambar, izin gambar, dan dimensi gambar terisi.
- [ ] Kelebihan, perhatian, cocok, dan tidak cocok ditulis berdasarkan informasi nyata.
- [ ] Konten sosial terkait membuka URL HTTPS yang benar.
- [ ] Tombol Bagikan bekerja; fallback menyalin URL ketika Web Share API tidak tersedia.
- [ ] Disclosure dan privacy memiliki pengelola, kontak, tanggal berlaku, dan tanggal pembaruan sebelum mode live.
- [ ] OG image produk tersedia sebelum link produk dibagikan secara luas.
- [ ] Sitemap memuat `lastmod` hanya dari tanggal yang valid.
- [ ] `npm run test`, `npm run lint`, validasi katalog, dan build berhasil.

## Theme token dan feedback state

- [ ] `npm run validate:theme` berhasil tanpa warna hard-coded di CSS komponen.
- [ ] Light mode tetap monokrom dengan aksen kuning hanya pada aksi yang disetujui.
- [ ] Dark mode memakai surface charcoal/netral dan tidak kembali ke palet biru/cyan lama.
- [ ] Loading route menampilkan logo DicekOut, spinner, dan tidak menghasilkan flash putih pada dark mode.
- [ ] Fatal error menampilkan logo, ikon peringatan, tombol `Muat ulang`, dan tautan kembali ke beranda.
- [ ] Tombol `Muat ulang` benar-benar memanggil reload dan tidak mengubah route/affiliate URL.
- [ ] Favicon, Apple touch icon, PWA icon, dan manifest memakai asset/warna brand terbaru.
- [ ] Direct route GitHub Pages tetap dapat kembali ke base path repository.

## Local Catalog Manager
- [ ] Hanya bind ke `127.0.0.1:666`.
- [ ] Origin asing dan request write tanpa session ditolak.
- [ ] Draft lokal tidak muncul di `git status`.
- [ ] JPG/JPEG, PNG, dan WebP statis sampai batas keamanan 25 MB diproses; file rusak, MIME palsu, animasi, format lain, atau resolusi di atas 50 MP ditolak.
- [ ] Apply membuat backup lengkap, menulis source secara transaction-like, dan tidak melakukan commit/push.
- [ ] ID/slug duplikat, palette invalid, relasi koleksi, dan URL affiliate invalid ditolak.
- [ ] Setelah apply, `npm run check` dan preview mobile/desktop berhasil.

## Catalog Manager UX

- [ ] Nama produk baru otomatis menghasilkan ID stabil dan slug yang unik.
- [ ] ID dan slug existing tetap terkunci saat mengedit produk source.
- [ ] Nama duplikat memperoleh suffix tanpa menimpa produk existing.
- [ ] Perpindahan produk meminta konfirmasi ketika ada perubahan belum disimpan.
- [ ] Tab Informasi utama, Rekomendasi, Link & konten, dan Publikasi dapat dinavigasi dengan keyboard.
- [ ] Thumbnail hasil konversi WebP, termasuk transparansi, tampil pada preview dan palette yang dipilih.
- [ ] Produk SVG demo existing tetap dapat dipreview secara lokal.
- [ ] Search sidebar menemukan nama, slug, dan status produk.
- [ ] Apply tetap membuat backup serta tidak melakukan commit atau push otomatis.


## Setup lintas komputer dan tipografi Catalog Manager

- [ ] Dari clone baru, `npm ci` memasang dependency frontend dan Catalog Manager melalui npm workspaces.
- [ ] Hanya ada satu lockfile dependency di root project.
- [ ] Tidak ada `postinstall`, script setup, atau alias `catalog:manager*`/`management:*`.
- [ ] `npm run check` memeriksa frontend serta test dan build Catalog Manager.
- [ ] `npm run management` menjalankan Catalog Manager di `http://127.0.0.1:666`.
- [ ] Heading, label, hint, tombol, sidebar, dan preview tetap terbaca pada zoom 100%, 125%, dan 150%.
- [ ] Tidak ada font eksternal atau font file baru yang dibutuhkan.

## Catalog Manager navigation and branding

- [ ] Sidebar contains navigation only and does not grow with the number of products.
- [ ] Product library search matches name, slug, status, and category.
- [ ] Status and category filters work together.
- [ ] Editing a source product opens the existing editor without changing its ID or slug.
- [ ] Draft-local navigation only lists local drafts.
- [ ] Sidebar logo matches the public DicekOut website logo.
- [ ] Browser favicon matches `frontend/public/brand/favicon-64.png`.
- [ ] Unknown files under `/brand-assets/` return 404.

### Catalog Manager full-page layout

- [ ] Header spans the full browser width without outer page margins.
- [ ] Header displays the same DicekOut logo used by the public website.
- [ ] Brand label reads `DicekOut.ID`.
- [ ] Sidebar begins below the header and fills the remaining viewport height.
- [ ] Main content fills the remaining page width.
- [ ] Header search is disabled while editing a product.
- [ ] Tablet and mobile layouts stack without horizontal overflow.


## Catalog Manager clean visual

- [ ] Sidebar, header, kartu, tabel, dan editor tampil putih bersih serta konsisten.
- [ ] Tidak ada gradient pada tombol atau sidebar.
- [ ] Aksen kuning tampil sebagai solid fill pada CTA utama.
- [ ] Ikon Produk, Produk baru, Draft lokal, dan Perlu ditinjau sesuai fungsinya.
- [ ] Active state tetap jelas dengan keyboard dan pointer.

## Catalog Manager hard delete

- [ ] Aksi hapus hanya berada di menu aksi, bukan tombol satu klik.
- [ ] Dialog analisis menampilkan produk target, koleksi, draft, link, konten, dan status pemakaian gambar.
- [ ] Tombol delete source tetap disabled sebelum nama produk diketik persis dan checkbox dikonfirmasi.
- [ ] Penghapusan memakai product ID dari server, bukan index array, nama, slug, atau path dari browser.
- [ ] Fingerprint yang stale membatalkan delete tanpa mengubah source.
- [ ] Double-click atau dua tab tidak dapat menjalankan mutation bersamaan.
- [ ] Produk target hilang tepat satu kali dari `products.json`.
- [ ] Product ID hilang dari semua `collections[].productIds`, termasuk relasi yang sebelumnya tidak sinkron.
- [ ] Kategori tidak ikut dihapus.
- [ ] Draft dengan ID/slug target dibersihkan.
- [ ] Temporary media target dibersihkan bila tidak dipakai draft lain.
- [ ] Gambar eksklusif target dihapus dari `frontend/public/images/products/`.
- [ ] Gambar bersama tetap tersedia dan produk lain tetap dapat memuatnya.
- [ ] Logo, favicon, fallback, OG umum, dan brand asset tidak tersentuh.
- [ ] Affiliate URL produk lain identik sebelum dan sesudah delete.
- [ ] Backup dibuat sebelum source berubah.
- [ ] Lima backup delete terbaru dipertahankan.
- [ ] Kegagalan setelah sebagian operasi memicu rollback otomatis dan tidak menampilkan status sukses.
- [ ] UI reload katalog dari server setelah delete berhasil.
- [ ] URL produk yang sudah dihapus menampilkan 404 ramah dan tetap `noindex`.

## Catalog Manager image optimization

- [ ] Upload dikirim sebagai binary, bukan Base64 JSON.
- [ ] JPEG besar dikonversi ke WebP dan dimensi tidak melebihi 1200 × 1200 px.
- [ ] PNG transparan mempertahankan alpha.
- [ ] Gambar kecil tidak di-upscale.
- [ ] Portrait dan landscape tidak di-crop.
- [ ] Orientasi EXIF diperbaiki.
- [ ] EXIF/GPS/metadata tidak terbawa ke output.
- [ ] Jika profil pertama masih besar, sistem mencoba profil adaptif tanpa membatalkan gambar valid.
- [ ] Source hanya menyimpan satu output WebP; original, thumbnail, mobile, dan desktop variant tidak ikut tersimpan.
- [ ] Nama output memakai slug dan content hash.
- [ ] Upload file identik tidak membuat source image duplikat.
- [ ] Preview menampilkan output WebP server yang sama dengan calon file source.
- [ ] Ringkasan menunjukkan ukuran/dimensi asli, hasil, dan persentase penghematan.
- [ ] Mengunggah gambar pengganti membersihkan temporary lama yang tidak direferensikan.
- [ ] Membatalkan editor membersihkan temporary eksklusif.
- [ ] Temporary yang direferensikan draft tidak dibersihkan TTL.
- [ ] Temporary orphan lebih dari 24 jam dibersihkan saat manager dimulai.
- [ ] Apply gagal tidak menghapus gambar source lama.
- [ ] Ganti gambar berhasil menghapus gambar lama hanya jika tidak dipakai data lain.

## Catalog Manager backup, rollback, dan accessibility

- [ ] Riwayat backup tidak menampilkan ID teknis kepada pengguna.
- [ ] Backup invalid ditandai dan tombol pulihkan disabled.
- [ ] Rollback membuat backup kondisi saat ini sebelum restore.
- [ ] Rollback mengembalikan JSON, media, draft, dan temporary terkait.
- [ ] Rollback dapat dibalik melalui backup pengaman baru.
- [ ] Jika rollback gagal, pemulihan kondisi sebelum rollback dicoba otomatis.
- [ ] Dialog delete/rollback memiliki `role="dialog"`, label, description, focus awal, focus trap, Escape, backdrop close, dan mengembalikan fokus ke pemicu.
- [ ] Busy state mencegah tombol destructive dijalankan berulang.
- [ ] Data form tetap ada ketika upload, validasi, apply, delete, atau rollback gagal.
