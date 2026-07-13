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
