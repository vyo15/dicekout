# DicekOut Local Catalog Manager

Panel ini hanya berjalan di komputer lokal pada `http://127.0.0.1:666`. Source panel disimpan di Git agar tersedia di laptop dan PC kantor, tetapi `.catalog-manager/` berisi draft, backup, upload sementara, lock, dan session lokal sehingga tidak boleh di-commit.

## Instalasi pertama pada setiap komputer

Buka Git Bash di folder utama project. Pastikan Catalog Manager dan dev server belum berjalan, lalu cukup jalankan:

```bash
npm install
```

Root project memakai npm workspaces untuk memasang dependency:

- website di `frontend/`;
- Local Catalog Manager di `tools/catalog-manager/`.

Tidak ada script `postinstall`, setup tambahan, atau alias command panel. Setelah selesai, jalankan:

```bash
npm run check
npm run management
```

## Workflow harian

```bash
git pull
npm run management
```

Buka URL bertoken yang dicetak terminal. Di panel: tambah/edit produk → simpan draft lokal → upload gambar → pilih palette → validasi → terapkan ke source. Tombol tersebut tidak melakukan commit, push, atau deploy.

Setelah apply:

```bash
git status
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

## Pindah komputer

Produk yang sudah di-apply, commit, dan push akan ikut melalui `git pull`. Draft lokal dan backup tidak ikut. Selesaikan draft pada perangkat yang sama atau apply sebagai `draft` lalu commit hanya bila isinya aman berada di repository.

## Batas keamanan

- bind hanya `127.0.0.1`;
- write membutuhkan session token sementara;
- tidak ada GitHub token, login online, command execution, commit, atau push otomatis;
- media hanya PNG/WebP/JPEG maksimal 8 MB;
- seluruh URL affiliate dipertahankan apa adanya dan divalidasi oleh registry marketplace;
- backup JSON dibuat sebelum apply.


## Pemulihan instalasi Windows

Jika instalasi sebelumnya berhenti dengan `ETIMEDOUT`, `EPERM`, atau package `vite` tidak ditemukan, tutup Catalog Manager dan semua terminal/dev server yang memakai folder project. Lalu jalankan dari Git Bash:

```bash
cd /c/Users/vio15/Project/dicekout

rm -rf node_modules
rm -rf frontend/node_modules
rm -rf tools/catalog-manager/node_modules
npm cache verify
npm ci
npm run check
npm run management
```

Project menggunakan satu `package-lock.json` di root dan registry publik yang dikonfigurasi melalui `.npmrc` root. Jangan menambahkan lockfile workspace terpisah atau mengisi `.npmrc` dengan proxy temporer, token, maupun kredensial.
