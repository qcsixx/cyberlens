# CyberLens - Aplikasi Deteksi Ancaman Keamanan

CyberLens adalah aplikasi web modern untuk mendeteksi potensi ancaman keamanan dari teks yang diambil melalui kamera. Aplikasi ini menggunakan teknologi OCR (Optical Character Recognition) untuk mengekstrak teks dari gambar, kemudian menganalisisnya untuk mengidentifikasi potensi risiko keamanan seperti phishing, penipuan, atau konten berbahaya lainnya.

## Fitur Utama

- 📷 **Akses Kamera Langsung**: Mengaktifkan kamera laptop secara otomatis (dengan izin pengguna)
- 🔍 **OCR Terintegrasi**: Mengekstrak teks dari gambar menggunakan Tesseract.js
- 🛡️ **Analisis Ancaman**: Menganalisis teks untuk mendeteksi potensi risiko keamanan
- 📊 **Penilaian Risiko**: Menampilkan tingkat risiko (aman, waspada, bahaya) dengan tingkat kepercayaan
- 💡 **Rekomendasi**: Memberikan saran tindakan berdasarkan hasil analisis
- 🕒 **Riwayat Pemindaian**: Menyimpan dan menampilkan hasil pemindaian sebelumnya

## Tech Stack

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **OCR**: Tesseract.js
- **Penyimpanan**: LocalStorage untuk menyimpan riwayat pemindaian
- **UI/UX**: Desain responsif dengan tema biru-putih

## Cara Menggunakan

1. Buka aplikasi di browser
2. Berikan izin akses kamera ketika diminta
3. Arahkan kamera ke teks yang ingin dianalisis
4. Klik tombol "Capture Now" untuk mengambil gambar
5. Tunggu proses OCR dan analisis selesai
6. Lihat hasil analisis dan rekomendasi tindakan
7. Riwayat pemindaian akan tersimpan secara otomatis

## Pengembangan Lokal

```bash
# Clone repositori
git clone https://github.com/username/cyberlens.git

# Masuk ke direktori proyek
cd cyberlens

# Instal dependensi
npm install

# Jalankan server pengembangan
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser untuk melihat aplikasi.

## Lisensi

MIT

---

Dibuat dengan ❤️ oleh Tim Keamanan Siber
