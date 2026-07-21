# Arsitektur DicekOut

Dokumen ini menjelaskan kondisi source saat ini. Histori patch disimpan terpisah di `docs/history/`.

## Batas sistem

DicekOut terdiri dari dua aplikasi dalam satu npm workspace:

```text
dicekout/
├── frontend/                 website katalog publik React/Vite
├── tools/catalog-manager/    panel authoring lokal React/Vite + Node
├── scripts/                  validasi dan packaging source root
└── docs/                     kontrak data, operasi, QA, dan deployment
```

Website publik adalah aplikasi statis. Tidak ada checkout, payment gateway, database publik, analytics, atau click tracker pada MVP.

Catalog Manager hanya bind ke `127.0.0.1`, tidak ikut deployment, dan tidak melakukan commit/push otomatis.

## Frontend publik

### Entry dan route

- `frontend/src/main.jsx`: entry React dan urutan stylesheet.
- `frontend/src/App.jsx`: route lazy-loaded.
- `frontend/src/pages/`: orchestration halaman.
- `frontend/src/components/`: komponen layout, katalog, produk, SEO, dan feedback.

Static route, metadata, canonical, robots, sitemap, 404, Open Graph, serta structured data dibuat dan divalidasi saat build.

### Data katalog

Source of truth:

```text
frontend/src/data/site.json
frontend/src/data/categories.json
frontend/src/data/collections.json
frontend/src/data/products.json
```

Data dinormalisasi dan divalidasi melalui `frontend/src/domain/catalog/`. UI tidak boleh memindahkan business validation ke komponen presentational.

### Affiliate link

Affiliate URL diproses melalui helper security dan marketplace policy. CTA publik memakai anchor langsung menuju URL asli dengan `noopener sponsored nofollow`.

Dilarang menambah redirect `/go`, `/out`, cloaking, shortener internal, auto-click, iframe, atau rekonstruksi query parameter tanpa audit dan approval.

### Style

Urutan import stylesheet di `frontend/src/main.jsx` merupakan bagian dari cascade contract:

```text
tokens.css
index.css
base.css
home-foundation.css
catalog-cards.css
catalog-controls.css
product-detail.css
legal.css
layout-responsive.css
home.css
catalog.css
overlays.css
theme-overrides.css
product-enhancements.css
feedback.css
```

Selector hero generasi lama sudah dibersihkan. Warna semantik harus memakai token; `validate-theme-tokens.mjs` menjadi quality gate.

## Shared boundary

Catalog Manager tidak mengimpor file internal frontend secara acak. API lintas aplikasi diekspos melalui:

```text
frontend/src/shared/catalogDomain.js
frontend/src/shared/catalogConfig.js
frontend/src/shared/catalogSecurity.js
```

Entry point ini adalah boundary stabil untuk normalisasi, validasi, konfigurasi marketplace, palette, content platform, dan keamanan URL.

## Catalog Manager

### Client

- `src/App.jsx`: top-level orchestration.
- `src/components/ManagerHeader.jsx`: header aplikasi.
- `src/components/ManagerSidebar.jsx`: navigasi manager.
- `src/components/ProductLibrary.jsx`: daftar/filter produk.
- `src/components/editor/`: editor, media aside, preview, dan tab.
- `src/hooks/useCatalogManagerApi.js`: session-aware API client.
- `src/hooks/useOperationLock.js`: lock operasi browser.
- `src/hooks/useDeleteProductFlow.js`: request identity dan destructive flow.
- `src/hooks/useUnsavedChangesGuard.js`: guard perubahan belum disimpan.

### Server lokal

`server/catalogRepository.mjs` tetap menjadi façade kompatibel. Implementasi dipisah menjadi:

```text
catalogStore.mjs               baca/validasi/fingerprint kandidat katalog
catalogRepositoryUtils.mjs     konstanta versi dan helper repository
draftRepository.mjs            envelope, list, save, dan delete draft
tempMediaRepository.mjs        temporary media, checksum, usage, cleanup
backupRepository.mjs           manifest, preflight, list, restore, retention
productMutationService.mjs     apply, analyze delete, hard delete, rollback otomatis
atomicWrite.mjs                staging dan atomic replacement
security.mjs                   path containment, basename, host/session guard
imageProcessor.mjs             validasi dan optimasi gambar
```

Public API `createCatalogRepository()` tidak berubah. Draft version tetap `1`; backup version tetap `2` dengan minimum supported version `1`.

### Local state

```text
.catalog-manager/
├── drafts/
├── temp/
├── backups/
├── transactions/
└── manager.lock
```

Folder tersebut tidak boleh masuk Git, source ZIP, atau deployment.

## Mutation flow

```text
browser operation lock
→ server mutation lock
→ baca source terbaru
→ validasi candidate di memory
→ backup
→ staging/atomic replace
→ cleanup media/draft
→ validasi final
→ rollback otomatis bila gagal
```

Apply, delete, dan rollback tidak boleh berjalan bersamaan. Error tidak boleh mengklaim sukses ketika rollback tidak lengkap.

## Deployment

GitHub Actions menjalankan `npm run check`, memasang Chromium, menjalankan E2E terhadap production preview, lalu mengunggah `frontend/dist/` hanya jika seluruh quality gate lulus.

`VITE_BASE_PATH` dan `VITE_SITE_URL` divalidasi agar direct route, canonical, sitemap, dan asset path konsisten.

## Source distribution

Source ZIP resmi dibuat dari file Git yang sudah di-commit:

```bash
npm run validate:source
npm run package:source
```

`package:source` menolak working tree yang belum bersih dan memakai `git archive` dengan satu root `dicekout/`. Dependency, build, local state, coverage, report, dan secret tidak ikut archive.

## Area guarded

Perubahan berikut membutuhkan audit dan approval tersendiri:

- product schema, ID, slug, route, dan status publikasi;
- affiliate URL, attribution, redirect, tracking, dan analytics;
- TikTok Affiliate memakai content-first melalui `contentReferences`, bukan direct `affiliateLinks`;
- SEO, canonical, robots, sitemap, structured data;
- backup/draft version dan restore behavior;
- hard delete dan media lifecycle;
- auth/admin, API publik, secret, deployment, dan privacy.
