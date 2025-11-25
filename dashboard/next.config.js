/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['firebasestorage.googleapis.com'],
    unoptimized: true,
  },
  env: {
    customKey: process.env.customKey,
  },
  // GitHub Pages configuration
  // basePath: '/ESP32AirQualityMonitor',
  // assetPrefix: '/ESP32AirQualityMonitor',
  trailingSlash: true,
}

module.exports = nextConfig