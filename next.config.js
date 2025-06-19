/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [],
  },
  // Tambahkan konfigurasi webpack khusus untuk Tesseract.js jika diperlukan
  webpack: (config, { isServer }) => {
    // Konfigurasi untuk worker Tesseract.js
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig; 