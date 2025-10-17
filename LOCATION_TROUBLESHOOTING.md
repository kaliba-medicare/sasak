# Panduan Troubleshooting Masalah Lokasi

## Masalah Umum dan Solusi

### 1. "Lokasi Tidak Ditemukan"
**Penyebab:**
- Izin lokasi tidak diberikan
- GPS tidak aktif
- Sinyal GPS lemah
- Browser tidak mendukung geolocation

**Solusi:**
1. Pastikan izin lokasi diberikan untuk aplikasi
2. Aktifkan GPS pada perangkat Anda
3. Pastikan Anda berada di area terbuka dengan sinyal GPS yang baik
4. Gunakan browser modern seperti Chrome, Firefox, atau Edge
5. Restart browser dan coba lagi

### 2. "Lokasi Terlalu Jauh"
**Penyebab:**
- Anda berada di luar radius 50 meter dari kantor
- GPS tidak akurat

**Solusi:**
1. Pastikan Anda berada di dalam area kantor
2. Tunggu beberapa menit untuk mendapatkan sinyal GPS yang lebih akurat
3. Perbarui lokasi dengan mengklik tombol "Perbarui Lokasi"

### 3. "Lokasi Mencurigakan Terdeteksi"
**Penyebab:**
- Data lokasi tampak tidak alami (akurasi 0 atau koordinat bulat)
- Kemungkinan menggunakan aplikasi fake GPS

**Solusi:**
1. Nonaktifkan aplikasi fake GPS jika digunakan
2. Gunakan GPS asli pada perangkat Anda
3. Restart perangkat Anda

### 4. "Blocked to protect your privacy" (Diblokir untuk melindungi privasi Anda)
**Penyebab:**
- Browser secara otomatis memblokir akses lokasi untuk melindungi privasi pengguna
- Izin lokasi sebelumnya telah ditolak dan disetel ke "Block"

**Solusi:**
1. Klik ikon kunci atau informasi di sebelah kiri address bar browser
2. Temukan pengaturan izin untuk lokasi
3. Ubah izin lokasi dari "Block" menjadi "Allow" atau "Ask"
4. Refresh halaman aplikasi
5. Jika menggunakan Chrome: Klik ikon kunci → Permissions → Location → Allow

### 5. "Gak bisa di aktifin" (Tidak bisa diaktifkan)
**Penyebab:**
- Pengaturan sistem perangkat membatasi akses lokasi
- Aplikasi browser tidak memiliki izin akses lokasi
- GPS perangkat dalam keadaan tidak aktif
- Mode pesawat aktif

**Solusi:**
1. **Periksa pengaturan perangkat:**
   - Pastikan GPS/lokasi aktif di pengaturan sistem
   - Periksa apakah mode pesawat tidak aktif
2. **Periksa izin aplikasi browser:**
   - Buka pengaturan perangkat
   - Cari aplikasi browser yang digunakan
   - Pastikan izin lokasi diaktifkan
3. **Restart perangkat:**
   - Matikan dan hidupkan kembali perangkat
4. **Coba browser lain:**
   - Gunakan browser yang berbeda untuk menguji apakah masalah spesifik pada browser tertentu

## Cara Mengaktifkan Izin Lokasi

### Pada Desktop:
1. Klik ikon kunci atau informasi di sebelah kiri address bar browser
2. Pilih "Izinkan" untuk izin lokasi
3. Refresh halaman
4. Jika sudah menolak sebelumnya:
   - Klik ikon kunci → Permissions → Location → Allow
   - Atau reset pengaturan izin: Settings → Privacy → Location → Clear settings

### Pada Mobile:
1. Saat muncul popup izin lokasi, pilih "Izinkan"
2. Jika sudah menolak sebelumnya:
   - Buka Pengaturan
   - Cari nama aplikasi/browser
   - Pilih "Izin" atau "Permissions"
   - Aktifkan izin lokasi
   - Untuk Android: Settings → Apps → [Nama Browser] → Permissions → Location → Allow
   - Untuk iOS: Settings → [Nama Browser] → Location → While Using the App

## Perangkat yang Direkomendasikan

### Smartphone:
- Android 7.0 ke atas
- iOS 12 ke atas
- GPS aktif

### Browser:
- Chrome versi terbaru
- Firefox versi terbaru
- Safari (untuk iOS)
- Edge (untuk Windows)

## Tips untuk Akurasi Lokasi yang Lebih Baik

1. **Gunakan GPS perangkat asli** - Hindari aplikasi pihak ketiga
2. **Berada di area terbuka** - Hindari gedung tinggi atau area tertutup
3. **Tunggu sinyal stabil** - Biarkan aplikasi mendapatkan sinyal selama 30 detik
4. **Restart perangkat** - Jika lokasi tidak akurat
5. **Perbarui lokasi secara berkala** - Gunakan tombol "Perbarui Lokasi"

## Jika Masalah Berlanjut

1. Cek koneksi internet
2. Clear cache dan cookies browser
3. Restart browser
4. Restart perangkat
5. Hubungi administrator sistem

## Informasi Tambahan

- Sistem menggunakan radius 50 meter dari lokasi kantor untuk verifikasi
- Lokasi dicek setiap 30 detik secara otomatis
- Sistem juga memverifikasi lokasi berdasarkan IP address untuk keamanan tambahan
- Data lokasi hanya digunakan untuk verifikasi kehadiran dan tidak disimpan secara permanen

## Pertanyaan Umum

### Mengapa aplikasi memerlukan akses lokasi?
Aplikasi memerlukan akses lokasi untuk memverifikasi bahwa Anda berada di area kantor saat melakukan absensi. Ini adalah bagian dari sistem keamanan untuk mencegah kecurangan dalam absensi.

### Apakah data lokasi saya disimpan?
Data lokasi hanya disimpan sementara untuk verifikasi absensi dan tidak digunakan untuk tujuan lain. Sistem tidak menyimpan riwayat lokasi Anda secara permanen.

### Mengapa muncul pesan "Blocked to protect your privacy"?
Pesan ini muncul ketika browser Anda memblokir akses lokasi sebagai bagian dari fitur perlindungan privasi. Anda perlu secara eksplisit memberikan izin lokasi untuk aplikasi ini.

### Apakah saya bisa menggunakan aplikasi tanpa mengaktifkan lokasi?
Tidak, karena verifikasi lokasi adalah bagian penting dari sistem absensi untuk memastikan kehadiran fisik di kantor.