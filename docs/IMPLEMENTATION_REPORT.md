# Laporan Implementasi DicekOut

## Source dasar yang divalidasi

Source dasar:

```text
webkamu.id-clean.zip
```

Root source yang diperiksa:

```text
package.json
frontend/
backend/
data/
docs/
```

Path relevan yang diperiksa sebelum fork:

```text
package.json
frontend/package.json
frontend/vite.config.js
frontend/index.html
frontend/src/App.jsx
frontend/src/index.css
frontend/src/layouts/PublicLayout.jsx
frontend/src/pages/marketing/MarketingHome.jsx
frontend/src/pages/marketing/Marketing.css
frontend/src/pages/tenant/HostAwareHome.jsx
frontend/src/router/reservedSlugs.js
frontend/src/theme/themeMode.js
frontend/src/theme/webkamuThemeTokens.js
backend/src/server.js
backend/src/db/schema.js
backend/src/db/migrate.js
backend/src/modules/publicSites/publicSites.routes.js
backend/src/modules/publicSites/publicSites.service.js
backend/src/modules/sites/sites.routes.js
backend/src/modules/sites/sites.service.js
```

Source Inventory App tidak dipakai karena business model, route, backend, dan data flow tidak relevan dengan katalog affiliate statis.

## Keputusan arsitektur

Project dibuat sebagai fork baru, bukan menimpa Webkamu:

```text
DicekOut
├── React 19
├── Vite 7
├── React Router
├── data JSON tervalidasi
├── static route generator
└── GitHub Pages workflow
```

Komponen backend Express, SQLite, admin, client, subscription, payment, dan tenant routing tidak dibawa ke project baru.

## Implementasi utama

- Homepage bergaya katalog modern berdasarkan referensi visual, tanpa menyalin aset referensi.
- Header desktop/mobile, tema terang/gelap, skip link, focus state, dan reduced-motion support.
- Semua produk, pencarian, kategori, koleksi, detail produk, tentang, disclosure, privacy, dan 404.
- Product card reusable dengan image fallback.
- Affiliate URL runtime validation dan build-time validation.
- `rel="noopener sponsored nofollow"` tanpa `noreferrer` pada link affiliate.
- Tidak ada harga, stok, rating, diskon, countdown, atau klaim marketplace palsu.
- Data contoh diberi badge dan seluruh website masih `noindex`.
- Build guard mencegah indexing aktif selama produk/koleksi demo masih dipublikasikan.
- Route statis dibuat untuk direct link GitHub Pages.
- Robots, sitemap, canonical, Open Graph, dan Twitter metadata dibuat saat build.
- GitHub Actions untuk quality check dan deployment Pages.

## Hasil pemeriksaan

Command yang dijalankan:

```bash
VITE_BASE_PATH=/ VITE_SITE_URL=https://dicekout.id npm run check
npm audit
```

Hasil:

```text
ESLint: berhasil
Validasi katalog: berhasil
Produk: 9
Kategori: 4
Koleksi: 3
Vite production build: berhasil
Static route: 21 route berhasil dibuat
npm audit: 0 vulnerability
```

Subpath GitHub Pages juga diuji dengan:

```bash
VITE_BASE_PATH=/dicekout-id/
VITE_SITE_URL=https://example.github.io/dicekout-id
```

Hasil asset base, canonical, direct product route, dan `404.html` berhasil dibuat.

## Batasan validasi

- Produk dan tautan affiliate asli belum diberikan, sehingga source memakai data contoh tanpa outbound marketplace link.
- Domain `dicekout.id` belum diverifikasi kepemilikannya dan file `CNAME` belum dibuat.
- Tidak ada analytics atau tracker.
- Tidak ada backend, database, login, upload media, atau dashboard admin.
- Screenshot browser headless tidak dapat diselesaikan pada environment container; validasi visual dilakukan melalui review struktur/CSS responsif dan build output. Pengujian manual browser tetap perlu dilakukan setelah source dibuka di komputer pengguna.

## Sistem tema terpusat

Tema DicekOut sekarang menggunakan `frontend/src/styles/tokens.css` sebagai satu sumber design token. Komponen memakai token semantik untuk page, surface, text, border, action, status, radius, shadow, dan motion. Light mode memakai permukaan putih/abu netral; dark mode memakai charcoal modern. Alias token lama tetap dipertahankan agar kompatibilitas komponen tidak terputus.

Aturan maintainability:

- jangan menambahkan warna surface/text baru langsung di komponen bila token semantik sudah tersedia;
- primitive palette hanya untuk ilustrasi/dekorasi;
- state interaktif wajib memakai `--color-primary`, `--color-focus`, dan token status;
- token theme override hanya didefinisikan di `tokens.css`;
- `index.css` untuk reset/global typography, `site.css` untuk layout dan komponen.


## Monochrome light theme

Light mode now uses a black, white, and neutral-gray system. Accent colors are intentionally suppressed in light mode while dark mode keeps its existing charcoal treatment. Semantic tokens in `frontend/src/styles/tokens.css` remain the source of truth; component CSS should consume those tokens rather than introduce new hard-coded accent colors.


## Restrained yellow action accent

The monochrome visual system remains the default. A single yellow accent token is reserved for high-intent actions only: search submission, marketplace outbound CTA, and the mobile search action. Product cards no longer render the `featured` badge, preventing decorative labels from competing with product content. Product data and `featured` values remain unchanged for ordering and future use.

## Catalog governance hardening

- Marketplace hostname kini divalidasi melalui registry terpusat tanpa memodifikasi URL affiliate.
- Validator memeriksa file gambar, relasi data, duplikasi URL, metadata gambar, tanggal review, referensi konten, dan production readiness gate.
- Pencarian mendukung alias serta label/platform konten terkait.
- Detail produk mendukung informasi “tidak cocok untuk”, tanggal peninjauan, konten terkait, dan tombol share dengan fallback clipboard.
- Sitemap produksi mendukung `lastmod` dari tanggal review/update yang tersedia.
- Unit test dasar melindungi URL safety dan preservation of affiliate attribution.

## Theme-token consistency and branded feedback states

- Seluruh warna pada CSS komponen dipindahkan ke design token atau `color-mix()` berbasis token.
- `tokens.css` tetap menjadi satu-satunya sumber nilai warna CSS; file komponen tidak boleh menulis hex/RGB/HSL langsung.
- Palet dark mode dinetralkan agar mengikuti arah charcoal, hitam, putih, dan aksen kuning terbatas.
- Loading dan fatal error memakai asset logo yang sama dengan header/footer melalui `BrandMark`.
- Tombol `Muat ulang` tetap menjalankan reload browser dan error state menyediakan fallback kembali ke beranda yang menghormati base path GitHub Pages.
- Manifest, early theme bootstrap, dan runtime theme color diselaraskan.
- Favicon SVG legacy yang sudah tidak direferensikan dihapus; favicon PNG brand tetap menjadi sumber aktif.
- `validate-theme-tokens.mjs` kini mencegah warna hard-coded kembali masuk ke CSS komponen, token undefined, asset logo hilang, dan ketidaksinkronan browser theme colors.

## Compact social content selector

- Field existing `contentReferences` sekarang dirender pada area utama detail produk, setelah alasan rekomendasi dan sebelum CTA marketplace.
- Trigger dibuat satu baris horizontal dengan thumbnail produk, indikator play, dan logo SVG TikTok, Instagram, YouTube, serta Facebook.
- Pemilihan platform memakai `BottomSheet` existing: modal terpusat pada desktop dan bottom sheet pada mobile.
- Video tetap berada di platform asal; DicekOut tidak meng-embed, mengunduh, atau menyimpan file video.
- Link referensi tetap melalui `getSafeExternalUrl`, dibuka dengan `target="_blank"` dan `rel="noopener"`.
- Produk tanpa referensi konten tidak merender trigger atau placeholder.
- Tidak ada perubahan pada affiliate URL, attribution parameter, route, slug, SEO, dependency, atau schema produk.
- Warna brand platform ditambahkan sebagai design token terpusat agar lolos governance tema dan tidak menyebarkan literal warna ke CSS komponen.


## Local Catalog Manager foundation

Source terbaru menambahkan panel lokal pada `tools/catalog-manager/`. Panel menggunakan server Node/Vite yang hanya bind ke `127.0.0.1:666`, session token sementara untuk operasi tulis, draft/backup/temp di `.catalog-manager/`, atomic JSON write, upload PNG/WebP/JPEG, shared catalog validation, visual palette produk, serta apply ke source tanpa commit atau push otomatis. Folder tool tidak menjadi bagian deployment karena workflow Pages hanya mengunggah `frontend/dist`.

## Catalog Manager UX refresh

Local Catalog Manager sekarang memakai editor tiga kolom yang lebih terstruktur: navigasi produk, thumbnail/status/detail di sisi kiri editor, form bertab di tengah, dan live preview di kanan. ID stabil dan slug produk baru dibuat otomatis dari nama serta dikunci agar tidak berubah tanpa sengaja. Editor juga memberikan peringatan sebelum berpindah produk ketika ada perubahan yang belum disimpan, pencarian produk source, indikator status, ringkasan kelengkapan, dan validasi yang lebih mudah dibaca.


## Catalog Manager typography and one-command setup

- Catalog Manager menggunakan stack font sistem modern dengan prioritas `Segoe UI Variable Text` agar tampilan Windows lebih lembut tanpa bergantung pada font eksternal.
- Hierarki heading, label, tombol, hint, dan preview diperhalus; ukuran teks kecil dinaikkan agar lebih mudah dibaca.
- Root project menggunakan npm workspaces untuk memasang dependency `frontend/` dan `tools/catalog-manager/` melalui satu `npm install` atau `npm ci`.
- Script setup, nested npm pada `postinstall`, alias command lama, dan lockfile workspace terpisah dihapus agar instalasi lintas platform lebih sederhana.
- Catalog Manager hanya dijalankan melalui `npm run management`; `npm run check` juga menjalankan test dan build Catalog Manager.
- Registry npm publik dikonfigurasi satu kali melalui `.npmrc` root tanpa token atau kredensial.

## Catalog Manager product library navigation

Catalog Manager now keeps the sidebar focused on primary navigation instead of rendering the entire product catalog inside it. The product library is presented in a searchable and filterable table with status, category, update date, and explicit edit actions. The editor keeps the existing guarded draft, validation, backup, and manual Git workflow.

The local manager reuses the same DicekOut logo and favicon files from `frontend/public/brand/` through a localhost-only allowlisted asset route. No duplicate logo source is introduced into the manager.

## Catalog Manager full-page frame

- Catalog Manager now uses a full-width application header above the sidebar and main content.
- The header reuses the public DicekOut logo and displays the `DicekOut.ID` brand label.
- The sidebar begins below the header, remains local-only, and the main workspace fills the available viewport.
- The header search is available only on the product list so it cannot discard an unsaved editor form.


## Catalog Manager clean white navigation

- Sidebar dan area kerja memakai surface putih yang konsisten.
- Aksen kuning hanya digunakan sebagai solid fill pada CTA utama, tanpa gradient.
- Ikon navigasi menggunakan `react-icons/fi` sesuai fungsi menu.
- Menu aktif memakai surface charcoal solid agar kontras dan tetap minimalis.

## Catalog Manager hard-delete, media optimization, and recovery hardening — 2026-07-14

### Source yang divalidasi

Patch ini dibuat dari `dicekout-clean(31).zip` dengan root project langsung pada root ZIP. Stack aktual tetap npm workspaces, React/Vite frontend, Node local Catalog Manager, dan katalog JSON. File utama yang diperiksa dan disentuh:

```text
package.json
package-lock.json
tools/catalog-manager/package.json
tools/catalog-manager/src/App.jsx
tools/catalog-manager/src/styles.css
tools/catalog-manager/server/index.mjs
tools/catalog-manager/server/catalogRepository.mjs
tools/catalog-manager/server/atomicWrite.mjs
tools/catalog-manager/server/security.mjs
tools/catalog-manager/server/imageProcessor.mjs
frontend/src/domain/catalog/validateCatalogData.js
frontend/src/pages/NotFoundPage.jsx
docs/CATALOG_MANAGER.md
docs/CATALOG_GUIDE.md
docs/QA_CHECKLIST.md
```

File `tools/catalog-manager/server/imageMetadata.mjs` dihapus setelah seluruh usage dipindahkan ke `imageProcessor.mjs`. Generated files, `node_modules`, `dist`, `.catalog-manager`, lock runtime, cache, dan secret tidak termasuk patch source.

### Perubahan implementasi

- Hard delete produk dengan dependency impact scan, typed confirmation, catalog fingerprint, mutation lock, cascade cleanup seluruh `collections[].productIds`, cleanup draft/temp terkait, image usage scan, final validation, backup, dan automatic rollback.
- Tidak menambah status retired/archive, tombstone, redirect per produk, atau data produk terhapus di source.
- Binary image upload menggantikan Base64 JSON.
- Sharp hanya ditambahkan ke workspace Catalog Manager; tidak masuk bundle website publik. Root package menetapkan Node.js `20.19+` atau `22.12+` dan npm `10+` agar instalasi lintas-PC gagal lebih awal pada runtime yang tidak kompatibel.
- JPG/JPEG, PNG, dan WebP statis diproses menjadi satu WebP adaptif, maksimal 1200 px, tanpa crop/upscale, dengan auto-orient, sRGB, metadata stripping, transparency preservation, content hash, dan deduplication.
- Draft envelope menyimpan metadata temporary image; replacement/cancel/delete/startup cleanup tidak menghapus file yang masih dipakai draft lain.
- Apply, delete, dan rollback memakai backup manifest v2, atomic multi-file replacement, media/draft/temp recovery, pre-rollback safety backup, dan error escalation bila recovery otomatis tidak lengkap.
- Editor mendapat action menu, duplikasi aman, kontrol demo, affiliate link aktif/nonaktif dan primary, tanggal content reference, real optimized-image preview, conversion summary, responsive full-detail preview, backup history, rollback dialog, busy/dirty guard, serta accessible modal focus handling.
- Validator memastikan `demo` boolean, tepat satu primary affiliate link ketika link tersedia, primary tidak inactive, dan memberi warning untuk media published non-demo yang belum WebP tanpa memutus kompatibilitas legacy.
- Halaman 404 menjelaskan produk mungkin sudah dihapus dan tetap menyediakan pencarian serta kembali ke beranda.
- Raw backup ID tidak ditampilkan kepada pengguna; UI menggunakan jenis operasi, produk, dan waktu.

### Temuan baru yang diperbaiki dalam patch

- Batas file 8 MB lama tidak konsisten dengan pembengkakan Base64 dan body JSON; workflow diganti menjadi binary dengan batas keamanan 25 MB/50 MP.
- Rollback backend lama belum memiliki UI dan belum memulihkan media/draft/temp; backup diperluas dan recovery ditambahkan.
- Apply/delete sebelumnya berisiko menyembunyikan kegagalan rollback; kegagalan recovery sekarang dilaporkan sebagai operasi tidak lengkap dan backup dipertahankan.
- Dialog destructive belum memiliki focus trap, Escape handling, scroll lock, dan focus return; seluruhnya ditambahkan.
- Raw backup ID sebelumnya berpotensi tampil sebagai detail teknis; sekarang disembunyikan dari UI normal.
- Runtime `manager.lock` dari source upload tidak digunakan sebagai data project dan tetap berada di area ignored lokal.

### Hasil pemeriksaan otomatis

Command yang dijalankan pada source patch:

```bash
npm install
npm run lint
npm run test
npm run check
npm audit
```

Hasil:

```text
Frontend ESLint: berhasil
Frontend test: 6/6 berhasil
Catalog Manager test: 27/27 berhasil
Theme token validation: berhasil
Catalog validation: 9 produk, 4 kategori, 3 koleksi
Frontend production build: berhasil
Static route generation: 21 route
Catalog Manager production build: berhasil
npm audit: 0 vulnerability
```

### Runtime smoke test

Catalog Manager dijalankan pada `127.0.0.1:666` dan diperiksa tanpa mengubah source katalog:

- request API tanpa session ditolak;
- request katalog dengan session berhasil dan membaca 9 produk, 4 kategori, 3 koleksi;
- JPEG 2400 × 1600 berhasil dikirim sebagai binary;
- output menjadi WebP 1200 × 800;
- temporary preview dapat dibaca;
- endpoint discard menghapus temporary image;
- manager lock dibersihkan saat proses dihentikan.

### Batasan pengujian

- Delete dan rollback tidak dijalankan pada data katalog aktual; keduanya diuji melalui fixture repository terisolasi agar source pengguna tidak termutasi.
- Review visual interaktif tetap perlu dilakukan di browser Windows pengguna pada zoom dan breakpoint yang tercantum di `docs/QA_CHECKLIST.md`.
- Kategori, koleksi, media orphan browser, export/import lintas-PC, dan pagination besar tetap merupakan fase lanjutan terpisah sebagaimana plan; patch ini menyelesaikan workflow inti produk, delete, image, backup, rollback, dan editor yang telah disetujui.

## Patch hierarki CTA affiliate

Patch CTA menggunakan source terbaru dan tidak mengubah schema, slug, route, URL affiliate, atau parameter attribution. Perubahan utama:

- helper canonical mengurutkan link aktif dengan primary selalu pertama tanpa memutasi data;
- label CTA menyesuaikan konteks kartu, detail, sticky mobile, dan marketplace alternatif;
- kartu homepage/kategori/koleksi/terkait fokus ke detail rekomendasi;
- direct marketplace CTA hanya tersedia pada katalog desktop dengan disclosure compact;
- detail desktop memiliki quick CTA, hierarki primary/secondary marketplace, dan final CTA setelah informasi produk;
- sticky mobile disederhanakan menjadi satu primary CTA dan tombol bottom sheet untuk marketplace lain;
- Save tidak lagi ditempatkan di sticky marketplace bar;
- Catalog Manager menyediakan preset CTA aman dan warning klaim promo/harga/stok/urgency;
- validator memberi warning terhadap label CTA yang memerlukan pembuktian realtime;
- test memverifikasi primary ordering, inactive filtering, attribution preservation, contextual CTA copy, preset, dan warning label berisiko.

## Audit hardening 15 Juli 2026

Audit eksternal lama dibandingkan ulang dengan source aktual. Lima temuan server-side utama sudah tertutup pada baseline sebelum patch ini: validasi `tempMedia`, draft key aman, static media memakai contained-path resolver, seluruh API memakai session, serta cleanup temporary media aktif.

Patch lanjutan ini menambahkan defense-in-depth dan maintainability:

- basename menolak `.`/`..`, separator lintas-platform, NUL, dan karakter kontrol;
- contained-path resolver memverifikasi real path ancestor sehingga symlink tidak dapat keluar allowlist;
- regression test repository untuk traversal `saveDraft()` dan `apply()`;
- satu helper canonical untuk URL eksternal aman dan satu helper canonical untuk slug produk;
- session query diproses melalui hook/effect, bukan side effect ketika React render;
- komponen primitive, API hook, utility, dan product library dipisahkan dari `App.jsx`;
- ESLint Catalog Manager dimasukkan ke `npm run lint` dan `npm run check`;
- `.gitattributes` menetapkan line ending lintas Windows/Linux;
- file instruksi patch lama dihapus dari source utama.

## Catalog hero kitchen artwork and blended catalog shell

Patch ini mengganti artwork ruang lama pada halaman **Semua Produk** dengan kitchen artwork yang disetujui tanpa mengubah route, schema, data produk, SEO, maupun affiliate attribution.

Perubahan utama:

- asset responsif baru `catalog-kitchen-desktop.webp` dan `catalog-kitchen-mobile.webp`;
- crop desktop dan mobile dipisahkan agar subjek utama tetap terlihat tanpa browser melakukan upscale dari file kecil secara langsung;
- overlay light/dark menggunakan token theme dan fade bawah menyatukan artwork dengan area katalog;
- headline memakai bobot dan ukuran yang lebih tenang agar tidak menutupi artwork;
- search/sort/filter toolbar dipindahkan menjadi satu shell penuh di atas sidebar dan grid produk;
- hasil katalog mendapat heading semantik dan jumlah hasil yang tetap mengikuti filter URL;
- badge `Pilihan` memakai field `featured` existing tanpa menambah schema;
- asset living-room lama dihapus setelah seluruh usage diaudit nol.

Batasan: source artwork awal berukuran 736 × 589 px. Asset WebP hasil patch diproses dengan resize Lanczos dan sharpening ringan untuk mengurangi artefak browser, tetapi detail asli tetap dibatasi resolusi sumber. Penggantian ke foto asli 1920 px atau lebih dapat dilakukan kemudian tanpa mengubah markup maupun CSS.
