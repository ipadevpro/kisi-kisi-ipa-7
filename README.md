# Jejak IPA 7

Latihan interaktif persiapan **ASAS Ganjil IPA Kelas VII 2026/2027**, bergaya Duolingo.
Berupa situs statis (HTML, CSS, JavaScript biasa) yang siap dipasang di GitHub Pages, tanpa proses build.

**Isi aplikasi**
- 17 pelajaran singkat dalam 5 bab. Setiap pelajaran ditautkan ke nomor soal di kisi-kisi.
- Kisi-kisi ASAS (35 nomor soal) ditulis ulang dengan bahasa yang mudah dipahami siswa kelas 7, bisa disaring per bab. Di awal tiap pelajaran ada ringkasan kisi-kisi yang terlipat. Kunci jawaban, bobot, dan detail skenario soal asli **tidak** ditampilkan.
- Soal latihan dibuat sekonsep dengan kisi-kisi, tetapi skenario, angka, dan kalimat jawabannya berbeda dari naskah ASAS.
- Materi ringkas per bab.
- Soal pilihan ganda, isian angka, menjodohkan, mengelompokkan, dan alat ukur interaktif (jangka sorong, mikrometer, neraca Ohaus, termometer, mistar, gelas ukur) dengan angka acak.
- Uji coba 20 soal acak dengan daftar pelajaran yang perlu diulang.
- Nilai dikirim ke Google Sheet guru (opsional).
- Bisa dipakai tanpa internet setelah sekali dibuka, dan bisa dipasang ke layar utama HP.

## 1. Mengaktifkan GitHub Pages

1. Buka repo ini di GitHub → **Settings** → **Pages**.
2. Di **Build and deployment**, pilih **Source: Deploy from a branch**.
3. Pilih branch **main** dan folder **/ (root)**, lalu **Save**.
4. Tunggu 1–2 menit. Alamatnya: `https://<nama-akun>.github.io/kisi-kisi-ipa-7/`

Link langsung yang bisa dibagikan ke grup kelas:

| Tujuan | Akhiran link |
|---|---|
| Kisi-kisi | `#kisi` (per bab: `#kisi-u1` … `#kisi-u5`) |
| Uji coba 20 soal | `#uji-coba` |
| Pelajaran tertentu | `#u2l4` (Neraca Ohaus), dst. ID ada di `assets/data.js` |
| Materi bab | `#materi-u3` |

## 2. Menghubungkan Google Sheet (opsional)

Tanpa langkah ini, aplikasi tetap jalan; progres hanya tersimpan di HP siswa.

1. Buat Google Sheet baru, misalnya "Nilai Jejak IPA 7".
2. Menu **Ekstensi → Apps Script**. Hapus isi `Code.gs`, tempel isi file [`apps-script/Code.gs`](apps-script/Code.gs), lalu simpan.
3. Klik **Terapkan → Deployment baru**. Pilih jenis **Aplikasi web**.
   - *Jalankan sebagai*: **Saya**
   - *Yang memiliki akses*: **Siapa saja**
4. Klik **Terapkan**, izinkan akses akun Google, lalu salin **URL aplikasi web** (berakhiran `/exec`).
5. Buka `config.js` di repo ini, tempel URL tadi ke `sheetUrl`, lalu commit.

Setelah itu, beranda menampilkan isian **nama panggilan + kelas**. Setiap pelajaran dan uji coba yang selesai akan masuk ke sheet **Hasil**. Sheet **Rekap Uji Coba** berisi jumlah percobaan, nilai terbaik, dan rata-rata per siswa.

**Kenapa tidak kena CORS:** aplikasi mengirim `POST` dengan `Content-Type: text/plain`. Itu termasuk *simple request*, jadi browser tidak mengirim preflight `OPTIONS` (yang memang tidak bisa dijawab Apps Script). Balasan Apps Script diteruskan lewat `script.googleusercontent.com` yang memberi header `Access-Control-Allow-Origin: *`. Kalau siswa sedang offline, hasil disimpan di antrean dan dikirim ulang otomatis. Setiap hasil punya ID unik, jadi kiriman ganda diabaikan oleh skrip.

**Jika skrip diubah**, buat versi baru: **Terapkan → Kelola deployment → ✏️ → Versi: Baru → Terapkan**. URL-nya tetap sama.

Data yang dikirim hanya nama panggilan, kelas, nilai, durasi, dan kode perangkat acak. Tidak ada email atau nomor HP.

## 3. Mengubah atau menambah soal

Semua soal ada di [`assets/data.js`](assets/data.js); penjelasan format ada di bagian atas file itu. Soal alat ukur yang angkanya acak dibuat di [`assets/figures.js`](assets/figures.js) (objek `GEN`). Kisi-kisi ada di [`assets/kisi.js`](assets/kisi.js).

Tanggal ujian, nama sekolah, dan daftar kelas diatur di [`config.js`](config.js).

## 4. Mencoba di komputer sendiri

```bash
python3 -m http.server 8000
```

Lalu buka `http://localhost:8000`.

## Struktur

```
index.html              halaman utama
config.js               pengaturan (URL Google Sheet, tanggal ujian, kelas)
manifest.webmanifest    data aplikasi untuk "Tambahkan ke layar utama"
sw.js                   service worker (mode tanpa internet)
assets/style.css        tampilan
assets/figures.js       helper, gambar alat ukur, generator soal acak
assets/kisi.js          kisi-kisi ASAS
assets/data.js          bab, materi, dan soal
assets/app.js           logika aplikasi
assets/fonts, vendor, icons
apps-script/Code.gs     penerima nilai untuk Google Sheet
```
