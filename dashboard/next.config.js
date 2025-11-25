/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true,
  },
  // Add trailing slash for better compatibility with Vercel
  trailingSlash: true,
  // Ensure proper asset prefix for subdirectory deployment
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : undefined,
  // Enable experimental features that may be helpful for Vercel deployment
  experimental: {
    appDir: true
  }
}

module.exports = nextConfig