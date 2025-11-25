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
  basePath: process.env.NODE_ENV === 'production' ? '/ESP32AirQualityMonitor' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/ESP32AirQualityMonitor' : '',
  // Enable static export for GitHub Pages
  output: 'export',
  trailingSlash: true,
}

module.exports = nextConfig