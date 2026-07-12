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

- [ ] Header dan menu mobile dapat dibuka dengan keyboard
- [ ] Tombol Escape menutup menu mobile
- [ ] Focus state terlihat
- [ ] Search, kategori, dan sorting bekerja
- [ ] Empty state tampil saat hasil tidak ada
- [ ] Detail produk menampilkan fallback bila gambar gagal
- [ ] Produk draft tidak tampil
- [ ] Link affiliate membuka tab baru dan mempertahankan query parameter
- [ ] Tidak ada harga, stok, rating, diskon, atau promo palsu
- [ ] Disclosure tampil dekat CTA marketplace
- [ ] Halaman 404 tidak redirect diam-diam ke beranda
- [ ] Layout diuji pada lebar 320, 375, 768, 1024, dan desktop
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
