# Buletin Editor — Cloud

Editor buletin A4 (ekspor PNG/PDF) dengan:
- **5 pilihan layout** (Klasik, Sidebar, Majalah, Galeri, Minimal) — hanya mengubah tata letak visual; field konten, jumlah paragraf, dan batas karakter **selalu sama** di semua layout.
- **Tema dinamis**: 12 preset warna + color picker kustom (primer, aksen, warna kertas), dengan warna teks kontras dan warna gelap turunan dihitung otomatis.
- **Simpan ke cloud** lewat Supabase: setiap buletin (teks, layout, tema, dan gambar) tersimpan sebagai satu baris data, bisa dibuka lagi kapan pun, dari perangkat mana pun.
- Upload foto header, 3 foto dokumentasi, dan background — otomatis diunggah ke Supabase Storage saat disimpan.

Proyek ini murni file statis (HTML/CSS/JS, tanpa build step), jadi bisa langsung dipublikasikan lewat GitHub + Netlify.

## Struktur proyek

```
buletin-app/
  index.html            halaman utama
  style.css             semua gaya, termasuk 5 varian layout
  app.js                logika aplikasi + integrasi Supabase
  themes.js             daftar preset tema
  layouts.js            daftar layout + ikon pratinjau
  supabase-config.js    ISI INI dengan kredensial Supabase kamu
  supabase/schema.sql   skema database + storage untuk dijalankan di Supabase
  netlify.toml          konfigurasi deploy Netlify
```

---

## 1) Setup Supabase (database + storage foto)

1. Buat akun / login di https://supabase.com dan buat **New project**.
2. Setelah project aktif, buka **SQL Editor** → **New query**, tempel seluruh isi file `supabase/schema.sql`, lalu **Run**.
   - Ini akan membuat tabel `buletins` (menyimpan judul, layout, tema, dan seluruh konten sebagai JSON).
   - Ini juga membuat bucket storage publik `buletin-images` untuk foto header/dokumentasi/background, lengkap dengan kebijakan akses.
3. Buka **Project Settings → API**, salin:
   - **Project URL**
   - **anon public** key (jangan pakai `service_role` key)
4. Buka file `supabase-config.js` di proyek ini dan isi dua nilai tersebut:

```js
window.SUPABASE_CONFIG = {
  url: "https://xxxxxxxxxxxx.supabase.co",
  anonKey: "eyJhbGciOi..."
};
```

> Catatan keamanan: `anon key` memang dirancang untuk ditaruh di kode sisi browser — ini bukan rahasia seperti `service_role` key. Keamanan datanya diatur lewat **Row Level Security (RLS)** di database (sudah diatur di `schema.sql`). Skema bawaan di sini membuat data **bisa dibaca & ditulis siapa saja yang tahu URL situsnya** (cocok untuk alat pribadi/tim kecil). Jika butuh proteksi per-pengguna (login), aktifkan Supabase Auth lalu ganti kebijakan RLS agar memvalidasi `auth.uid()`.

Buka `index.html` secara lokal (misalnya lewat ekstensi "Live Server" atau `npx serve`) untuk mengetes koneksi — badge di pojok kiri atas akan menunjukkan "Terhubung ke Supabase" bila konfigurasi benar.

---

## 2) Simpan ke GitHub

Dari dalam folder `buletin-app/`:

```bash
git init
git add .
git commit -m "Initial commit: buletin editor with Supabase + multi layout"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```

Ganti `USERNAME/NAMA-REPO` dengan repo GitHub kamu (buat dulu repo kosong di github.com jika belum ada).

**Penting:** jangan pernah commit `service_role` key. File `supabase-config.js` hanya berisi `anon key` sehingga aman untuk ikut ter-commit dan ter-deploy sebagai bagian dari situs statis.

---

## 3) Deploy ke Netlify

**Cara termudah (lewat GitHub):**
1. Login ke https://app.netlify.com
2. **Add new site → Import an existing project**
3. Pilih GitHub, lalu pilih repo yang baru kamu push
4. Build settings: kosongkan **Build command**, isi **Publish directory** dengan `.` (atau biarkan default karena sudah diatur di `netlify.toml`)
5. Klik **Deploy site**

Setiap kali kamu `git push` perubahan baru, Netlify otomatis build ulang & publish.

**Cara alternatif (drag & drop, tanpa GitHub dulu):**
- Buka https://app.netlify.com/drop, seret folder `buletin-app/` ke halaman tersebut.

---

## 4) Pakai aplikasinya

1. Pilih **Layout** (langkah 1 di panel kiri) — mengubah tata letak, bukan isi konten.
2. Pilih **Tema** preset atau atur warna kustom (primer, aksen, kertas).
3. Isi identitas, headline, foto header, narasi (3 blok, masing-masing punya batas karakter yang tampil sebagai penghitung `x/700`, dst — batas ini sama di semua layout), kutipan, 3 foto dokumentasi, dan footer.
4. Klik **Simpan ke Cloud** — foto yang baru diunggah otomatis dikirim ke Supabase Storage, lalu seluruh data (termasuk layout & tema yang dipakai) disimpan sebagai satu buletin.
5. Klik **Tersimpan** untuk melihat daftar buletin yang pernah disimpan, buka lagi untuk diedit, atau hapus.
6. Klik **PNG** / **PDF** kapan saja untuk mengekspor tampilan A4 saat ini menjadi file siap cetak — ekspor ini bekerja secara lokal di browser dan tidak memerlukan Supabase.

## Menambah layout atau tema baru

- **Tema baru**: tambahkan objek `{id, name, primary, primaryDark, accent, onPrimary, paper}` ke `themes.js`.
- **Layout baru**: tambahkan entri `{id, name, icon}` ke `layouts.js`, lalu tambahkan blok CSS baru di `style.css` dengan selektor `#a4doc[data-layout="id-kamu"] .doc-flow { grid-template-areas: ... }` untuk mengatur ulang posisi blok `blk-n1`, `blk-quote`, `blk-n2`, `blk-n3`, `blk-docs`. Field konten dan batas karakter tidak perlu (dan tidak boleh) diubah agar format tetap konsisten di semua layout.
