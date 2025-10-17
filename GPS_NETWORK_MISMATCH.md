# Mengapa Lokasi GPS Tidak Sesuai dengan Lokasi Jaringan?

## Penjelasan Masalah

Sistem absensi kami menggunakan dua metode untuk memverifikasi lokasi Anda:
1. **GPS** - Mendapatkan lokasi langsung dari satelit melalui perangkat Anda
2. **Lokasi Jaringan** - Memperkirakan lokasi berdasarkan alamat IP Anda

Ketika kedua lokasi ini berbeda lebih dari 500km, sistem akan menandai sebagai potensi penggunaan fake GPS.

## Penyebab Umum Perbedaan Lokasi (Tanpa Fake GPS)

### 1. Penggunaan VPN atau Proxy
- VPN mengarahkan lalu lintas internet Anda melalui server di lokasi berbeda
- Ini membuat lokasi jaringan tampak jauh dari lokasi fisik Anda
- **Solusi**: Matikan VPN saat menggunakan aplikasi absensi

### 2. Jaringan Seluler dengan Tower Jauh
- Jika Anda berada di area dengan cakupan sinyal lemah, perangkat Anda mungkin terhubung ke tower yang jauh
- Ini bisa menyebabkan estimasi lokasi jaringan yang tidak akurat
- **Solusi**: Pindah ke area dengan sinyal lebih baik atau gunakan Wi-Fi

### 3. Routing Internet yang Tidak Biasa
- Provider internet Anda mungkin merutekan koneksi melalui server di lokasi berbeda
- Hal ini terutama umum dengan provider internasional atau koneksi satelit
- **Solusi**: Hubungi provider internet Anda untuk informasi lebih lanjut

### 4. GPS yang Belum Stabil
- GPS membutuhkan waktu untuk mendapatkan sinyal yang akurat (biasanya 30-60 detik)
- Posisi awal mungkin tidak akurat sampai sinyal stabil
- **Solusi**: Tunggu beberapa menit di area terbuka sebelum melakukan absensi

### 5. Gangguan Sinyal
- Gedung tinggi, terowongan, atau cuaca buruk bisa mempengaruhi akurasi GPS
- **Solusi**: Pindah ke area terbuka dengan langit yang terlihat

## Cara Mengatasi Masalah

### Langkah-langkah Umum:
1. **Matikan VPN** jika sedang menggunakannya
2. **Gunakan koneksi Wi-Fi** yang stabil daripada jaringan seluler
3. **Tunggu sinyal GPS stabil** - biarkan aplikasi terbuka selama 1-2 menit
4. **Pastikan Anda di area terbuka** dengan pandangan jelas ke langit
5. **Restart browser** Anda dan coba lagi
6. **Coba di waktu yang berbeda** ketika koneksi internet lebih stabil

### Jika Masalah Berlanjut:
1. Hubungi administrator sistem dengan informasi:
   - Lokasi Anda saat ini
   - Jenis koneksi internet yang digunakan (Wi-Fi/seluler)
   - Apakah menggunakan VPN atau tidak
   - Waktu dan tanggal kejadian

## Catatan Penting

- Sistem kami dirancang untuk mencegah kecurangan dalam absensi
- Perbedaan lokasi bisa terjadi karena alasan teknis yang sah
- Tim IT akan meninjau kasus-kasus yang dilaporkan untuk memastikan tidak ada kecurangan

## Pertanyaan Umum

### Apakah saya dianggap menggunakan fake GPS?
Tidak selalu. Banyak faktor teknis bisa menyebabkan perbedaan lokasi tanpa menggunakan fake GPS.

### Kapan saya bisa mencoba absensi lagi?
Anda bisa mencoba kembali kapan saja. Kami sarankan mencoba di waktu dan lokasi yang berbeda.

### Apakah data lokasi saya disimpan?
Data lokasi hanya digunakan untuk verifikasi absensi dan tidak disimpan secara permanen dalam sistem kami.