# 📄 Alam Cabe Barokah — Generator Surat Jalan Otomatis

Aplikasi web khusus untuk memproses file **Purchase Order (PO)** harian dan secara otomatis membuat **1 file PDF tunggal** berisi seluruh Surat Jalan (2 alamat berbeda per halaman A4 tanpa duplikat).

---

## 🎯 Spesifikasi Output

Ada **2 mode input** yang bisa dipilih di halaman pertama:

| Mode | Input | Output PDF |
| --- | --- | --- |
| **Scan PDF PO** | Upload file PDF Purchase Order | 1 halaman A4 berisi **2 outlet** (atas & bawah, ada garis potong) |
| **Scan Teks PO** | Tempel teks PO (WhatsApp/Excel/catatan) | 1 halaman A4 berisi **1 outlet penuh** |

1. **1 Kali Proses = 1 File PDF Lengkap**:
   - Seluruh cabang/outlet pesanan langsung digabungkan ke dalam **satu file PDF** siap cetak atau simpan.
2. **Format Halaman**:
   - **Mode PDF**: 2 alamat berbeda per halaman A4 + garis `- - potong di sini - -`.
   - **Mode Teks**: 1 outlet per halaman A4 dengan format surat jalan yang sama, hanya lebih lega.
3. **Format Nama File Otomatis**:
   - Mode PDF: `SJ-011126.pdf`
   - Mode Teks: `SJ-011126-1Outlet.pdf`
4. **Cabang & Item Tanpa Pesanan Otomatis Dilewati**:
   - Cabang yang pesanannya `0 kg` tidak dicetak ke PDF agar hemat kertas.
   - Item produk dengan QTY 0 tidak dimasukkan ke dalam tabel surat jalan.

---

## 🚀 Cara Menjalankan Lokal

1. Buka Terminal / PowerShell di folder project:
   ```bash
   cd m:\PERSONAL-PROJECT\suratjalan
   ```
2. Jalankan Server:
   ```bash
   npm run dev
   ```
3. Buka di Browser:
   Akses: **[http://localhost:3000](http://localhost:3000)**

---

## 🌐 Panduan Deploy ke GitHub & Hosting Online

Aplikasi ini **100% Client-Side** (seluruh proses pembacaan PDF, OCR, dan pembuatan dokumen Surat Jalan berjalan di browser pengguna tanpa memerlukan server backend atau database). Oleh karena itu, aplikasi ini **sangat didukung untuk di-deploy secara gratis**:

### Langkah 1: Push Project ke GitHub

1. Buka terminal atau GitHub Desktop:
   ```bash
   cd m:\PERSONAL-PROJECT\suratjalan
   git init
   git add .
   git commit -m "feat: surat jalan generator alam cabe barokah"
   ```
2. Buat repository baru di [github.com/new](https://github.com/new) (misal: `suratjalan`).
3. Hubungkan dan push:
   ```bash
   git remote add origin https://github.com/<username-kamu>/suratjalan.git
   git branch -M main
   git push -u origin main
   ```

---

### Opsi Deploy A: Vercel (Paling Mudah & Sangat Direkomendasikan ⭐)

Vercel adalah pembuat Next.js dan menyediakan hosting gratis selamanya dengan domain HTTPS otomatis:

1. Buka [vercel.com](https://vercel.com) dan login dengan akun GitHub Anda.
2. Klik tombol **"Add New..."** $\rightarrow$ **"Project"**.
3. Pilih repository `suratjalan` yang baru di-push.
4. Klik **"Deploy"** (tanpa perlu mengubah konfigurasi apapun).
5. Dalam 1 menit, web aplikasi Anda sudah online dan dapat diakses dari HP maupun komputer di alamat `https://suratjalan.vercel.app`!
6. Setiap kali Anda melakukan `git push` ke GitHub, Vercel akan otomatis meng-update web secara instan.

---

### Opsi Deploy B: Langsung di GitHub Pages (100% Hosting di GitHub)

File alur otomatis GitHub Actions sudah disiapkan di `.github/workflows/deploy.yml`:

1. Buka repository Anda di GitHub.
2. Masuk ke menu **Settings** $\rightarrow$ **Pages** (di sidebar kiri).
3. Pada bagian **Build and deployment** $\rightarrow$ **Source**, ubah dari *Deploy from a branch* menjadi:
   **GitHub Actions**.
4. Lakukan `git push` ke branch `main`.
5. GitHub Actions akan otomatis me-build dan merilis website ke:
   `https://<username-kamu>.github.io/suratjalan/`

---

## 📖 Alur Penggunaan

1. **Pilih Mode Input**:
   - **Scan PDF PO**: unggah file PDF Purchase Order.
   - **Scan Teks PO**: tempel teks PO. Format yang didukung: PO pengiriman (`Tgl 2/11` + daftar `- NAMA BARANG : 1.5 kg` + `kirim ke CK DEPOK`), tabel tab/pipe (`|`), baris ringkas `tanggal outlet angka...`, atau blok `Outlet:` + nama barang & QTY. Nama barang bebas.
2. **Koreksi & Rincian**:
   - Periksa pesanan per cabang, ubah kuantitas jika ada koreksi, serta tetapkan Plat Nomor atau Kendaraan pengantar (bisa menggunakan tombol *"Semua"* untuk menerapkan ke seluruh cabang sekaligus).
3. **Preview & Unduh**:
   - Lihat tampilan seluruh halaman PDF secara langsung.
   - Klik tombol **"Unduh PDF"** untuk mendapatkan 1 file PDF yang memuat semua cabang siap cetak.
