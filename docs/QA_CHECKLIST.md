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
- [ ] Upload selain PNG/WebP/JPEG atau lebih dari 8 MB ditolak.
- [ ] Apply membuat backup dan tidak melakukan commit/push.
- [ ] ID/slug duplikat, palette invalid, relasi koleksi, dan URL affiliate invalid ditolak.
- [ ] Setelah apply, `npm run check` dan preview mobile/desktop berhasil.

## Catalog Manager UX

- [ ] Nama produk baru otomatis menghasilkan ID stabil dan slug yang unik.
- [ ] ID dan slug existing tetap terkunci saat mengedit produk source.
- [ ] Nama duplikat memperoleh suffix tanpa menimpa produk existing.
- [ ] Perpindahan produk meminta konfirmasi ketika ada perubahan belum disimpan.
- [ ] Tab Informasi utama, Rekomendasi, Link & konten, dan Publikasi dapat dinavigasi dengan keyboard.
- [ ] Thumbnail PNG/WebP transparan tampil pada preview dan palette yang dipilih.
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
